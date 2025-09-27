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
    let user = await prisma.user.findUnique({
      where: { lineId }
    })

    if (!user) {
      // Create new user with LINE data
      user = await prisma.user.create({
        data: {
          lineId,
          firstName: displayName || '',
          email: email || null,
          consent: false
        }
      })
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

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        consent: user.consent
      }
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
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