import { NextRequest, NextResponse } from 'next/server'
import { runDataCleanup } from '@/lib/data-cleanup'

export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบ API key เพื่อความปลอดภัย
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('Cron cleanup started')
    
    const result = await runDataCleanup()
    
    if (result.success) {
      console.log('Cron cleanup completed successfully')
      return NextResponse.json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString()
      })
    } else {
      console.error('Cron cleanup failed:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Cron cleanup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Cron cleanup failed'
    }, { status: 500 })
  }
}




