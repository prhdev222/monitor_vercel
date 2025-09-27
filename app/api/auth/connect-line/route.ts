import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'ไม่พบ token' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json(
        { error: 'Token ไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    const { lineId, displayName, pictureUrl, email, accessToken } = await request.json()
    console.log('Connect LINE API called with:', { lineId, displayName, hasAccessToken: !!accessToken })

    if (!lineId) {
      return NextResponse.json(
        { success: false, error: 'LINE ID is required' },
        { status: 400 }
      )
    }

    // Check if LINE ID is already used by another user
    const existingLineUser = await prisma.user.findFirst({
      where: {
        lineId: lineId,
        id: { not: user.id }
      }
    })

    if (existingLineUser) {
      return NextResponse.json(
        { success: false, error: 'LINE account นี้ถูกใช้งานโดยผู้ใช้คนอื่นแล้ว' },
        { status: 400 }
      )
    }

    // Update user with LINE data
    const updateData = {
      lineId: lineId,
      lineUserId: lineId, // Store LINE User ID in both fields
      lineDisplayName: displayName || '',
      // Update firstName if it's empty and we have displayName
      firstName: user.firstName || displayName || user.firstName,
      // Update email if it's empty and we have email from LINE
      email: user.email || email || user.email
    }
    
    console.log('Updating user with LINE data:', updateData)
    
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData
    })
    
    console.log('User updated successfully:', {
      id: updatedUser.id,
      lineId: updatedUser.lineId,
      lineUserId: updatedUser.lineUserId,
      lineDisplayName: updatedUser.lineDisplayName,
      firstName: updatedUser.firstName
    })

    // Generate new JWT token with updated data
    const newToken = generateToken({
      id: updatedUser.id,
      phone: updatedUser.phone || '',
      firstName: updatedUser.firstName || '',
      lastName: updatedUser.lastName || '',
      hnNumber: updatedUser.hnNumber || '',
      temple: updatedUser.temple || '',
      email: updatedUser.email || '',
      consent: updatedUser.consent
    })

    const response = NextResponse.json({
      success: true,
      message: 'เชื่อม LINE account สำเร็จ',
      user: {
        id: updatedUser.id,
        phone: updatedUser.phone,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        hnNumber: updatedUser.hnNumber,
        temple: updatedUser.temple,
        email: updatedUser.email,
        consent: updatedUser.consent,
        lineId: updatedUser.lineId,
        lineUserId: updatedUser.lineUserId,
        lineDisplayName: updatedUser.lineDisplayName
      }
    })

    // Update cookie with new token
    response.cookies.set('auth-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Connect LINE error:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการเชื่อม LINE account' },
      { status: 500 }
    )
  }
}

// Import generateToken function
import { generateToken } from '@/lib/auth'
