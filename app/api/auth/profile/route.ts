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
    console.log('Profile update API called')
    
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
    console.log('Request body:', body)
    
    const validatedData = profileSchema.parse(body)
    const { phone, firstName, lastName, hnNumber, temple, email, consent } = validatedData

    console.log('Validated data:', validatedData)

    // Check if phone is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        phone: phone,
        id: { not: user.id }
      }
    })

    if (existingUser) {
      console.log('Phone number already taken by user:', existingUser.id)
      return NextResponse.json(
        { success: false, error: 'เบอร์โทรศัพท์นี้มีผู้ใช้งานแล้ว' },
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

    console.log('User updated successfully:', updatedUser.id)

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
    console.error('Profile update error:', error)
    
    if (error instanceof z.ZodError) {
      console.log('Validation error:', error.errors)
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' },
      { status: 500 }
    )
  }
}
