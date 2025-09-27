import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'
import { Client } from '@line/bot-sdk'

// Function to verify LINE access token and get profile
async function verifyLineToken(accessToken: string) {
  try {
    // Use LINE API directly to verify access token
    const response = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    if (!response.ok) {
      console.error('LINE API response not ok:', response.status, response.statusText)
      return null
    }
    
    const profile = await response.json()
    console.log('LINE profile verified:', profile.userId)
    return profile
  } catch (error) {
    console.error('LINE token verification failed:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('LINE login API called')
    let { lineId, displayName, pictureUrl, email, accessToken } = await request.json()
    console.log('Received data:', { lineId, displayName, hasAccessToken: !!accessToken })

    if (!lineId) {
      return NextResponse.json(
        { success: false, error: 'LINE ID is required' },
        { status: 400 }
      )
    }

    // If accessToken is provided, verify it
    if (accessToken) {
      const verifiedProfile = await verifyLineToken(accessToken)
      if (!verifiedProfile) {
        console.log('LINE token verification failed, but continuing with provided data')
        // Don't fail completely, just log the issue
      } else {
        console.log('LINE token verified for user:', verifiedProfile.userId)
        // Use verified profile data if available
        if (verifiedProfile.displayName) {
          displayName = verifiedProfile.displayName
        }
        if (verifiedProfile.pictureUrl) {
          pictureUrl = verifiedProfile.pictureUrl
        }
      }
    } else {
      console.log('No access token provided, using provided profile data')
    }

    // Check if user already exists
    console.log('Looking for user with lineId:', lineId)
    let user = await prisma.user.findUnique({
      where: { lineId }
    })
    console.log('User found:', !!user, user ? `ID: ${user.id}` : 'No user found')

    if (!user) {
      // Create new user with LINE data
      console.log('Creating new user with LINE data:', {
        lineId,
        firstName: displayName || '',
        email: email || null
      })
      try {
        user = await prisma.user.create({
          data: {
            lineId,
            firstName: displayName || '',
            email: email || null,
            consent: false
          }
        })
        console.log('New user created successfully:', user.id)
      } catch (createError) {
        console.error('Error creating user:', createError)
        return NextResponse.json(
          { success: false, error: 'Failed to create user' },
          { status: 500 }
        )
      }
    } else {
      console.log('Using existing user:', user.id)
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      phone: user.phone || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      hnNumber: user.hnNumber || '',
      temple: user.temple || '',
      email: user.email || '',
      consent: user.consent
    })

    // Check if user profile is complete
    const isProfileComplete = user.phone && user.firstName && user.lastName && 
                             user.hnNumber && user.temple && user.consent

    console.log('Profile completeness check:', {
      phone: !!user.phone,
      firstName: !!user.firstName,
      lastName: !!user.lastName,
      hnNumber: !!user.hnNumber,
      temple: !!user.temple,
      consent: user.consent,
      isComplete: isProfileComplete
    })

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone || '',
        firstName: user.firstName,
        lastName: user.lastName,
        hnNumber: user.hnNumber,
        temple: user.temple,
        email: user.email,
        consent: user.consent
      },
      isProfileComplete,
      redirectTo: isProfileComplete ? '/dashboard' : '/profile'
    })

    console.log('Response prepared:', {
      success: true,
      userId: user.id,
      isProfileComplete,
      redirectTo: isProfileComplete ? '/dashboard' : '/profile'
    })

    // Set cookie with LINE Browser compatibility
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const, // Changed back to 'lax' for better compatibility
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/' // Ensure cookie is available for all paths
    }
    
    response.cookies.set('auth-token', token, cookieOptions)
    
    console.log('Cookie set successfully:', {
      tokenLength: token.length,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    })

    console.log('LINE login API completed successfully')
    return response
  } catch (error) {
    console.error('LINE login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}