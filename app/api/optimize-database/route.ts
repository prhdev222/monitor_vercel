import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const results = []

    // 1. VACUUM เพื่อลบ dead space
    console.log('Running VACUUM...')
    await prisma.$executeRaw`VACUUM`
    results.push('✅ VACUUM completed - ลบ dead space แล้ว')

    // 2. ANALYZE เพื่ออัปเดต statistics
    console.log('Running ANALYZE...')
    await prisma.$executeRaw`ANALYZE`
    results.push('✅ ANALYZE completed - อัปเดต statistics แล้ว')

    // 3. ลบ email logs เก่า (มากกว่า 30 วัน)
    console.log('Cleaning old email logs...')
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const deletedEmailLogs = await prisma.emailLog.deleteMany({
      where: {
        sentAt: {
          lt: thirtyDaysAgo
        }
      }
    })
    results.push(`✅ ลบ email logs เก่า ${deletedEmailLogs.count} รายการ`)

    // 4. ตรวจสอบขนาดหลัง optimization
    const dbSize = await prisma.$queryRaw<Array<{ size: string }>>`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `

    // 5. ตรวจสอบ dead tuples
    const deadTuples = await prisma.$queryRaw<Array<{ 
      schemaname: string, 
      tablename: string, 
      n_dead_tup: bigint 
    }>>`
      SELECT schemaname, tablename, n_dead_tup 
      FROM pg_stat_user_tables 
      WHERE n_dead_tup > 0
      ORDER BY n_dead_tup DESC
    `

    return NextResponse.json({
      success: true,
      message: 'การปรับปรุงฐานข้อมูลเสร็จสิ้น',
      results,
      currentSize: dbSize[0]?.size || 'Unknown',
      deadTuples: deadTuples.map(t => ({
        table: `${t.schemaname}.${t.tablename}`,
        deadTuples: Number(t.n_dead_tup)
      })),
      recommendations: [
        'รัน VACUUM FULL หากต้องการลดขนาดให้มากที่สุด (จะล็อกตารางชั่วคราว)',
        'ตั้งค่า autovacuum ให้ทำงานบ่อยขึ้น',
        'พิจารณาใช้ connection pooling',
        'ตรวจสอบ indexes ที่ไม่จำเป็น'
      ]
    })

  } catch (error) {
    console.error('Database optimization error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'เกิดข้อผิดพลาดในการปรับปรุงฐานข้อมูล',
        details: error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ'
      },
      { status: 500 }
    )
  }
}

