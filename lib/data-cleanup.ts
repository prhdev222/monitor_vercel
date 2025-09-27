import { prisma } from './prisma'
import { sendDataToClinic } from './email'

export async function cleanupOldData() {
  // ลดเวลาเก็บข้อมูลจาก 3 เดือน เป็น 1 เดือน
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  console.log(`Starting data cleanup for records older than ${oneMonthAgo.toISOString()}`)

  // Get all users with old data
  const usersWithOldData = await prisma.user.findMany({
    where: {
      OR: [
        {
          bloodPressureRecords: {
            some: {
              recordedAt: {
                lt: oneMonthAgo
              }
            }
          }
        },
        {
          bloodSugarRecords: {
            some: {
              recordedAt: {
                lt: oneMonthAgo
              }
            }
          }
        }
      ]
    },
    include: {
      bloodPressureRecords: {
        where: {
          recordedAt: {
            lt: oneMonthAgo
          }
        }
      },
      bloodSugarRecords: {
        where: {
          recordedAt: {
            lt: oneMonthAgo
          }
        }
      }
    }
  })

  console.log(`Found ${usersWithOldData.length} users with old data`)

  for (const user of usersWithOldData) {
    try {
      // Send email before deletion if user has consent
      if (user.consent && (user.bloodPressureRecords.length > 0 || user.bloodSugarRecords.length > 0)) {
        console.log(`Sending pre-deletion email for user ${user.phone}`)
        
        const emailResult = await sendDataToClinic({
          user: {
            firstName: user.firstName || undefined,
            lastName: user.lastName || undefined,
            hnNumber: user.hnNumber || undefined,
            temple: user.temple || undefined,
            phone: user.phone,
            email: user.email || undefined
          },
          bloodPressureRecords: user.bloodPressureRecords.map(record => ({
            systolic: record.systolic,
            diastolic: record.diastolic,
            pulse: record.pulse || undefined,
            timeOfDay: record.timeOfDay,
            notes: record.notes || undefined,
            recordedAt: record.recordedAt
          })),
          bloodSugarRecords: user.bloodSugarRecords.map(record => ({
            value: record.value,
            unit: record.unit,
            timeOfDay: record.timeOfDay,
            notes: record.notes || undefined,
            recordedAt: record.recordedAt
          }))
        }, 'before_deletion')

        // Log email attempt
        await prisma.emailLog.create({
          data: {
            userId: user.id,
            type: 'before_deletion',
            status: emailResult.success ? 'sent' : 'failed',
            recipient: process.env.CLINIC_EMAIL || 'clinic@example.com'
          }
        })
      }

      // Delete old blood pressure records
      const deletedBP = await prisma.bloodPressureRecord.deleteMany({
        where: {
          userId: user.id,
          recordedAt: {
            lt: oneMonthAgo
          }
        }
      })

      // Delete old blood sugar records
      const deletedBS = await prisma.bloodSugarRecord.deleteMany({
        where: {
          userId: user.id,
          recordedAt: {
            lt: oneMonthAgo
          }
        }
      })

      console.log(`Deleted ${deletedBP.count} BP records and ${deletedBS.count} BS records for user ${user.phone}`)

    } catch (error) {
      console.error(`Error cleaning up data for user ${user.phone}:`, error)
    }
  }

  console.log('Data cleanup completed')
}

// ฟังก์ชันลบข้อมูลเก่าที่ไม่จำเป็น
export async function cleanupUnnecessaryData() {
  try {
    // ลบ email logs เก่า (เก็บแค่ 7 วัน)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const deletedLogs = await prisma.emailLog.deleteMany({
      where: {
        sentAt: {
          lt: weekAgo
        }
      }
    })
    
    console.log(`Deleted ${deletedLogs.count} old email logs`)
    
    // ลบข้อมูลซ้ำ (ถ้ามี)
    const duplicateBP = await prisma.$queryRaw`
      DELETE FROM "BloodPressureRecord" 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM "BloodPressureRecord" 
        GROUP BY "userId", "systolic", "diastolic", "recordedAt"
      )
    `
    
    const duplicateBS = await prisma.$queryRaw`
      DELETE FROM "BloodSugarRecord" 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM "BloodSugarRecord" 
        GROUP BY "userId", "value", "recordedAt"
      )
    `
    
    console.log('Removed duplicate records')
    
    return { success: true, message: 'Unnecessary data cleanup completed' }
  } catch (error) {
    console.error('Unnecessary data cleanup failed:', error)
    return { success: false, message: 'Cleanup failed', error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ฟังก์ชันบีบอัดข้อมูล
export async function compressData() {
  try {
    // ลบ notes ที่ว่างเปล่า
    await prisma.bloodPressureRecord.updateMany({
      where: {
        notes: ''
      },
      data: {
        notes: null
      }
    })
    
    await prisma.bloodSugarRecord.updateMany({
      where: {
        notes: ''
      },
      data: {
        notes: null
      }
    })
    
    console.log('Compressed data by removing empty notes')
    return { success: true, message: 'Data compression completed' }
  } catch (error) {
    console.error('Data compression failed:', error)
    return { success: false, message: 'Compression failed', error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Function to run cleanup (can be called from API or cron job)
export async function runDataCleanup() {
  try {
    await cleanupOldData()
    await cleanupUnnecessaryData()
    await compressData()
    return { success: true, message: 'Complete data cleanup completed successfully' }
  } catch (error) {
    console.error('Data cleanup failed:', error)
    return { 
      success: false, 
      message: 'Data cleanup failed', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
