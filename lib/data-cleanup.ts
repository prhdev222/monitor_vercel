import { prisma } from './prisma'
import { sendDataToClinic } from './email'

export async function cleanupOldData() {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  console.log(`Starting data cleanup for records older than ${threeMonthsAgo.toISOString()}`)

  // Get all users with old data
  const usersWithOldData = await prisma.user.findMany({
    where: {
      OR: [
        {
          bloodPressureRecords: {
            some: {
              recordedAt: {
                lt: threeMonthsAgo
              }
            }
          }
        },
        {
          bloodSugarRecords: {
            some: {
              recordedAt: {
                lt: threeMonthsAgo
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
            lt: threeMonthsAgo
          }
        }
      },
      bloodSugarRecords: {
        where: {
          recordedAt: {
            lt: threeMonthsAgo
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
            lt: threeMonthsAgo
          }
        }
      })

      // Delete old blood sugar records
      const deletedBS = await prisma.bloodSugarRecord.deleteMany({
        where: {
          userId: user.id,
          recordedAt: {
            lt: threeMonthsAgo
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

// Function to run cleanup (can be called from API or cron job)
export async function runDataCleanup() {
  try {
    await cleanupOldData()
    return { success: true, message: 'Data cleanup completed successfully' }
  } catch (error) {
    console.error('Data cleanup failed:', error)
    return { 
      success: false, 
      message: 'Data cleanup failed', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
