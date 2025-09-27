import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const profileSchema = z.object({
  phone: z.string().min(10, 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 10 หลัก'),
  firstName: z.string().min(1, 'กรุณากรอกชื่อ'),
  lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
  hnNumber: z.string().min(1, 'กรุณากรอกเลขที่ HN'),
  temple: z.string().min(1, 'กรุณากรอกชื่อวัด'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional().or(z.literal('')),
  consent: z.boolean().refine(val => val === true, 'ต้องยินยอมการเก็บข้อมูลส่วนบุคคล')
})

export async function PUT(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json()
    const { phone, firstName, lastName, hnNumber, temple, email, consent } = profileSchema.parse(body)

    // Check if phone is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        phone: phone,
        id: { not: user.id }
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'เบอร์โทรศัพท์นี้มีผู้ใช้งานแล้ว' },
        { status: 400 }
      )
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        phone,
        firstName,
        lastName,
        hnNumber,
        temple,
        email: email || null,
        consent
      }
    })

    return NextResponse.json({
      success: true,
      message: 'บันทึกข้อมูลสำเร็จ',
      user: {
        id: updatedUser.id,
        phone: updatedUser.phone,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        hnNumber: updatedUser.hnNumber,
        temple: updatedUser.temple,
        email: updatedUser.email,
        consent: updatedUser.consent
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' },
      { status: 500 }
    )
  }
}
