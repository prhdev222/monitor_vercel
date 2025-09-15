import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bloodPressureSchema = z.object({
  systolic: z.number().min(50).max(300, 'ค่าความดันโลหิตไม่สมเหตุสมผล'),
  diastolic: z.number().min(30).max(200, 'ค่าความดันโลหิตไม่สมเหตุสมผล'),
  pulse: z.number().min(30).max(200).optional(),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'before_bed'], {
    errorMap: () => ({ message: 'กรุณาเลือกเวลาที่วัด' })
  }),
  notes: z.string().optional(),
  recordedAt: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'ไม่พบ token' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Token ไม่ถูกต้อง' }, { status: 401 })
    }

    const body = await request.json()
    const { systolic, diastolic, pulse, timeOfDay, notes, recordedAt } = bloodPressureSchema.parse(body)

    const record = await prisma.bloodPressureRecord.create({
      data: {
        userId: user.id,
        systolic,
        diastolic,
        pulse,
        timeOfDay,
        notes,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'บันทึกข้อมูลความดันโลหิตสำเร็จ',
      record
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Blood pressure record error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'ไม่พบ token' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Token ไม่ถูกต้อง' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '30')
    const offset = parseInt(searchParams.get('offset') || '0')

    const records = await prisma.bloodPressureRecord.findMany({
      where: { userId: user.id },
      orderBy: { recordedAt: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await prisma.bloodPressureRecord.count({
      where: { userId: user.id }
    })

    return NextResponse.json({
      success: true,
      records,
      total,
      hasMore: offset + limit < total
    })

  } catch (error) {
    console.error('Get blood pressure records error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
}
