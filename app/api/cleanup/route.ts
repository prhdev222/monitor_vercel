import { NextResponse } from 'next/server'
import { runDataCleanup } from '@/lib/data-cleanup'

export async function POST() {
  try {
    const result = await runDataCleanup()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      })
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Cleanup API error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการทำความสะอาดข้อมูล' },
      { status: 500 }
    )
  }
}
