import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // ขนาดฐานข้อมูลทั้งหมด (ปลอดภัยบน Neon)
    const dbSize = await prisma.$queryRaw<Array<{ size: string }>>`
      SELECT pg_size_pretty(pg_database_size(current_database())) AS size
    `

    // ขนาดตารางใน schema public + ประมาณการจำนวนแถว (n_live_tup)
    const rawTableSizes = await prisma.$queryRaw<Array<{
      table_name: string,
      size: string,
      row_count: any
    }>>`
      SELECT 
        n.nspname || '.' || c.relname AS table_name,
        pg_size_pretty(pg_total_relation_size(c.oid)) AS size,
        COALESCE(s.n_live_tup, 0) AS row_count
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY pg_total_relation_size(c.oid) DESC
    `

    // แปลงค่า BigInt → Number เพื่อป้องกัน JSON serialize error
    const tableSizes = rawTableSizes.map((t) => ({
      table_name: t.table_name,
      size: t.size,
      row_count: typeof t.row_count === 'bigint' ? Number(t.row_count) : Number(t.row_count ?? 0)
    }))

    // จำนวนนับจริงด้วย Prisma (แน่นอนกว่า estimate)
    const [userCount, bpCount, bsCount, emailLogCount] = await Promise.all([
      prisma.user.count(),
      prisma.bloodPressureRecord.count(),
      prisma.bloodSugarRecord.count(),
      prisma.emailLog.count()
    ])

    // ฟิลด์ที่ Neon ไม่อนุญาตให้ดึง (ต้อง superuser) → แสดงเป็น N/A
    const systemTablesSize = 'N/A'
    const walSize = 'N/A'

    return NextResponse.json({
      database: {
        totalSize: dbSize[0]?.size || 'Unknown',
        systemTablesSize,
        walSize
      },
      tables: tableSizes,
      recordCounts: {
        users: userCount,
        bloodPressureRecords: bpCount,
        bloodSugarRecords: bsCount,
        emailLogs: emailLogCount
      },
      explanation: {
        whyLarge: [
          'Prisma Query Engine & Client มีขนาดคงที่ค่อนข้างใหญ่',
          'PostgreSQL มี overhead จาก indexes/metadata/system catalogs',
          'WAL/transaction logs (ไม่สามารถอ่านขนาดได้บน Neon)',
          'dead tuples ที่ยังไม่ vacuum'
        ],
        recommendations: [
          'เรียก /api/optimize-database เพื่อ VACUUM/ANALYZE',
          'ตั้ง cleanup/retention ให้ข้อมูลไม่บวม',
          'จำกัดความยาว notes และลดจำนวน index ที่ไม่จำเป็น'
        ]
      }
    })

  } catch (error) {
    console.error('Database stats error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูลฐานข้อมูล' },
      { status: 500 }
    )
  }
}
