import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserByPhone } from '@/lib/auth'
import { z } from 'zod'

const registerSchema = z.object({
  phone: z.string().min(10, 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 10 หลัก'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  name: z.string().optional(),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional(),
  consent: z.boolean().refine(val => val === true, 'ต้องยินยอมการเก็บข้อมูลส่วนบุคคล')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password, name, email, consent } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await findUserByPhone(phone)
    if (existingUser) {
      return NextResponse.json(
        { error: 'เบอร์โทรศัพท์นี้มีผู้ใช้งานแล้ว' },
        { status: 400 }
      )
    }

    // Create new user
    const user = await createUser(phone, password, name, email)
    
    // Update consent status
    await prisma.user.update({
      where: { id: user.id },
      data: { consent }
    })

    return NextResponse.json({
      success: true,
      message: 'ลงทะเบียนสำเร็จ',
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        consent: user.consent
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลงทะเบียน' },
      { status: 500 }
    )
  }
}
