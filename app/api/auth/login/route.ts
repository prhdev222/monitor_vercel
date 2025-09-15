import { NextRequest, NextResponse } from 'next/server'
import { findUserByPhone, verifyPassword, generateToken } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
  phone: z.string().min(10, 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 10 หลัก'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password } = loginSchema.parse(body)

    // Find user by phone
    const user = await findUserByPhone(phone)
    if (!user) {
      return NextResponse.json(
        { error: 'ไม่พบผู้ใช้งาน' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'รหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      phone: user.phone,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      hnNumber: user.hnNumber || undefined,
      temple: user.temple || undefined,
      email: user.email || undefined,
      consent: user.consent
    })

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        hnNumber: user.hnNumber,
        temple: user.temple,
        email: user.email,
        consent: user.consent
      }
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    )
  }
}
