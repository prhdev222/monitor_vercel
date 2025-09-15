import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface EmailData {
  user: {
    firstName?: string
    lastName?: string
    hnNumber?: string
    temple?: string
    phone: string
    email?: string
  }
  bloodPressureRecords: Array<{
    systolic: number
    diastolic: number
    pulse?: number
    timeOfDay: string
    notes?: string
    recordedAt: Date
  }>
  bloodSugarRecords: Array<{
    value: number
    unit: string
    timeOfDay: string
    notes?: string
    recordedAt: Date
  }>
}

export async function sendDataToClinic(data: EmailData, type: 'full_data' | 'before_deletion') {
  const { user, bloodPressureRecords, bloodSugarRecords } = data
  
  const subject = type === 'full_data' 
    ? `ข้อมูลสุขภาพพระคุณเจ้า - ${user.firstName} ${user.lastName} (HN: ${user.hnNumber})`
    : `ข้อมูลสุขภาพก่อนลบ - ${user.firstName} ${user.lastName} (HN: ${user.hnNumber}) (3 เดือน)`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <h2 style="color: #f97316;">รายงานข้อมูลสุขภาพพระคุณเจ้า - โรงพยาบาลสงฆ์</h2>
      
      <div style="background: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
        <h3>ข้อมูลพระคุณเจ้า</h3>
        <p><strong>ชื่อ-นามสกุล:</strong> พระคุณเจ้า ${user.firstName} ${user.lastName}</p>
        <p><strong>เลขที่ HN:</strong> ${user.hnNumber}</p>
        <p><strong>วัด:</strong> ${user.temple}</p>
        <p><strong>เบอร์โทรศัพท์:</strong> ${user.phone}</p>
        <p><strong>อีเมล:</strong> ${user.email || 'ไม่ระบุ'}</p>
        <p><strong>วันที่ส่งข้อมูล:</strong> ${new Date().toLocaleDateString('th-TH')}</p>
      </div>

      ${bloodPressureRecords.length > 0 ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #dc2626;">ข้อมูลความดันโลหิต (${bloodPressureRecords.length} รายการ)</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">วันที่</th>
                <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">เวลา</th>
                <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Systolic</th>
                <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Diastolic</th>
                <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Pulse</th>
                <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              ${bloodPressureRecords.map(record => {
                const timeLabels = {
                  morning: 'เช้า',
                  afternoon: 'กลางวัน',
                  evening: 'เย็น',
                  before_bed: 'ก่อนนอน'
                }
                return `
                <tr>
                  <td style="border: 1px solid #e5e7eb; padding: 12px;">${new Date(record.recordedAt).toLocaleDateString('th-TH')}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 12px;">${timeLabels[record.timeOfDay as keyof typeof timeLabels] || record.timeOfDay}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 12px;">${record.systolic}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 12px;">${record.diastolic}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 12px;">${record.pulse || '-'}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 12px;">${record.notes || '-'}</td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${bloodSugarRecords.length > 0 ? `
        <div style="margin: 20px 0;">
          <h3 style="color: #059669;">ข้อมูลน้ำตาลในเลือด (${bloodSugarRecords.length} รายการ)</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">วันที่</th>
                <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">เวลา</th>
                <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">ค่า</th>
                <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">หน่วย</th>
                <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              ${bloodSugarRecords.map(record => {
                const timeLabels = {
                  before_breakfast: 'ก่อนอาหารเช้า',
                  before_lunch: 'ก่อนอาหารกลางวัน',
                  before_dinner: 'ก่อนอาหารเย็น',
                  after_meal_2h: 'หลังอาหาร 2 ชม.',
                  before_bed: 'ก่อนนอน'
                }
                return `
                <tr>
                  <td style="border: 1px solid #e5e7eb; padding: 12px;">${new Date(record.recordedAt).toLocaleDateString('th-TH')}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 12px;">${timeLabels[record.timeOfDay as keyof typeof timeLabels] || record.timeOfDay}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 12px;">${record.value}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 12px;">${record.unit}</td>
                  <td style="border: 1px solid #e5e7eb; padding: 12px;">${record.notes || '-'}</td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px;">
        <p style="margin: 0; color: #92400e;">
          <strong>หมายเหตุ:</strong> ข้อมูลนี้ถูกส่งจากระบบบันทึกข้อมูลสุขภาพผู้ป่วย 
          ${type === 'before_deletion' ? 'ก่อนการลบข้อมูลตามนโยบายการเก็บข้อมูล 3 เดือน' : ''}
        </p>
      </div>
    </div>
  `

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.CLINIC_EMAIL,
      subject,
      html,
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
