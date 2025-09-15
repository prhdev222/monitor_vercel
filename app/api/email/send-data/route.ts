import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendDataToClinic } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    console.log('Send email API called')
    
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      console.log('No token found')
      return NextResponse.json({ error: 'ไม่พบ token' }, { status: 401 })
    }

    const user = verifyToken(token)
    if (!user) {
      console.log('Invalid token')
      return NextResponse.json({ error: 'Token ไม่ถูกต้อง' }, { status: 401 })
    }

    console.log('User verified:', user.phone)

    // Check if user has consent
    if (!user.consent) {
      console.log('User has no consent')
      return NextResponse.json(
        { error: 'คุณยังไม่ได้ยินยอมการแชร์ข้อมูล' },
        { status: 400 }
      )
    }

    // Check environment variables
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Missing email configuration')
      return NextResponse.json(
        { error: 'ระบบอีเมลยังไม่ได้ตั้งค่า กรุณาติดต่อผู้ดูแลระบบ' },
        { status: 500 }
      )
    }

    // Get all user data
    console.log('Fetching user data...')
    const [bloodPressureRecords, bloodSugarRecords] = await Promise.all([
      prisma.bloodPressureRecord.findMany({
        where: { userId: user.id },
        orderBy: { recordedAt: 'desc' }
      }),
      prisma.bloodSugarRecord.findMany({
        where: { userId: user.id },
        orderBy: { recordedAt: 'desc' }
      })
    ])

    console.log(`Found ${bloodPressureRecords.length} BP records and ${bloodSugarRecords.length} BS records`)

    // Send email to clinic
    console.log('Sending email...')
    const emailResult = await sendDataToClinic({
      user: {
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        hnNumber: user.hnNumber || undefined,
        temple: user.temple || undefined,
        phone: user.phone,
        email: user.email || undefined
      },
      bloodPressureRecords: bloodPressureRecords.map(record => ({
        systolic: record.systolic,
        diastolic: record.diastolic,
        pulse: record.pulse || undefined,
        timeOfDay: record.timeOfDay,
        notes: record.notes || undefined,
        recordedAt: record.recordedAt
      })),
      bloodSugarRecords: bloodSugarRecords.map(record => ({
        value: record.value,
        unit: record.unit,
        timeOfDay: record.timeOfDay,
        notes: record.notes || undefined,
        recordedAt: record.recordedAt
      }))
    }, 'full_data')

    console.log('Email result:', emailResult)

    // Log email attempt
    try {
      await prisma.emailLog.create({
        data: {
          userId: user.id,
          type: 'full_data',
          status: emailResult.success ? 'sent' : 'failed',
          recipient: process.env.CLINIC_EMAIL || 'clinic@example.com'
        }
      })
    } catch (logError) {
      console.error('Error logging email:', logError)
      // Don't fail the request if logging fails
    }

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'ส่งข้อมูลให้คลินิกสำเร็จ'
      })
    } else {
      return NextResponse.json(
        { 
          error: 'เกิดข้อผิดพลาดในการส่งอีเมล', 
          details: emailResult.error || 'ไม่ทราบสาเหตุ'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Send email error:', error)
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการส่งข้อมูล',
        details: error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ'
      },
      { status: 500 }
    )
  }
}
