import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { lineId, displayName, pictureUrl, email } = await request.json()

    if (!lineId) {
      return NextResponse.json(
        { success: false, error: 'LINE ID is required' },
        { status: 400 }
      )
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
      user = await prisma.user.create({
        data: {
          lineId,
          firstName: displayName || '',
          email: email || null,
          consent: false
        }
      })
      console.log('New user created:', user.id)
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

    return response
  } catch (error) {
    console.error('LINE login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}