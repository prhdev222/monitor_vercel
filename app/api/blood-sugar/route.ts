import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bloodSugarSchema = z.object({
  value: z.union([
    z.literal('high'),
    z.literal('low'),
    z.string().refine((val) => {
      const num = Number(val)
      return !isNaN(num) && num >= 1 && num <= 999 && Number.isInteger(num)
    }, {
      message: 'ค่าต้องเป็น high, low หรือตัวเลขจำนวนเต็มระหว่าง 1-999'
    })
  ]),
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

export async function PUT(request: NextRequest) {
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
    const { id, value, unit, timeOfDay, notes, recordedAt } = bloodSugarSchema.extend({
      id: z.string()
    }).parse(body)

    const record = await prisma.bloodSugarRecord.update({
      where: {
        id,
        userId: user.id
      },
      data: {
        value,
        unit,
        timeOfDay,
        notes,
        recordedAt: recordedAt ? new Date(recordedAt) : undefined
      }
    })

    return NextResponse.json({
      success: true,
      message: 'แก้ไขค่าน้ำตาลในเลือดสำเร็จ',
      record
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Blood sugar update error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    const { id } = z.object({ id: z.string() }).parse(body)

    await prisma.bloodSugarRecord.delete({
      where: {
        id,
        userId: user.id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'ลบค่าน้ำตาลในเลือดสำเร็จ'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Blood sugar delete error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบข้อมูล' },
      { status: 500 }
    )
  }
}