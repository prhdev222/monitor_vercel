import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bloodSugarSchema = z.object({
  value: z.number().min(0).max(1000, 'ค่าน้ำตาลในเลือดไม่สมเหตุสมผล'),
  unit: z.string().default('mg/dL'),
  timeOfDay: z.enum(['before_breakfast', 'before_lunch', 'before_dinner', 'after_meal_2h', 'before_bed'], {
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
    const { value, unit, timeOfDay, notes, recordedAt } = bloodSugarSchema.parse(body)

    const record = await prisma.bloodSugarRecord.create({
      data: {
        userId: user.id,
        value,
        unit,
        timeOfDay,
        notes,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'บันทึกค่าน้ำตาลในเลือดสำเร็จ',
      record
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Blood sugar record error:', error)
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

    const records = await prisma.bloodSugarRecord.findMany({
      where: { userId: user.id },
      orderBy: { recordedAt: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await prisma.bloodSugarRecord.count({
      where: { userId: user.id }
    })

    return NextResponse.json({
      success: true,
      records,
      total,
      hasMore: offset + limit < total
    })

  } catch (error) {
    console.error('Get blood sugar records error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
}
