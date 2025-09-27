import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyPassword, hashPassword } from '@/lib/auth'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน'),
  newPassword: z.string().min(6, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร')
})

export async function PUT(request: NextRequest) {
  try {
    console.log('Change password API called')
    
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      console.log('No auth token found')
      return NextResponse.json(
        { success: false, error: 'ไม่พบ token' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)
    if (!user) {
      console.log('Invalid token')
      return NextResponse.json(
        { success: false, error: 'Token ไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    console.log('User authenticated:', user.id)

    // Parse and validate request body
    const body = await request.json()
    console.log('Request body received')
    
    const validatedData = changePasswordSchema.parse(body)
    const { currentPassword, newPassword } = validatedData

    // Get user from database to check current password
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!dbUser) {
      console.log('User not found in database')
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ใช้' },
        { status: 404 }
      )
    }

    // Check if user has a password (some users might not have password if they registered via LINE)
    if (!dbUser.password) {
      console.log('User does not have a password set')
      return NextResponse.json(
        { success: false, error: 'คุณยังไม่ได้ตั้งรหัสผ่าน กรุณาใช้การเข้าสู่ระบบด้วย LINE หรือติดต่อผู้ดูแลระบบ' },
        { status: 400 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, dbUser.password)
    if (!isCurrentPasswordValid) {
      console.log('Current password is incorrect')
      return NextResponse.json(
        { success: false, error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword)

    // Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword
      }
    })

    console.log('Password updated successfully for user:', user.id)

    return NextResponse.json({
      success: true,
      message: 'เปลี่ยนรหัสผ่านสำเร็จ'
    })

  } catch (error) {
    console.error('Change password error:', error)
    
    if (error instanceof z.ZodError) {
      console.log('Validation error:', error.errors)
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' },
      { status: 500 }
    )
  }
}
