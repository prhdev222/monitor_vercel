import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'

// Function to exchange authorization code for access token
async function exchangeCodeForToken(code: string) {
  try {
    const channelId = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID
    const channelSecret = process.env.LINE_CHANNEL_SECRET
    const redirectUri = process.env.NEXT_PUBLIC_LINE_REDIRECT_URI

    if (!channelId || !channelSecret || !redirectUri) {
      throw new Error('LINE configuration missing')
    }

    const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: channelId,
        client_secret: channelSecret,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Token exchange failed:', response.status, errorText)
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await response.json()
    return tokenData
  } catch (error) {
    console.error('Error exchanging code for token:', error)
    throw error
  }
}

// Function to get user profile from LINE API
async function getLineProfile(accessToken: string) {
  try {
    const response = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      console.error('Profile fetch failed:', response.status, response.statusText)
      throw new Error('Failed to fetch profile')
    }

    const profile = await response.json()
    return profile
  } catch (error) {
    console.error('Error fetching profile:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    console.log('LINE callback received:', { code: !!code, state, error })

    // Check for errors from LINE
    if (error) {
      console.error('LINE login error:', error)
      return NextResponse.redirect(new URL('/login?error=line_login_failed', request.url))
    }

    // Check if authorization code is present
    if (!code) {
      console.error('No authorization code received')
      return NextResponse.redirect(new URL('/login?error=no_code', request.url))
    }

    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(code)
    console.log('Token exchange successful:', { 
      hasAccessToken: !!tokenData.access_token,
      hasIdToken: !!tokenData.id_token 
    })

    // Get user profile from LINE
    const profile = await getLineProfile(tokenData.access_token)
    console.log('Profile fetched:', { 
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl 
    })

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { lineUserId: profile.userId }
    })

    if (!user) {
      // Create new user with LINE data
      console.log('Creating new user with LINE data:', {
        lineId: profile.userId,
        displayName: profile.displayName
      })

      try {
        user = await prisma.user.create({
          data: {
            lineUserId: profile.userId,
            lineDisplayName: profile.displayName || '',
            firstName: profile.displayName || '',
            email: null,
            consent: false
          }
        })
        console.log('New user created successfully:', {
          id: user.id,
          lineUserId: user.lineUserId,
          lineDisplayName: user.lineDisplayName
        })
      } catch (createError) {
        console.error('Error creating user:', createError)
        return NextResponse.redirect(new URL('/login?error=user_creation_failed', request.url))
      }
    } else {
      // Update existing user's LINE display name if needed
      if (profile.displayName && user.lineDisplayName !== profile.displayName) {
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            lineDisplayName: profile.displayName,
            firstName: profile.displayName 
          }
        })
        console.log('Updated user LINE display name')
      }
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

    // Create response with redirect
    const redirectUrl = new URL(isProfileComplete ? '/dashboard' : '/profile', request.url)
    const response = NextResponse.redirect(redirectUrl)

    // Set cookie with LINE Browser compatibility
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    }
    
    response.cookies.set('auth-token', token, cookieOptions)
    
    console.log('LINE login completed successfully:', {
      userId: user.id,
      lineUserId: user.lineUserId,
      isProfileComplete,
      redirectTo: isProfileComplete ? '/dashboard' : '/profile'
    })

    return response
  } catch (error) {
    console.error('LINE callback error:', error)
    return NextResponse.redirect(new URL('/login?error=callback_failed', request.url))
  }
}
