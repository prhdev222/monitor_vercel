'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { 
  Heart, 
  Activity, 
  LogOut, 
  Plus, 
  BarChart3, 
  Mail,
  User,
  Calendar,
  Clock,
  Edit,
  Trash2
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const bloodPressureSchema = z.object({
  systolic: z.number().min(50).max(300),
  diastolic: z.number().min(30).max(200),
  pulse: z.number().min(30).max(200).optional(),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'before_bed']),
  notes: z.string().optional(),
  recordedDate: z.string().optional()
})

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
  timeOfDay: z.enum(['before_breakfast', 'before_lunch', 'before_dinner', 'after_meal_2h', 'before_bed']),
  notes: z.string().optional(),
  recordedDate: z.string().optional()
})

type BloodPressureForm = z.infer<typeof bloodPressureSchema>
type BloodSugarForm = z.infer<typeof bloodSugarSchema>

interface User {
  id: string
  phone: string
  firstName?: string
  lastName?: string
  hnNumber?: string
  temple?: string
  email?: string
  consent: boolean
}

interface BloodPressureRecord {
  id: string
  systolic: number
  diastolic: number
  pulse?: number
  timeOfDay: string
  notes?: string
  recordedAt: string
}

interface BloodSugarRecord {
  id: string
  value: number | string
  unit: string
  timeOfDay: string
  notes?: string
  recordedAt: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [bloodPressureRecords, setBloodPressureRecords] = useState<BloodPressureRecord[]>([])
  const [bloodSugarRecords, setBloodSugarRecords] = useState<BloodSugarRecord[]>([])
  const [activeTab, setActiveTab] = useState<'bp' | 'bs' | 'history'>('bp')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [editingRecord, setEditingRecord] = useState<{type: 'bp' | 'bs', id: string} | null>(null)
  const router = useRouter()

  // ฟังก์ชันแปลงวันที่ พ.ศ. เป็น ISO string
  const convertThaiDateToISO = (thaiDate: string) => {
    if (!thaiDate) return new Date().toISOString()
    const [day, month, year] = thaiDate.split('/')
    const buddhistYear = parseInt(year)
    const christianYear = buddhistYear - 543
    return new Date(christianYear, parseInt(month) - 1, parseInt(day)).toISOString()
  }

  // ฟังก์ชันแปลง ISO string เป็นวันที่ พ.ศ.
  const convertISOToThaiDate = (isoString: string) => {
    const date = new Date(isoString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = (date.getFullYear() + 543).toString()
    return `${day}/${month}/${year}`
  }

  // ฟังก์ชันตรวจสอบรูปแบบวันที่
  const validateThaiDate = (dateString: string): { isValid: boolean; error?: string } => {
    if (!dateString) return { isValid: false, error: 'กรุณากรอกวันที่' }
    
    // ตรวจสอบรูปแบบ DD/MM/YYYY
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    const match = dateString.match(dateRegex)
    
    if (!match) {
      return { isValid: false, error: 'รูปแบบวันที่ไม่ถูกต้อง ต้องเป็น DD/MM/YYYY (พ.ศ.)' }
    }
    
    const [, day, month, year] = match
    const dayNum = parseInt(day)
    const monthNum = parseInt(month)
    const yearNum = parseInt(year)
    
    // ตรวจสอบช่วงปี พ.ศ. (2500-2600)
    if (yearNum < 2500 || yearNum > 2600) {
      return { isValid: false, error: 'ปี พ.ศ. ต้องอยู่ในช่วง 2500-2600' }
    }
    
    // ตรวจสอบเดือน
    if (monthNum < 1 || monthNum > 12) {
      return { isValid: false, error: 'เดือนต้องอยู่ในช่วง 1-12' }
    }
    
    // ตรวจสอบวัน
    if (dayNum < 1 || dayNum > 31) {
      return { isValid: false, error: 'วันต้องอยู่ในช่วง 1-31' }
    }
    
    // ตรวจสอบวันที่ในเดือน
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    const maxDay = daysInMonth[monthNum - 1]
    
    if (dayNum > maxDay) {
      return { isValid: false, error: `เดือน ${monthNum} มีได้สูงสุด ${maxDay} วัน` }
    }
    
    return { isValid: true }
  }

  // ฟังก์ชันตรวจสอบข้อมูลซ้ำ
  const checkDuplicateRecord = (type: 'bp' | 'bs', date: string, timeOfDay: string, excludeId?: string): boolean => {
    const records = type === 'bp' ? bloodPressureRecords : bloodSugarRecords
    return records.some(record => {
      if (excludeId && record.id === excludeId) return false
      const recordDate = convertISOToThaiDate(record.recordedAt)
      return recordDate === date && record.timeOfDay === timeOfDay
    })
  }

  // ฟังก์ชันได้วันที่วันนี้ในรูปแบบ พ.ศ.
  const getTodayThaiDate = () => {
    const today = new Date()
    const day = today.getDate().toString().padStart(2, '0')
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const year = (today.getFullYear() + 543).toString()
    return `${day}/${month}/${year}`
  }

  const bpForm = useForm<BloodPressureForm>({
    resolver: zodResolver(bloodPressureSchema),
    defaultValues: {
      systolic: 120,
      diastolic: 80,
      pulse: 70,
      timeOfDay: 'morning',
      recordedDate: getTodayThaiDate()
    }
  })

  const bsForm = useForm<BloodSugarForm>({
    resolver: zodResolver(bloodSugarSchema),
    defaultValues: {
      value: '100',
      unit: 'mg/dL',
      timeOfDay: 'before_breakfast',
      recordedDate: getTodayThaiDate()
    }
  })

  useEffect(() => {
    checkAuth()
    loadData()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const result = await response.json()
      
      if (result.success) {
        setUser(result.user)
      } else {
        router.push('/login')
      }
    } catch (error) {
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  const loadData = async () => {
    try {
      const [bpResponse, bsResponse] = await Promise.all([
        fetch('/api/blood-pressure'),
        fetch('/api/blood-sugar')
      ])

      const bpResult = await bpResponse.json()
      const bsResult = await bsResponse.json()

      if (bpResult.success) {
        setBloodPressureRecords(bpResult.records)
      }
      if (bsResult.success) {
        setBloodSugarRecords(bsResult.records)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการออกจากระบบ')
    }
  }

  const onSubmitBP = async (data: BloodPressureForm) => {
    try {
      // ตรวจสอบรูปแบบวันที่
      const dateValidation = validateThaiDate(data.recordedDate || getTodayThaiDate())
      if (!dateValidation.isValid) {
        toast.error(dateValidation.error!)
        return
      }

      // ตรวจสอบค่าความดันโลหิต
      if (!Number.isInteger(data.systolic) || data.systolic <= 0 || data.systolic > 300) {
        toast.error('ค่าความดันตัวบน (SBP) ต้องเป็นจำนวนเต็มระหว่าง 1-300')
        return
      }
      
      if (!Number.isInteger(data.diastolic) || data.diastolic <= 0 || data.diastolic > 150) {
        toast.error('ค่าความดันตัวล่าง (DBP) ต้องเป็นจำนวนเต็มระหว่าง 1-150')
        return
      }

      if (data.pulse && (!Number.isInteger(data.pulse) || data.pulse <= 0 || data.pulse > 300)) {
        toast.error('อัตราการเต้นของหัวใจ (Pulse) ต้องเป็นจำนวนเต็มระหว่าง 1-300')
        return
      }

      // ตรวจสอบข้อมูลซ้ำ
      const currentDate = data.recordedDate || getTodayThaiDate()
      const isDuplicate = checkDuplicateRecord('bp', currentDate, data.timeOfDay, editingRecord?.type === 'bp' ? editingRecord.id : undefined)
      
      if (isDuplicate) {
        toast.error('มีข้อมูลความดันโลหิตในวันและช่วงเวลานี้แล้ว กรุณาเลือกวันหรือช่วงเวลาอื่น')
        return
      }

      const isEdit = editingRecord?.type === 'bp'
      const submitData = {
        ...data,
        recordedAt: convertThaiDateToISO(data.recordedDate || getTodayThaiDate())
      }
      delete submitData.recordedDate
      
      const response = await fetch('/api/blood-pressure', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...submitData, id: editingRecord.id } : submitData)
      })

      const result = await response.json()
      if (result.success) {
        toast.success(isEdit ? 'แก้ไขข้อมูลความดันโลหิตสำเร็จ' : 'บันทึกข้อมูลความดันโลหิตสำเร็จ')
        bpForm.reset({
          systolic: 120,
          diastolic: 80,
          pulse: 70,
          timeOfDay: 'morning',
          recordedDate: getTodayThaiDate()
        })
        setEditingRecord(null)
        loadData()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    }
  }

  const onSubmitBS = async (data: BloodSugarForm) => {
    try {
      // ตรวจสอบรูปแบบวันที่
      const dateValidation = validateThaiDate(data.recordedDate || getTodayThaiDate())
      if (!dateValidation.isValid) {
        toast.error(dateValidation.error!)
        return
      }

      // ตรวจสอบค่าน้ำตาลในเลือด
      if (typeof data.value === 'string' && (data.value === 'high' || data.value === 'low')) {
        // High/Low values are valid
      } else if (typeof data.value === 'string') {
        const num = Number(data.value)
        if (isNaN(num) || !Number.isInteger(num) || num <= 0 || num >= 1000) {
          toast.error('ค่าน้ำตาลในเลือด (DTX) ต้องเป็น high, low หรือตัวเลขจำนวนเต็มระหว่าง 1-999')
          return
        }
      } else {
        toast.error('กรุณากรอกค่าน้ำตาลในเลือดหรือเลือก High/Low')
        return
      }

      // ตรวจสอบข้อมูลซ้ำ
      const currentDate = data.recordedDate || getTodayThaiDate()
      const isDuplicate = checkDuplicateRecord('bs', currentDate, data.timeOfDay, editingRecord?.type === 'bs' ? editingRecord.id : undefined)
      
      if (isDuplicate) {
        toast.error('มีข้อมูลน้ำตาลในเลือดในวันและช่วงเวลานี้แล้ว กรุณาเลือกวันหรือช่วงเวลาอื่น')
        return
      }

      const isEdit = editingRecord?.type === 'bs'
      const submitData = {
        ...data,
        recordedAt: convertThaiDateToISO(data.recordedDate || getTodayThaiDate())
      }
      delete submitData.recordedDate
      
      const response = await fetch('/api/blood-sugar', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...submitData, id: editingRecord.id } : submitData)
      })

      const result = await response.json()
      if (result.success) {
        toast.success(isEdit ? 'แก้ไขค่าน้ำตาลในเลือดสำเร็จ' : 'บันทึกค่าน้ำตาลในเลือดสำเร็จ')
        bsForm.reset({
          value: '100',
          unit: 'mg/dL',
          timeOfDay: 'before_breakfast',
          recordedDate: getTodayThaiDate()
        })
        setEditingRecord(null)
        loadData()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    }
  }

  const sendDataToClinic = async () => {
    if (!user?.consent) {
      toast.error('คุณยังไม่ได้ยินยอมการแชร์ข้อมูล', {
        position: 'top-center',
        duration: 4000,
      })
      return
    }

    setIsSending(true)
    const loadingToast = toast.loading('กำลังส่งข้อมูลให้คลินิก...', {
      position: 'top-center',
      duration: 0,
    })

    try {
      const response = await fetch('/api/email/send-data', {
        method: 'POST'
      })

      const result = await response.json()
      toast.dismiss(loadingToast)
      
      if (result.success) {
        toast.success('ส่งข้อมูลให้คลินิกสำเร็จ!', {
          position: 'top-center',
          duration: 5000,
          style: {
            background: '#10b981',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
          },
        })
      } else {
        toast.error(result.error + (result.details ? `: ${result.details}` : ''), {
          position: 'top-center',
          duration: 5000,
        })
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('เกิดข้อผิดพลาดในการส่งข้อมูล', {
        position: 'top-center',
        duration: 5000,
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleEditRecord = (type: 'bp' | 'bs', record: any) => {
    setEditingRecord({ type, id: record.id })
    if (type === 'bp') {
      bpForm.reset({
        systolic: record.systolic,
        diastolic: record.diastolic,
        pulse: record.pulse || 70,
        timeOfDay: record.timeOfDay,
        notes: record.notes || '',
        recordedDate: convertISOToThaiDate(record.recordedAt)
      })
    } else {
      bsForm.reset({
        value: String(record.value),
        unit: record.unit,
        timeOfDay: record.timeOfDay,
        notes: record.notes || '',
        recordedDate: convertISOToThaiDate(record.recordedAt)
      })
    }
  }

  const handleDeleteRecord = async (type: 'bp' | 'bs', id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบข้อมูลนี้?')) return

    try {
      const response = await fetch(`/api/${type === 'bp' ? 'blood-pressure' : 'blood-sugar'}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      const result = await response.json()
      if (result.success) {
        toast.success('ลบข้อมูลสำเร็จ')
        loadData()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการลบข้อมูล')
    }
  }

  // สร้างไฟล์ PDF ข้อมูล 7 วันล่าสุด
  const generateWeeklyPdf = async () => {
    try {
      const [{ default: jsPDF }, autoTable, { thaiFont }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable') as any,
        import('@/lib/thaiFont')
      ])

      const doc = new jsPDF()
      
      // โหลด font ไทย THSarabunNew
      await thaiFont.loadThaiFont(doc)
      
      // ตั้งค่า font สำหรับข้อความ
      thaiFont.setThaiFont(doc, 14)
      const title = 'รายงานข้อมูลสุขภาพ 7 วันล่าสุด'
      doc.text(title, 14, 16)

    // ส่วนที่ 1: ความดันโลหิต
    // เพิ่มหัวข้อตารางความดันโลหิต
    thaiFont.setThaiFont(doc, 12)
    doc.text('ความดันโลหิต', 14, 30)
    
    const bpHeaders = [
      ['Date', 'Time', 'Systolic', 'Diastolic', 'Pulse']
    ]
    const timeMap: Record<string, string> = {
      morning: 'เช้า',
      afternoon: 'กลางวัน',
      evening: 'เย็น',
      before_bed: 'ก่อนนอน',
      before_breakfast: 'ก่อนอาหารเช้า',
      before_lunch: 'ก่อนอาหารกลางวัน',
      before_dinner: 'ก่อนอาหารเย็น',
      after_meal_2h: 'หลังอาหาร 2 ชม.'
    }

    const bpRows = bloodPressureRecords
      .slice(0, 50)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .slice(-7)
      .map(r => [
        new Date(r.recordedAt).toLocaleDateString('th-TH'),
        timeMap[r.timeOfDay] || r.timeOfDay,
        String(r.systolic),
        String(r.diastolic),
        r.pulse ? String(r.pulse) : '-'
      ])

    ;(autoTable as any).default(doc, {
      startY: 35,
      head: bpHeaders,
      body: bpRows,
      styles: { 
        font: 'THSarabunNew',
        fontSize: 10,
        halign: 'center'
      },
      headStyles: { 
        font: 'THSarabunNew',
        fontSize: 10,
        fillColor: [66, 139, 202],
        textColor: [255, 255, 255],
        halign: 'center'
      },
      didParseCell: function(data: any) {
        // ตั้งค่า font สำหรับทุก cell
        data.cell.styles.font = 'THSarabunNew'
      }
    })

    // ส่วนที่ 2: น้ำตาลในเลือด
    const yAfterBP = (doc as any).lastAutoTable?.finalY || 35
    
    // เพิ่มหัวข้อตารางน้ำตาลในเลือด
    thaiFont.setThaiFont(doc, 12)
    doc.text('ผลเจาะเลือดดูค่าน้ำตาลปลายนิ้ว', 14, yAfterBP + 15)
    
    const sugarHeaders = [[ 'Date', 'Time', 'Value (mg/dL)' ]]

    const sugarRows = bloodSugarRecords
      .slice(0, 50)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .slice(-7)
      .map(r => [
        new Date(r.recordedAt).toLocaleDateString('th-TH'),
        timeMap[r.timeOfDay] || r.timeOfDay,
        r.value === 'high' ? 'สูงมาก' : r.value === 'low' ? 'ต่ำมาก' : String(r.value)
      ])

    ;(autoTable as any).default(doc, {
      startY: yAfterBP + 20,
      head: sugarHeaders,
      body: sugarRows,
      styles: { 
        font: 'THSarabunNew',
        fontSize: 10,
        halign: 'center'
      },
      headStyles: { 
        font: 'THSarabunNew',
        fontSize: 10,
        fillColor: [66, 139, 202],
        textColor: [255, 255, 255],
        halign: 'center'
      },
      didParseCell: function(data: any) {
        // ตั้งค่า font สำหรับทุก cell
        data.cell.styles.font = 'THSarabunNew'
      }
    })

      doc.save('weekly-health-report.pdf')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('เกิดข้อผิดพลาดในการสร้าง PDF')
    }
  }

  const handleCancelEdit = () => {
    setEditingRecord(null)
    bpForm.reset({
      systolic: 120,
      diastolic: 80,
      pulse: 70,
      timeOfDay: 'morning',
      recordedDate: getTodayThaiDate()
    })
    bsForm.reset({
      value: '100',
      unit: 'mg/dL',
      timeOfDay: 'before_breakfast',
      recordedDate: getTodayThaiDate()
    })
  }


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  // จัดเรียงข้อมูลกราฟความดันตามลำดับช่วงเวลา: เช้า > กลางวัน > เย็น > ก่อนนอน
  const timeOrderBP: Record<string, number> = {
    morning: 1,
    afternoon: 2,
    evening: 3,
    before_bed: 4
  }

  const chartData = bloodPressureRecords
    .slice(0, 50) // พิจารณาล่าสุดบางรายการเพื่อความเร็ว แล้วไปกรอง 7 จุดสุดท้ายหลังจัดเรียง
    .sort((a, b) => {
      const da = new Date(a.recordedAt).getTime()
      const db = new Date(b.recordedAt).getTime()
      if (da === db) {
        return (timeOrderBP[a.timeOfDay] || 99) - (timeOrderBP[b.timeOfDay] || 99)
      }
      return da - db
    })
    .slice(-7)
    .map(record => ({
    date: new Date(record.recordedAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
    systolic: record.systolic,
    diastolic: record.diastolic
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Header */}
          <div className="block sm:hidden py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Heart className="h-6 w-6 text-primary-600 mr-2" />
                <h1 className="text-base font-bold text-gray-900">ระบบบันทึกข้อมูลสุขภาพดิจิตอล</h1>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-900 p-2"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium">สวัสดี, พระคุณเจ้า {user?.firstName} {user?.lastName}</p>
              {user?.hnNumber && (
                <p className="text-xs text-gray-500">HN: {user.hnNumber}</p>
              )}
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden sm:flex justify-between items-center py-4">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">ระบบบันทึกข้อมูลสุขภาพดิจิตอล - อายุรกรรม โรงพยาบาลสงฆ์</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                สวัสดี, พระคุณเจ้า {user?.firstName} {user?.lastName} {user?.hnNumber && `(HN: ${user.hnNumber})`}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5 mr-1" />
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Tabs */}
        <div className="mb-6 sm:mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('bp')}
                className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex items-center ${
                  activeTab === 'bp'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">ความดันโลหิต</span>
                <span className="xs:hidden">ความดัน</span>
              </button>
              <button
                onClick={() => setActiveTab('bs')}
                className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex items-center ${
                  activeTab === 'bs'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">น้ำตาลในเลือด</span>
                <span className="xs:hidden">น้ำตาล</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex items-center ${
                  activeTab === 'history'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">ประวัติและกราฟ</span>
                <span className="xs:hidden">ประวัติ</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Blood Pressure Form */}
        {activeTab === 'bp' && (
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
            <div className="card">
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-red-500" />
                บันทึกความดันโลหิต
              </h3>
              <form onSubmit={bpForm.handleSubmit(onSubmitBP)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Systolic (บน)</label>
                    <input
                      {...bpForm.register('systolic', { valueAsNumber: true })}
                      type="number"
                      min="1"
                      max="300"
                      step="1"
                      className="input-field"
                      placeholder="120"
                    />
                    {bpForm.formState.errors.systolic && (
                      <p className="error-message">{bpForm.formState.errors.systolic.message}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Diastolic (ล่าง)</label>
                    <input
                      {...bpForm.register('diastolic', { valueAsNumber: true })}
                      type="number"
                      min="1"
                      max="150"
                      step="1"
                      className="input-field"
                      placeholder="80"
                    />
                    {bpForm.formState.errors.diastolic && (
                      <p className="error-message">{bpForm.formState.errors.diastolic.message}</p>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">วันที่บันทึก</label>
                  <div className="flex gap-2">
                    <input
                      {...bpForm.register('recordedDate')}
                      type="text"
                      className="input-field flex-1"
                      placeholder="วัน/เดือน/ปี (พ.ศ.)"
                      pattern="\d{2}/\d{2}/\d{4}"
                    />
                    <button
                      type="button"
                      onClick={() => bpForm.setValue('recordedDate', getTodayThaiDate())}
                      className="btn-secondary px-3 py-2 text-sm"
                    >
                      วันนี้
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">รูปแบบ: วันที่/เดือน/ปี (พ.ศ.) เช่น 15/01/2567</p>
                </div>
                <div className="form-group">
                  <label className="form-label">เวลาที่วัด</label>
                  <select {...bpForm.register('timeOfDay')} className="input-field">
                    <option value="morning">เช้า</option>
                    <option value="afternoon">กลางวัน</option>
                    <option value="evening">เย็น</option>
                    <option value="before_bed">ก่อนนอน</option>
                  </select>
                  {bpForm.formState.errors.timeOfDay && (
                    <p className="error-message">{bpForm.formState.errors.timeOfDay.message}</p>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Pulse (อัตราการเต้นของหัวใจ)</label>
                  <input
                    {...bpForm.register('pulse', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    max="300"
                    step="1"
                    className="input-field"
                    placeholder="70"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">หมายเหตุ</label>
                  <textarea
                    {...bpForm.register('notes')}
                    className="input-field"
                    rows={3}
                    placeholder="หมายเหตุเพิ่มเติม..."
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 btn-primary">
                  <Plus className="h-5 w-5 inline mr-2" />
                    {editingRecord?.type === 'bp' ? 'แก้ไขข้อมูล' : 'บันทึกข้อมูล'}
                </button>
                  {editingRecord?.type === 'bp' && (
                    <button 
                      type="button" 
                      onClick={handleCancelEdit}
                      className="btn-secondary"
                    >
                      ยกเลิก
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">ประวัติความดันโลหิตล่าสุด</h3>
              <div className="space-y-3">
                {bloodPressureRecords.slice(0, 5).map((record) => {
                  const timeLabels = {
                    morning: 'เช้า',
                    afternoon: 'กลางวัน',
                    evening: 'เย็น',
                    before_bed: 'ก่อนนอน'
                  }
                  return (
                    <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">
                          {record.systolic}/{record.diastolic} mmHg
                        </p>
                        <p className="text-sm text-gray-600">
                          {timeLabels[record.timeOfDay as keyof typeof timeLabels]} - {new Date(record.recordedAt).toLocaleDateString('th-TH')}
                        </p>
                        {record.pulse && (
                          <p className="text-sm text-gray-600">Pulse: {record.pulse}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditRecord('bp', record)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord('bp', record.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
                {bloodPressureRecords.length === 0 && (
                  <p className="text-gray-500 text-center py-4">ยังไม่มีข้อมูล</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Blood Sugar Form */}
        {activeTab === 'bs' && (
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
            <div className="card">
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <Heart className="h-5 w-5 mr-2 text-green-500" />
                บันทึกน้ำตาลในเลือด
              </h3>
              <form onSubmit={bsForm.handleSubmit(onSubmitBS)} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">ค่าน้ำตาลในเลือด</label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                  <input
                        {...bsForm.register('value', { 
                          setValueAs: (value) => {
                            if (value === 'high' || value === 'low') return value
                            if (value === '') return ''
                            const num = Number(value)
                            if (isNaN(num) || !Number.isInteger(num) || num < 1 || num > 999) {
                              return value // Keep original value for validation error
                            }
                            return value
                          }
                        })}
                        type="text"
                        className="input-field flex-1"
                        placeholder="100 หรือ high/low"
                        onKeyPress={(e) => {
                          // Only allow numbers
                          if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                            e.preventDefault()
                          }
                        }}
                        onFocus={() => {
                          // Clear high/low when focusing on input
                          const currentValue = bsForm.getValues('value')
                          if (currentValue === 'high' || currentValue === 'low') {
                            bsForm.setValue('value', '')
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            bsForm.setValue('value', 'high' as any)
                            // Clear the input field visually
                            const input = document.querySelector('input[name="value"]') as HTMLInputElement
                            if (input) input.value = 'high'
                          }}
                          className={`px-3 py-2 text-sm rounded-lg border ${
                            String(bsForm.watch('value')) === 'high' 
                              ? 'bg-red-100 border-red-300 text-red-700' 
                              : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-red-50'
                          }`}
                        >
                          High
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            bsForm.setValue('value', 'low' as any)
                            // Clear the input field visually
                            const input = document.querySelector('input[name="value"]') as HTMLInputElement
                            if (input) input.value = 'low'
                          }}
                          className={`px-3 py-2 text-sm rounded-lg border ${
                            String(bsForm.watch('value')) === 'low' 
                              ? 'bg-blue-100 border-blue-300 text-blue-700' 
                              : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-blue-50'
                          }`}
                        >
                          Low
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      กรอกตัวเลขจำนวนเต็ม 1-999 หรือกด High (สูงมาก) / Low (ต่ำมาก)
                    </p>
                  </div>
                  {bsForm.formState.errors.value && (
                    <p className="error-message">{bsForm.formState.errors.value.message}</p>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">วันที่บันทึก</label>
                  <div className="flex gap-2">
                    <input
                      {...bsForm.register('recordedDate')}
                      type="text"
                      className="input-field flex-1"
                      placeholder="วัน/เดือน/ปี (พ.ศ.)"
                      pattern="\d{2}/\d{2}/\d{4}"
                    />
                    <button
                      type="button"
                      onClick={() => bsForm.setValue('recordedDate', getTodayThaiDate())}
                      className="btn-secondary px-3 py-2 text-sm"
                    >
                      วันนี้
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">รูปแบบ: วันที่/เดือน/ปี (พ.ศ.) เช่น 15/01/2567</p>
                </div>
                <div className="form-group">
                  <label className="form-label">เวลาที่วัด</label>
                  <select {...bsForm.register('timeOfDay')} className="input-field">
                    <option value="before_breakfast">ก่อนอาหารเช้า</option>
                    <option value="before_lunch">ก่อนอาหารกลางวัน</option>
                    <option value="before_dinner">ก่อนอาหารเย็น</option>
                    <option value="after_meal_2h">หลังอาหาร 2 ชั่วโมง</option>
                    <option value="before_bed">ก่อนนอน</option>
                  </select>
                  {bsForm.formState.errors.timeOfDay && (
                    <p className="error-message">{bsForm.formState.errors.timeOfDay.message}</p>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">หน่วย</label>
                  <select {...bsForm.register('unit')} className="input-field">
                    <option value="mg/dL">mg/dL</option>
                    <option value="mmol/L">mmol/L</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">หมายเหตุ</label>
                  <textarea
                    {...bsForm.register('notes')}
                    className="input-field"
                    rows={3}
                    placeholder="หมายเหตุเพิ่มเติม..."
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 btn-primary">
                  <Plus className="h-5 w-5 inline mr-2" />
                    {editingRecord?.type === 'bs' ? 'แก้ไขข้อมูล' : 'บันทึกข้อมูล'}
                </button>
                  {editingRecord?.type === 'bs' && (
                    <button 
                      type="button" 
                      onClick={handleCancelEdit}
                      className="btn-secondary"
                    >
                      ยกเลิก
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">ประวัติน้ำตาลในเลือดล่าสุด</h3>
              <div className="space-y-3">
                {bloodSugarRecords.slice(0, 5).map((record) => {
                  const timeLabels = {
                    before_breakfast: 'ก่อนอาหารเช้า',
                    before_lunch: 'ก่อนอาหารกลางวัน',
                    before_dinner: 'ก่อนอาหารเย็น',
                    after_meal_2h: 'หลังอาหาร 2 ชม.',
                    before_bed: 'ก่อนนอน'
                  }
                  return (
                    <div key={record.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">
                          {record.value === 'high' ? 'High (สูงมาก)' : 
                           record.value === 'low' ? 'Low (ต่ำมาก)' : 
                           `${record.value} ${record.unit}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {timeLabels[record.timeOfDay as keyof typeof timeLabels]} - {new Date(record.recordedAt).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditRecord('bs', record)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord('bs', record.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
                {bloodSugarRecords.length === 0 && (
                  <p className="text-gray-500 text-center py-4">ยังไม่มีข้อมูล</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* History and Charts */}
        {activeTab === 'history' && (
          <div className="space-y-4 sm:space-y-8">
            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">กราฟความดันโลหิต (7 วันล่าสุด)</h3>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} name="Systolic" />
                      <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} name="Diastolic" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-8">ไม่มีข้อมูลสำหรับแสดงกราฟ</p>
                )}
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">กราฟน้ำตาลก่อนอาหาร (7 วันล่าสุด)</h3>
                {(() => {
                  const order: Record<string, number> = {
                    before_breakfast: 1,
                    before_lunch: 2,
                    before_dinner: 3,
                    before_bed: 4
                  }
                  const sugarChartData = bloodSugarRecords
                    .filter(r => r.timeOfDay !== 'after_meal_2h')
                    .slice(0, 60)
                    .sort((a, b) => {
                      const da = new Date(a.recordedAt).getTime()
                      const db = new Date(b.recordedAt).getTime()
                      if (da === db) {
                        return (order[a.timeOfDay] || 99) - (order[b.timeOfDay] || 99)
                      }
                      return da - db
                    })
                    .slice(-7)
                    .map(record => ({
                    date: new Date(record.recordedAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
                      value: record.value === 'high' ? 1000 : record.value === 'low' ? 0 : record.value,
                    timeOfDay: record.timeOfDay
                  }))
                  
                  return sugarChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={sugarChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} name="ก่อนอาหาร" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-center py-8">ไม่มีข้อมูลสำหรับแสดงกราฟ</p>
                  )
                })()}
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">กราฟน้ำตาลหลังอาหาร 2 ชม. (7 วันล่าสุด)</h3>
                {(() => {
                  const sugarAfterData = bloodSugarRecords
                    .filter(r => r.timeOfDay === 'after_meal_2h')
                    .slice(0, 60)
                    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
                    .slice(-7)
                    .map(record => ({
                      date: new Date(record.recordedAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
                      value: record.value === 'high' ? 1000 : record.value === 'low' ? 0 : record.value
                    }))

                  return sugarAfterData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={sugarAfterData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} name="หลังอาหาร 2 ชม." />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-center py-8">ไม่มีข้อมูลสำหรับแสดงกราฟ</p>
                  )
                })()}
              </div>
            </div>

            {/* Statistics */}
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">สถิติความดันโลหิต</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-red-700 font-medium">จำนวนรายการ</span>
                    <span className="text-red-900 font-bold">{bloodPressureRecords.length} รายการ</span>
                  </div>
                  {bloodPressureRecords.length > 0 && (
                    <>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-blue-700 font-medium">Systolic เฉลี่ย</span>
                        <span className="text-blue-900 font-bold">
                          {Math.round(bloodPressureRecords.reduce((sum, record) => sum + record.systolic, 0) / bloodPressureRecords.length)} mmHg
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-blue-700 font-medium">Diastolic เฉลี่ย</span>
                        <span className="text-blue-900 font-bold">
                          {Math.round(bloodPressureRecords.reduce((sum, record) => sum + record.diastolic, 0) / bloodPressureRecords.length)} mmHg
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span className="text-orange-700 font-medium">Systolic สูงสุด</span>
                        <span className="text-orange-900 font-bold">
                          {Math.max(...bloodPressureRecords.map(r => r.systolic))} mmHg
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <span className="text-orange-700 font-medium">Diastolic สูงสุด</span>
                        <span className="text-orange-900 font-bold">
                          {Math.max(...bloodPressureRecords.map(r => r.diastolic))} mmHg
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span className="text-purple-700 font-medium">Systolic ต่ำสุด</span>
                        <span className="text-purple-900 font-bold">
                          {Math.min(...bloodPressureRecords.map(r => r.systolic))} mmHg
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span className="text-purple-700 font-medium">Diastolic ต่ำสุด</span>
                        <span className="text-purple-900 font-bold">
                          {Math.min(...bloodPressureRecords.map(r => r.diastolic))} mmHg
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">สถิติน้ำตาลในเลือด</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700 font-medium">จำนวนรายการ</span>
                    <span className="text-green-900 font-bold">{bloodSugarRecords.length} รายการ</span>
                  </div>
                  {bloodSugarRecords.length > 0 && (
                    <>
                      <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                        <span className="text-emerald-700 font-medium">ค่าเฉลี่ย</span>
                        <span className="text-emerald-900 font-bold">
                          {(() => {
                            const numericRecords = bloodSugarRecords.filter(record => 
                              typeof record.value === 'number'
                            )
                            if (numericRecords.length === 0) return 'ไม่มีข้อมูลตัวเลข'
                            
                            const avg = numericRecords.reduce((sum, record) => sum + (record.value as number), 0) / numericRecords.length
                            return numericRecords[0].unit === 'mg/dL' 
                              ? Math.round(avg)
                              : avg.toFixed(1)
                          })()} {bloodSugarRecords[0]?.unit || 'mg/dL'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <span className="text-yellow-700 font-medium">ค่าสูงสุด</span>
                        <span className="text-yellow-900 font-bold">
                          {(() => {
                            const numericRecords = bloodSugarRecords.filter(record => 
                              typeof record.value === 'number'
                            )
                            if (numericRecords.length === 0) return 'ไม่มีข้อมูลตัวเลข'
                            
                            const max = Math.max(...numericRecords.map(r => r.value as number))
                            return numericRecords[0].unit === 'mg/dL' 
                              ? Math.round(max)
                              : max.toFixed(1)
                          })()} {bloodSugarRecords[0]?.unit || 'mg/dL'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                        <span className="text-pink-700 font-medium">ค่าต่ำสุด</span>
                        <span className="text-pink-900 font-bold">
                          {(() => {
                            const numericRecords = bloodSugarRecords.filter(record => 
                              typeof record.value === 'number'
                            )
                            if (numericRecords.length === 0) return 'ไม่มีข้อมูลตัวเลข'
                            
                            const min = Math.min(...numericRecords.map(r => r.value as number))
                            return numericRecords[0].unit === 'mg/dL' 
                              ? Math.round(min)
                              : min.toFixed(1)
                          })()} {bloodSugarRecords[0]?.unit || 'mg/dL'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Latest Data */}
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">ข้อมูลล่าสุด - ความดันโลหิต</h3>
                <div className="space-y-3">
                  {bloodPressureRecords.length > 0 ? (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-600 font-medium">ความดันโลหิตล่าสุด</p>
                      <p className="text-lg font-bold text-red-800">
                        {bloodPressureRecords[0].systolic}/{bloodPressureRecords[0].diastolic} mmHg
                      </p>
                      <p className="text-xs text-red-600">
                        {(() => {
                          const timeLabels = {
                            morning: 'เช้า',
                            afternoon: 'กลางวัน',
                            evening: 'เย็น',
                            before_bed: 'ก่อนนอน'
                          }
                          return timeLabels[bloodPressureRecords[0].timeOfDay as keyof typeof timeLabels] || bloodPressureRecords[0].timeOfDay
                        })()} - {new Date(bloodPressureRecords[0].recordedAt).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">ยังไม่มีข้อมูล</p>
                  )}
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">ข้อมูลล่าสุด - น้ำตาลในเลือด</h3>
                <div className="space-y-3">
                  {bloodSugarRecords.length > 0 ? (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">น้ำตาลในเลือดล่าสุด</p>
                      <p className="text-lg font-bold text-green-800">
                        {bloodSugarRecords[0].value === 'high' ? 'High (สูงมาก)' : 
                         bloodSugarRecords[0].value === 'low' ? 'Low (ต่ำมาก)' : 
                         `${bloodSugarRecords[0].value} ${bloodSugarRecords[0].unit}`}
                      </p>
                      <p className="text-xs text-green-600">
                        {(() => {
                          const timeLabels = {
                            before_breakfast: 'ก่อนอาหารเช้า',
                            before_lunch: 'ก่อนอาหารกลางวัน',
                            before_dinner: 'ก่อนอาหารเย็น',
                            after_meal_2h: 'หลังอาหาร 2 ชม.',
                            before_bed: 'ก่อนนอน'
                          }
                          return timeLabels[bloodSugarRecords[0].timeOfDay as keyof typeof timeLabels] || bloodSugarRecords[0].timeOfDay
                        })()} - {new Date(bloodSugarRecords[0].recordedAt).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">ยังไม่มีข้อมูล</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">การจัดการข้อมูล</h3>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={sendDataToClinic}
                    disabled={!user?.consent || isSending}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        กำลังส่งข้อมูล...
                      </>
                    ) : (
                      <>
                        <Mail className="h-5 w-5 inline mr-2" />
                        ส่งข้อมูลให้คลินิก
                      </>
                    )}
                  </button>
                  <button
                    onClick={generateWeeklyPdf}
                    className="btn-secondary"
                  >
                    ดาวน์โหลดรายสัปดาห์ (PDF)
                  </button>
                </div>
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-700 italic">
                    ส่งข้อมูลทาง email ให้ทางคลินิก ผู้ป่วยต้องโทรหรือติดต่อ line เพื่อสอบถามให้ติดตามข้อมูลต่อ ทางคลินิกจะไม่ได้เปิดดู email โดยอัตโนมัติ
                  </p>
                </div>
                {!user?.consent && (
                  <p className="text-sm text-yellow-600">
                    คุณต้องยินยอมการแชร์ข้อมูลก่อนส่งให้คลินิก
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
