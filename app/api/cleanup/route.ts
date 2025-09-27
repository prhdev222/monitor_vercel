import { NextRequest, NextResponse } from 'next/server'
import { runDataCleanup } from '@/lib/data-cleanup'

export async function POST(request: NextRequest) {
  try {
    console.log('Cleanup API called')
    
    const result = await runDataCleanup()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Cleanup API error:', error)
    return NextResponse.json({
      success: false,
      error: 'เกิดข้อผิดพลาดในการทำความสะอาดข้อมูล'
    }, { status: 500 })
  }
}