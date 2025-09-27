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
  lineId?: string
  lineUserId?: string
  lineDisplayName?: string
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
  const [lastSentTime, setLastSentTime] = useState<number | null>(null)
  const [showManualRedirect, setShowManualRedirect] = useState(false)
  const [editingRecord, setEditingRecord] = useState<{type: 'bp' | 'bs', id: string} | null>(null)
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [isLineBrowser, setIsLineBrowser] = useState(false)
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

  // ฟังก์ชันตรวจสอบระดับความดันโลหิต
  const getBloodPressureLevel = (systolic: number, diastolic: number) => {
    if (systolic < 70 || diastolic < 40) {
      return { level: 'very-low', color: 'purple', text: 'ต่ำมาก', warning: '⚠️ อันตราย! ความดันโลหิตต่ำมาก ควรรีบพบแพทย์' }
    }
    if (systolic < 90 || diastolic < 60) {
      return { level: 'low', color: 'blue', text: 'ต่ำ', warning: '⚠️ ความดันโลหิตต่ำ ควรปรึกษาแพทย์' }
    }
    if (systolic < 140 && diastolic < 90) {
      return { level: 'normal', color: 'green', text: 'ปกติ', warning: '' }
    }
    if ((systolic >= 140 && systolic <= 159) || (diastolic >= 90 && diastolic <= 99)) {
      return { level: 'high-1', color: 'yellow', text: 'สูงเล็กน้อย', warning: '⚠️ ความดันโลหิตสูงเล็กน้อย ควรปรับพฤติกรรมและติดตาม' }
    }
    if ((systolic >= 160 && systolic <= 179) || (diastolic >= 100 && diastolic <= 109)) {
      return { level: 'high-2', color: 'orange', text: 'สูงปานกลาง', warning: '⚠️ ความดันโลหิตสูงปานกลาง ควรพบแพทย์' }
    }
    return { level: 'high-3', color: 'red', text: 'สูงมาก', warning: '🚨 อันตราย! ความดันโลหิตสูงมาก ควรรีบพบแพทย์' }
  }

  // ฟังก์ชันตรวจสอบระดับน้ำตาลในเลือดสำหรับหลังอาหาร 2 ชั่วโมง
  const getBloodSugarLevelPostMeal = (value: number | string) => {
    // แปลงค่า high/low เป็นตัวเลขสำหรับการตรวจสอบ
    let numericValue: number
    if (value === 'high') {
      return { level: 'very-high', color: 'red', text: 'สูงมาก', warning: '🚨 อันตราย! น้ำตาลในเลือดสูงมาก ควรรีบพบแพทย์' }
    }
    if (value === 'low') {
      return { level: 'very-low', color: 'purple', text: 'ต่ำมาก', warning: '🚨 อันตราย! น้ำตาลในเลือดต่ำมาก ควรรีบพบแพทย์' }
    }
    if (typeof value === 'number') {
      numericValue = value
    } else if (typeof value === 'string') {
      const parsed = Number(value)
      if (isNaN(parsed)) {
        return { level: 'unknown', color: 'gray', text: 'ไม่ทราบ', warning: '' }
      }
      numericValue = parsed
    } else {
      return { level: 'unknown', color: 'gray', text: 'ไม่ทราบ', warning: '' }
    }

    if (numericValue < 140) {
      return { level: 'normal', color: 'green', text: 'ปกติ', warning: '' }
    }
    if (numericValue >= 140 && numericValue <= 199) {
      return { level: 'high', color: 'yellow', text: 'เริ่มสูง', warning: '⚠️ น้ำตาลในเลือดเริ่มสูง ควรปรับพฤติกรรมและติดตาม' }
    }
    if (numericValue >= 200 && numericValue <= 300) {
      return { level: 'very-high', color: 'orange', text: 'สูง', warning: '⚠️ น้ำตาลในเลือดสูง ควรพบแพทย์' }
    }
    return { level: 'dangerous', color: 'red', text: 'สูงมาก', warning: '🚨 อันตราย! น้ำตาลในเลือดสูงมาก ควรรีบพบแพทย์' }
  }

  // ฟังก์ชันตรวจสอบระดับน้ำตาลในเลือด
  const getBloodSugarLevel = (value: number | string) => {
    // แปลงค่า high/low เป็นตัวเลขสำหรับการตรวจสอบ
    let numericValue: number
    if (value === 'high') {
      return { level: 'dangerous', color: 'red', text: 'สูงอันตราย', warning: '🚨 อันตราย! น้ำตาลในเลือดสูงมาก ควรรีบพบแพทย์' }
    }
    if (value === 'low') {
      return { level: 'very-low', color: 'purple', text: 'ต่ำมาก', warning: '🚨 อันตราย! น้ำตาลในเลือดต่ำมาก ควรรีบพบแพทย์' }
    }
    if (typeof value === 'number') {
      numericValue = value
    } else if (typeof value === 'string') {
      const parsed = Number(value)
      if (isNaN(parsed)) {
        return { level: 'unknown', color: 'gray', text: 'ไม่ทราบ', warning: '' }
      }
      numericValue = parsed
    } else {
      return { level: 'unknown', color: 'gray', text: 'ไม่ทราบ', warning: '' }
    }

    if (numericValue < 60) {
      return { level: 'very-low', color: 'purple', text: 'ต่ำมาก', warning: '🚨 อันตราย! น้ำตาลในเลือดต่ำมาก ควรรีบพบแพทย์' }
    }
    if (numericValue < 70) {
      return { level: 'low', color: 'blue', text: 'ต่ำ', warning: '⚠️ น้ำตาลในเลือดต่ำ ควรปรึกษาแพทย์' }
    }
    if (numericValue >= 70 && numericValue <= 100) {
      return { level: 'normal', color: 'green', text: 'ปกติ', warning: '' }
    }
    if (numericValue >= 101 && numericValue <= 125) {
      return { level: 'high', color: 'yellow', text: 'เริ่มจะสูง', warning: '⚠️ น้ำตาลในเลือดเริ่มจะสูง ควรปรับพฤติกรรมและติดตาม' }
    }
    if (numericValue >= 126 && numericValue <= 200) {
      return { level: 'very-high', color: 'orange', text: 'สูง', warning: '⚠️ น้ำตาลในเลือดสูง ควรพบแพทย์' }
    }
    if (numericValue > 200 && numericValue <= 400) {
      return { level: 'very-high-dark', color: 'orange', text: 'สูงมาก', warning: '⚠️ น้ำตาลในเลือดสูงมาก ควรพบแพทย์โดยเร็ว' }
    }
    return { level: 'dangerous', color: 'red', text: 'สูงอันตราย', warning: '🚨 อันตราย! น้ำตาลในเลือดสูงอันตราย ควรรีบพบแพทย์' }
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
    // Check URL parameters for LINE login callback
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    
    console.log('Dashboard loaded, URL params:', { code: !!code, state: !!state })
    
    checkAuth()
    loadData()
    
    // ตรวจสอบ LINE Browser
    const userAgent = navigator.userAgent
    const isLine = /Line/i.test(userAgent) || 
                   /LineBrowser/i.test(userAgent) ||
                   /LINE/i.test(userAgent) ||
                   userAgent.includes('Line')
    
    console.log('User Agent:', userAgent)
    console.log('Is LINE Browser:', isLine)
    setIsLineBrowser(isLine)
    
    // แสดง toast เพื่อแจ้งผู้ใช้
    if (isLine) {
      toast.success('ตรวจพบ LINE Browser - ระบบจะใช้ HTML แทน PDF', {
        duration: 3000,
        position: 'top-center'
      })
    }
    
    // Check if manual redirect button should be shown
    const lineLoginSuccess = localStorage.getItem('line-login-success')
    if (lineLoginSuccess === 'true') {
      setShowManualRedirect(true)
    }
  }, [])

  const checkAuth = async () => {
    try {
      console.log('Checking authentication...')
      
      // Check localStorage first for LINE login fallback
      const lineLoginSuccess = localStorage.getItem('line-login-success')
      const storedUser = localStorage.getItem('user')
      
      console.log('Checking localStorage:', { lineLoginSuccess, storedUser: !!storedUser })
      
      if (lineLoginSuccess === 'true' && storedUser) {
        console.log('Found LINE login data in localStorage, using fallback authentication')
        try {
          const userData = JSON.parse(storedUser)
          console.log('Parsed user data from localStorage:', userData)
          setUser(userData)
          
          // Check if profile is complete
          const isProfileComplete = userData.phone && userData.firstName && userData.lastName && 
                                   userData.hnNumber && userData.temple && userData.consent
          
          if (!isProfileComplete) {
            console.log('Profile incomplete, redirecting to profile page')
            toast('กรุณากรอกข้อมูลให้ครบถ้วนก่อนใช้งาน', {
              duration: 3000,
              position: 'top-center'
            })
            // Clear the flag after using it
            localStorage.removeItem('line-login-success')
            setTimeout(() => {
              router.push('/profile')
            }, 1000)
            return
          }
          
          // Clear the flag after using it
          localStorage.removeItem('line-login-success')
          setIsLoading(false)
          console.log('Successfully authenticated using localStorage fallback')
          return
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError)
        }
      }
      
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Ensure cookies are sent
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      console.log('Auth check response status:', response.status)
      
      const result = await response.json()
      console.log('Auth check result:', result)
      
      if (result.success) {
        console.log('User authenticated:', result.user)
        setUser(result.user)
        
        // Check if profile is complete
        const isProfileComplete = result.user.phone && result.user.firstName && result.user.lastName && 
                                 result.user.hnNumber && result.user.temple && result.user.consent
        
        if (!isProfileComplete) {
          console.log('Profile incomplete, redirecting to profile page')
          toast('กรุณากรอกข้อมูลให้ครบถ้วนก่อนใช้งาน', {
            duration: 3000,
            position: 'top-center'
          })
          setTimeout(() => {
            router.push('/profile')
          }, 1000)
          return
        }
      } else {
        console.log('Authentication failed, redirecting to login')
        // For LINE Browser, use window.location.href
        const isLineBrowser = /Line/i.test(navigator.userAgent) || 
                             /LineBrowser/i.test(navigator.userAgent) ||
                             /LINE/i.test(navigator.userAgent)
        
        if (isLineBrowser) {
          window.location.href = '/login'
        } else {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
      // For LINE Browser, use window.location.href
      const isLineBrowser = /Line/i.test(navigator.userAgent) || 
                           /LineBrowser/i.test(navigator.userAgent) ||
                           /LINE/i.test(navigator.userAgent)
      
      if (isLineBrowser) {
        window.location.href = '/login'
      } else {
        router.push('/login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadData = async () => {
    try {
      const [bpResponse, bsResponse] = await Promise.all([
        fetch('/api/blood-pressure?limit=30'), // จำกัดแค่ 30 รายการล่าสุด
        fetch('/api/blood-sugar?limit=30')
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

    // ตรวจสอบการส่งซ้ำ - ห้ามส่งซ้ำภายใน 5 นาที
    const now = Date.now()
    const COOLDOWN_PERIOD = 5 * 60 * 1000 // 5 นาที
    
    if (lastSentTime && (now - lastSentTime) < COOLDOWN_PERIOD) {
      const remainingTime = Math.ceil((COOLDOWN_PERIOD - (now - lastSentTime)) / 1000 / 60)
      toast.error(`กรุณารอ ${remainingTime} นาที ก่อนส่งข้อมูลใหม่`, {
        position: 'top-center',
        duration: 4000,
      })
      return
    }

    // ตรวจสอบว่ากำลังส่งอยู่หรือไม่
    if (isSending) {
      toast.error('กำลังส่งข้อมูลอยู่ กรุณารอสักครู่', {
        position: 'top-center',
        duration: 3000,
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
        // บันทึกเวลาที่ส่งสำเร็จ
        setLastSentTime(now)
        
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
        // จัดการ error 429 (Too Many Requests)
        if (response.status === 429 && result.cooldownRemaining) {
          setLastSentTime(now - (5 * 60 * 1000 - result.cooldownRemaining * 60 * 1000))
        }
        
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
      // ตรวจสอบว่าเป็น LINE Browser หรือไม่ (หลายวิธี)
      const userAgent = navigator.userAgent
      const isLineBrowser = /Line/i.test(userAgent) || 
                           /LineBrowser/i.test(userAgent) ||
                           /LINE/i.test(userAgent) ||
                           userAgent.includes('Line')
      
      console.log('User Agent:', userAgent)
      console.log('Is LINE Browser:', isLineBrowser)
      
      if (isLineBrowser) {
        // สำหรับ LINE Browser ใช้วิธีสร้าง HTML และแปลงเป็น PDF
        console.log('Using LINE Browser HTML generation')
        await generatePdfForLineBrowser()
        return
      }

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
      
      // ถ้า PDF generation ล้มเหลว ให้ลองใช้วิธี HTML
      toast.error('ไม่สามารถสร้าง PDF ได้ กำลังสร้างไฟล์ HTML แทน...', {
        duration: 3000
      })
      
      try {
        await generatePdfForLineBrowser()
      } catch (htmlError) {
        console.error('Error generating HTML fallback:', htmlError)
        toast.error('เกิดข้อผิดพลาดในการสร้างไฟล์รายงาน')
      }
    }
  }

  // ฟังก์ชันสำหรับสร้าง PDF ใน LINE Browser
  const generatePdfForLineBrowser = async () => {
    try {
      // สร้าง HTML content สำหรับ PDF
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
        .map(r => ({
          date: new Date(r.recordedAt).toLocaleDateString('th-TH'),
          time: timeMap[r.timeOfDay] || r.timeOfDay,
          systolic: r.systolic,
          diastolic: r.diastolic,
          pulse: r.pulse || '-'
        }))

      const sugarRows = bloodSugarRecords
        .slice(0, 50)
        .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
        .slice(-7)
        .map(r => ({
          date: new Date(r.recordedAt).toLocaleDateString('th-TH'),
          time: timeMap[r.timeOfDay] || r.timeOfDay,
          value: r.value === 'high' ? 'สูงมาก' : r.value === 'low' ? 'ต่ำมาก' : String(r.value)
        }))

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>รายงานข้อมูลสุขภาพ 7 วันล่าสุด</title>
          <style>
            body { 
              font-family: 'THSarabunNew', Arial, sans-serif; 
              margin: 20px; 
              font-size: 14px;
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #f97316;
              padding-bottom: 10px;
            }
            .section { 
              margin: 20px 0; 
            }
            .section-title { 
              color: #f97316; 
              font-size: 18px; 
              font-weight: bold; 
              margin-bottom: 10px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 10px 0;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: center;
            }
            th { 
              background-color: #f97316; 
              color: white; 
              font-weight: bold;
            }
            .no-data { 
              text-align: center; 
              color: #666; 
              font-style: italic;
              padding: 20px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>รายงานข้อมูลสุขภาพ 7 วันล่าสุด</h1>
            <p>พระคุณเจ้า ${user?.firstName} ${user?.lastName} ${user?.hnNumber ? `(HN: ${user.hnNumber})` : ''}</p>
            <p>วันที่สร้างรายงาน: ${new Date().toLocaleDateString('th-TH')}</p>
          </div>

          <div class="section">
            <h2 class="section-title">ความดันโลหิต</h2>
            ${bpRows.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>วันที่</th>
                    <th>เวลา</th>
                    <th>Systolic</th>
                    <th>Diastolic</th>
                    <th>Pulse</th>
                  </tr>
                </thead>
                <tbody>
                  ${bpRows.map(row => `
                    <tr>
                      <td>${row.date}</td>
                      <td>${row.time}</td>
                      <td>${row.systolic}</td>
                      <td>${row.diastolic}</td>
                      <td>${row.pulse}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<div class="no-data">ไม่มีข้อมูลความดันโลหิต</div>'}
          </div>

          <div class="section">
            <h2 class="section-title">ผลเจาะเลือดดูค่าน้ำตาลปลายนิ้ว</h2>
            ${sugarRows.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>วันที่</th>
                    <th>เวลา</th>
                    <th>ค่า (mg/dL)</th>
                  </tr>
                </thead>
                <tbody>
                  ${sugarRows.map(row => `
                    <tr>
                      <td>${row.date}</td>
                      <td>${row.time}</td>
                      <td>${row.value}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<div class="no-data">ไม่มีข้อมูลน้ำตาลในเลือด</div>'}
          </div>

          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            <p>รายงานนี้ถูกสร้างจากระบบบันทึกข้อมูลสุขภาพดิจิตอล - โรงพยาบาลสงฆ์</p>
          </div>
        </body>
        </html>
      `

      // สำหรับ LINE Browser ใช้วิธีเปิดในหน้าต่างใหม่
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(htmlContent)
        newWindow.document.close()
        
        // พยายามดาวน์โหลดด้วย
        try {
          const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          
          const link = document.createElement('a')
          link.href = url
          link.download = 'weekly-health-report.html'
          link.style.display = 'none'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          URL.revokeObjectURL(url)
        } catch (downloadError) {
          console.log('Download failed, but HTML opened in new window')
        }
      } else {
        // ถ้าเปิดหน้าต่างใหม่ไม่ได้ ให้แสดง HTML ในหน้าเดิม
        const newPage = window.open('about:blank', '_blank')
        if (newPage) {
          newPage.document.write(htmlContent)
          newPage.document.close()
        } else {
          // วิธีสุดท้าย: แสดงใน alert
          alert('กรุณาคัดลอกข้อมูลนี้ไปเปิดในเบราว์เซอร์อื่น:\n\n' + htmlContent.substring(0, 500) + '...')
        }
      }
      
      toast.success('ดาวน์โหลดไฟล์ HTML สำเร็จ! เปิดด้วยเบราว์เซอร์เพื่อพิมพ์เป็น PDF', {
        duration: 5000,
        position: 'top-center'
      })
      
    } catch (error) {
      console.error('Error generating PDF for LINE Browser:', error)
      toast.error('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF สำหรับ LINE Browser')
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
          {showManualRedirect && (
            <button
              onClick={() => {
                console.log('Manual redirect to dashboard from loading screen')
                window.location.href = '/dashboard'
              }}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              ไปยัง Dashboard
            </button>
          )}
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
                  <label className="form-label">หมายเหตุ (ไม่เกิน 50 ตัวอักษร)</label>
                  <textarea
                    {...bpForm.register('notes', {
                      maxLength: {
                        value: 50,
                        message: 'หมายเหตุไม่เกิน 50 ตัวอักษร'
                      }
                    })}
                    className="input-field"
                    rows={2}
                    placeholder="หมายเหตุสั้นๆ..."
                    maxLength={50}
                  />
                  {bpForm.formState.errors.notes && (
                    <p className="error-message">{bpForm.formState.errors.notes.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {bpForm.watch('notes')?.length || 0}/50 ตัวอักษร
                  </p>
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
                  const bpLevel = getBloodPressureLevel(record.systolic, record.diastolic)
                  const colorClasses = {
                    green: 'bg-green-50 border-green-200',
                    yellow: 'bg-yellow-50 border-yellow-200',
                    orange: 'bg-orange-50 border-orange-200',
                    red: 'bg-red-50 border-red-200',
                    blue: 'bg-blue-50 border-blue-200',
                    purple: 'bg-purple-50 border-purple-200'
                  }
                  const textColorClasses = {
                    green: 'text-green-800',
                    yellow: 'text-yellow-800',
                    orange: 'text-orange-800',
                    red: 'text-red-800',
                    blue: 'text-blue-800',
                    purple: 'text-purple-800'
                  }
                  return (
                    <div key={record.id} className={`flex justify-between items-center p-3 rounded-lg border ${colorClasses[bpLevel.color as keyof typeof colorClasses]}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${textColorClasses[bpLevel.color as keyof typeof textColorClasses]}`}>
                            {record.systolic}/{record.diastolic} mmHg
                          </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            bpLevel.color === 'green' ? 'bg-green-100 text-green-800' :
                            bpLevel.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            bpLevel.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                            bpLevel.color === 'red' ? 'bg-red-100 text-red-800' :
                            bpLevel.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {bpLevel.text}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {timeLabels[record.timeOfDay as keyof typeof timeLabels]} - {new Date(record.recordedAt).toLocaleDateString('th-TH')}
                        </p>
                        {record.pulse && (
                          <p className="text-sm text-gray-600">Pulse: {record.pulse}</p>
                        )}
                        {bpLevel.warning && (
                          <p className="text-xs text-red-600 mt-1 font-medium">{bpLevel.warning}</p>
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
                  <label className="form-label">หมายเหตุ (ไม่เกิน 50 ตัวอักษร)</label>
                  <textarea
                    {...bsForm.register('notes', {
                      maxLength: {
                        value: 50,
                        message: 'หมายเหตุไม่เกิน 50 ตัวอักษร'
                      }
                    })}
                    className="input-field"
                    rows={2}
                    placeholder="หมายเหตุสั้นๆ..."
                    maxLength={50}
                  />
                  {bsForm.formState.errors.notes && (
                    <p className="error-message">{bsForm.formState.errors.notes.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {bsForm.watch('notes')?.length || 0}/50 ตัวอักษร
                  </p>
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
                  const bsLevel = record.timeOfDay === 'after_meal_2h' 
                    ? getBloodSugarLevelPostMeal(record.value)
                    : getBloodSugarLevel(record.value)
                  const colorClasses = {
                    green: 'bg-green-50 border-green-200',
                    yellow: 'bg-yellow-50 border-yellow-200',
                    orange: 'bg-orange-50 border-orange-200',
                    red: 'bg-red-50 border-red-200',
                    blue: 'bg-blue-50 border-blue-200',
                    purple: 'bg-purple-50 border-purple-200',
                    gray: 'bg-gray-50 border-gray-200'
                  }
                  const textColorClasses = {
                    green: 'text-green-800',
                    yellow: 'text-yellow-800',
                    orange: 'text-orange-800',
                    red: 'text-red-800',
                    blue: 'text-blue-800',
                    purple: 'text-purple-800',
                    gray: 'text-gray-800'
                  }
                  return (
                    <div key={record.id} className={`flex justify-between items-center p-3 rounded-lg border ${colorClasses[bsLevel.color as keyof typeof colorClasses]}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${textColorClasses[bsLevel.color as keyof typeof textColorClasses]}`}>
                            {record.value === 'high' ? 'High (สูงมาก)' : 
                             record.value === 'low' ? 'Low (ต่ำมาก)' : 
                             `${record.value} ${record.unit}`}
                          </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            bsLevel.color === 'green' ? 'bg-green-100 text-green-800' :
                            bsLevel.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            bsLevel.color === 'orange' ? (bsLevel.level === 'very-high-dark' ? 'bg-orange-200 text-orange-900' : 'bg-orange-100 text-orange-800') :
                            bsLevel.color === 'red' ? 'bg-red-100 text-red-800' :
                            bsLevel.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                            bsLevel.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {bsLevel.text}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {timeLabels[record.timeOfDay as keyof typeof timeLabels]} - {new Date(record.recordedAt).toLocaleDateString('th-TH')}
                        </p>
                        {bsLevel.warning && (
                          <p className="text-xs text-red-600 mt-1 font-medium">{bsLevel.warning}</p>
                        )}
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
            {/* Guidelines Button */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">เกณฑ์และคำแนะนำ</h3>
                <button
                  onClick={() => setShowGuidelines(!showGuidelines)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  {showGuidelines ? 'ซ่อนเกณฑ์' : 'แสดงเกณฑ์'}
                </button>
              </div>
              
              {showGuidelines && (
                <div className="space-y-6">
                  {/* Blood Pressure Guidelines */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                      <Activity className="h-5 w-5 mr-2" />
                      เกณฑ์ความดันโลหิต
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-500 rounded"></div>
                          <span className="font-medium">ปกติ:</span>
                          <span>SBP &lt; 140, DBP &lt; 90</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                          <span className="font-medium">สูงเล็กน้อย:</span>
                          <span>SBP 140-159, DBP 90-99</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-orange-500 rounded"></div>
                          <span className="font-medium">สูงปานกลาง:</span>
                          <span>SBP 160-179, DBP 100-109</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-red-500 rounded"></div>
                          <span className="font-medium">สูงมาก:</span>
                          <span>SBP &gt; 180, DBP &gt; 109</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                          <span className="font-medium">ต่ำ:</span>
                          <span>SBP &lt; 90, DBP &lt; 60</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-purple-500 rounded"></div>
                          <span className="font-medium">ต่ำมาก:</span>
                          <span>SBP &lt; 70, DBP &lt; 40</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Blood Sugar Guidelines */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                      <Heart className="h-5 w-5 mr-2" />
                      เกณฑ์น้ำตาลในเลือด
                    </h4>
                    
                    {/* Before Meal */}
                    <div className="mb-4">
                      <h5 className="font-semibold text-gray-700 mb-2">ก่อนอาหาร (Fasting)</h5>
                      <div className="grid md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span>ปกติ: 70-100 mg/dL</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                          <span>เริ่มจะสูง: 101-125 mg/dL</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded"></div>
                          <span>สูง: 126-200 mg/dL</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-600 rounded"></div>
                          <span>สูงมาก: 201-400 mg/dL</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          <span>สูงอันตราย: &gt; 400 mg/dL</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span>ต่ำ: 60-69 mg/dL</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-purple-500 rounded"></div>
                          <span>ต่ำมาก: &lt; 60 mg/dL</span>
                        </div>
                      </div>
                    </div>

                    {/* After Meal */}
                    <div>
                      <h5 className="font-semibold text-gray-700 mb-2">หลังอาหาร 2 ชั่วโมง</h5>
                      <div className="grid md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span>ปกติ: &lt; 140 mg/dL</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                          <span>เริ่มสูง: 140-199 mg/dL</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded"></div>
                          <span>สูง: 200-300 mg/dL</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          <span>สูงมาก: &gt; 300 mg/dL</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
                      value: record.value === 'high' ? 650 : record.value === 'low' ? 15 : record.value,
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
                      value: record.value === 'high' ? 650 : record.value === 'low' ? 15 : record.value
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
                            // แปลงค่า high/low เป็นตัวเลขสำหรับการคำนวณ
                            const convertedValues = bloodSugarRecords.map(record => {
                              if (record.value === 'high') return 650
                              if (record.value === 'low') return 15
                              return typeof record.value === 'number' ? record.value : 0
                            }).filter(val => val > 0)
                            
                            if (convertedValues.length === 0) return 'ไม่มีข้อมูลตัวเลข'
                            
                            const avg = convertedValues.reduce((sum, val) => sum + val, 0) / convertedValues.length
                            return bloodSugarRecords[0].unit === 'mg/dL' 
                              ? Math.round(avg)
                              : avg.toFixed(1)
                          })()} {bloodSugarRecords[0]?.unit || 'mg/dL'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <span className="text-yellow-700 font-medium">ค่าสูงสุด</span>
                        <span className="text-yellow-900 font-bold">
                          {(() => {
                            // แปลงค่า high/low เป็นตัวเลขสำหรับการคำนวณ
                            const convertedValues = bloodSugarRecords.map(record => {
                              if (record.value === 'high') return 650
                              if (record.value === 'low') return 15
                              return typeof record.value === 'number' ? record.value : 0
                            }).filter(val => val > 0)
                            
                            if (convertedValues.length === 0) return 'ไม่มีข้อมูลตัวเลข'
                            
                            const max = Math.max(...convertedValues)
                            return bloodSugarRecords[0].unit === 'mg/dL' 
                              ? Math.round(max)
                              : max.toFixed(1)
                          })()} {bloodSugarRecords[0]?.unit || 'mg/dL'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                        <span className="text-pink-700 font-medium">ค่าต่ำสุด</span>
                        <span className="text-pink-900 font-bold">
                          {(() => {
                            // แปลงค่า high/low เป็นตัวเลขสำหรับการคำนวณ
                            const convertedValues = bloodSugarRecords.map(record => {
                              if (record.value === 'high') return 650
                              if (record.value === 'low') return 15
                              return typeof record.value === 'number' ? record.value : 0
                            }).filter(val => val > 0)
                            
                            if (convertedValues.length === 0) return 'ไม่มีข้อมูลตัวเลข'
                            
                            const min = Math.min(...convertedValues)
                            return bloodSugarRecords[0].unit === 'mg/dL' 
                              ? Math.round(min)
                              : min.toFixed(1)
                          })()} {bloodSugarRecords[0]?.unit || 'mg/dL'}
                        </span>
                      </div>
                      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-700">
                          <strong>หมายเหตุ:</strong> ค่า High = 650 mg/dL, ค่า Low = 15 mg/dL (ค่าที่กำหนดไว้สำหรับการคำนวณสถิติ)
                        </p>
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
                    (() => {
                      const latestBP = bloodPressureRecords[0]
                      const bpLevel = getBloodPressureLevel(latestBP.systolic, latestBP.diastolic)
                      const colorClasses = {
                        green: 'bg-green-50 border-green-200',
                        yellow: 'bg-yellow-50 border-yellow-200',
                        orange: 'bg-orange-50 border-orange-200',
                        red: 'bg-red-50 border-red-200',
                        blue: 'bg-blue-50 border-blue-200',
                        purple: 'bg-purple-50 border-purple-200'
                      }
                      const textColorClasses = {
                        green: 'text-green-800',
                        yellow: 'text-yellow-800',
                        orange: 'text-orange-800',
                        red: 'text-red-800',
                        blue: 'text-blue-800',
                        purple: 'text-purple-800'
                      }
                      return (
                        <div className={`p-3 rounded-lg border ${colorClasses[bpLevel.color as keyof typeof colorClasses]}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <p className={`text-sm font-medium ${textColorClasses[bpLevel.color as keyof typeof textColorClasses]}`}>
                              ความดันโลหิตล่าสุด
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              bpLevel.color === 'green' ? 'bg-green-100 text-green-800' :
                              bpLevel.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                              bpLevel.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                              bpLevel.color === 'red' ? 'bg-red-100 text-red-800' :
                              bpLevel.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {bpLevel.text}
                            </span>
                          </div>
                          <p className={`text-lg font-bold ${textColorClasses[bpLevel.color as keyof typeof textColorClasses]}`}>
                            {latestBP.systolic}/{latestBP.diastolic} mmHg
                          </p>
                          <p className="text-xs text-gray-600">
                            {(() => {
                              const timeLabels = {
                                morning: 'เช้า',
                                afternoon: 'กลางวัน',
                                evening: 'เย็น',
                                before_bed: 'ก่อนนอน'
                              }
                              return timeLabels[latestBP.timeOfDay as keyof typeof timeLabels] || latestBP.timeOfDay
                            })()} - {new Date(latestBP.recordedAt).toLocaleDateString('th-TH')}
                          </p>
                          {bpLevel.warning && (
                            <p className="text-xs text-red-600 mt-2 font-medium">{bpLevel.warning}</p>
                          )}
                        </div>
                      )
                    })()
                  ) : (
                    <p className="text-gray-500 text-center py-4">ยังไม่มีข้อมูล</p>
                  )}
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">ข้อมูลล่าสุด - น้ำตาลในเลือด</h3>
                <div className="space-y-3">
                  {bloodSugarRecords.length > 0 ? (
                    (() => {
                      const latestBS = bloodSugarRecords[0]
                      const bsLevel = latestBS.timeOfDay === 'after_meal_2h' 
                        ? getBloodSugarLevelPostMeal(latestBS.value)
                        : getBloodSugarLevel(latestBS.value)
                      const colorClasses = {
                        green: 'bg-green-50 border-green-200',
                        yellow: 'bg-yellow-50 border-yellow-200',
                        orange: 'bg-orange-50 border-orange-200',
                        red: 'bg-red-50 border-red-200',
                        blue: 'bg-blue-50 border-blue-200',
                        purple: 'bg-purple-50 border-purple-200',
                        gray: 'bg-gray-50 border-gray-200'
                      }
                      const textColorClasses = {
                        green: 'text-green-800',
                        yellow: 'text-yellow-800',
                        orange: 'text-orange-800',
                        red: 'text-red-800',
                        blue: 'text-blue-800',
                        purple: 'text-purple-800',
                        gray: 'text-gray-800'
                      }
                      return (
                        <div className={`p-3 rounded-lg border ${colorClasses[bsLevel.color as keyof typeof colorClasses]}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <p className={`text-sm font-medium ${textColorClasses[bsLevel.color as keyof typeof textColorClasses]}`}>
                              น้ำตาลในเลือดล่าสุด
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              bsLevel.color === 'green' ? 'bg-green-100 text-green-800' :
                              bsLevel.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                              bsLevel.color === 'orange' ? (bsLevel.level === 'very-high-dark' ? 'bg-orange-200 text-orange-900' : 'bg-orange-100 text-orange-800') :
                              bsLevel.color === 'red' ? 'bg-red-100 text-red-800' :
                              bsLevel.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                              bsLevel.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {bsLevel.text}
                            </span>
                          </div>
                          <p className={`text-lg font-bold ${textColorClasses[bsLevel.color as keyof typeof textColorClasses]}`}>
                            {latestBS.value === 'high' ? 'High (สูงมาก)' : 
                             latestBS.value === 'low' ? 'Low (ต่ำมาก)' : 
                             `${latestBS.value} ${latestBS.unit}`}
                          </p>
                          <p className="text-xs text-gray-600">
                            {(() => {
                              const timeLabels = {
                                before_breakfast: 'ก่อนอาหารเช้า',
                                before_lunch: 'ก่อนอาหารกลางวัน',
                                before_dinner: 'ก่อนอาหารเย็น',
                                after_meal_2h: 'หลังอาหาร 2 ชม.',
                                before_bed: 'ก่อนนอน'
                              }
                              return timeLabels[latestBS.timeOfDay as keyof typeof timeLabels] || latestBS.timeOfDay
                            })()} - {new Date(latestBS.recordedAt).toLocaleDateString('th-TH')}
                          </p>
                          {bsLevel.warning && (
                            <p className="text-xs text-red-600 mt-2 font-medium">{bsLevel.warning}</p>
                          )}
                        </div>
                      )
                    })()
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
                  {lastSentTime && (
                    <div className="text-sm text-gray-600 mt-2">
                      <p>ส่งข้อมูลล่าสุด: {new Date(lastSentTime).toLocaleString('th-TH')}</p>
                      {(() => {
                        const now = Date.now()
                        const COOLDOWN_PERIOD = 5 * 60 * 1000
                        const remainingTime = Math.ceil((COOLDOWN_PERIOD - (now - lastSentTime)) / 1000 / 60)
                        if (remainingTime > 0) {
                          return <p className="text-orange-600">สามารถส่งใหม่ได้ในอีก {remainingTime} นาที</p>
                        }
                        return <p className="text-green-600">สามารถส่งข้อมูลใหม่ได้แล้ว</p>
                      })()}
                    </div>
                  )}
                  <button
                    onClick={generateWeeklyPdf}
                    className="btn-secondary"
                  >
                    {isLineBrowser 
                      ? 'ดาวน์โหลดรายสัปดาห์ (HTML)' 
                      : 'ดาวน์โหลดรายสัปดาห์ (PDF)'
                    }
                  </button>
                  <button
                    onClick={() => {
                      console.log('Force HTML mode')
                      generatePdfForLineBrowser()
                    }}
                    className="btn-secondary bg-green-600 hover:bg-green-700 text-white"
                    style={{ marginLeft: '8px' }}
                  >
                    ดาวน์โหลดรายสัปดาห์ (HTML)
                  </button>
                  <button
                    onClick={() => {
                      // วิธีสำรอง: แสดงข้อมูลในหน้าเดิม
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
                        .slice(0, 7)
                        .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
                        .map(r => ({
                          date: new Date(r.recordedAt).toLocaleDateString('th-TH'),
                          time: timeMap[r.timeOfDay] || r.timeOfDay,
                          systolic: r.systolic,
                          diastolic: r.diastolic,
                          pulse: r.pulse || '-'
                        }))

                      const sugarRows = bloodSugarRecords
                        .slice(0, 7)
                        .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
                        .map(r => ({
                          date: new Date(r.recordedAt).toLocaleDateString('th-TH'),
                          time: timeMap[r.timeOfDay] || r.timeOfDay,
                          value: r.value === 'high' ? 'สูงมาก' : r.value === 'low' ? 'ต่ำมาก' : String(r.value)
                        }))

                      const reportText = `
รายงานข้อมูลสุขภาพ 7 วันล่าสุด
พระคุณเจ้า ${user?.firstName} ${user?.lastName} ${user?.hnNumber ? `(HN: ${user.hnNumber})` : ''}
วันที่สร้างรายงาน: ${new Date().toLocaleDateString('th-TH')}

ความดันโลหิต:
${bpRows.map(row => `${row.date} ${row.time}: ${row.systolic}/${row.diastolic} mmHg (Pulse: ${row.pulse})`).join('\n')}

น้ำตาลในเลือด:
${sugarRows.map(row => `${row.date} ${row.time}: ${row.value}`).join('\n')}

รายงานนี้ถูกสร้างจากระบบบันทึกข้อมูลสุขภาพดิจิตอล - โรงพยาบาลสงฆ์
                      `

                      // แสดงใน modal หรือ alert
                      const modal = document.createElement('div')
                      modal.style.cssText = `
                        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                        background: rgba(0,0,0,0.8); z-index: 9999; display: flex;
                        align-items: center; justify-content: center; padding: 20px;
                      `
                      modal.innerHTML = `
                        <div style="background: white; padding: 20px; border-radius: 8px; max-width: 90%; max-height: 90%; overflow: auto;">
                          <h3 style="margin-top: 0; color: #f97316;">รายงานข้อมูลสุขภาพ</h3>
                          <pre style="white-space: pre-wrap; font-family: monospace; font-size: 12px; line-height: 1.4;">${reportText}</pre>
                          <div style="margin-top: 15px; text-align: center;">
                            <button onclick="this.closest('div').parentElement.remove()" style="padding: 8px 16px; background: #f97316; color: white; border: none; border-radius: 4px; cursor: pointer;">ปิด</button>
                            <button onclick="navigator.clipboard.writeText(\`${reportText}\`); alert('คัดลอกแล้ว!');" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">คัดลอก</button>
                          </div>
                        </div>
                      `
                      document.body.appendChild(modal)
                    }}
                    className="btn-secondary bg-orange-600 hover:bg-orange-700 text-white"
                    style={{ marginLeft: '8px' }}
                  >
                    ดูรายงาน (LINE)
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/cleanup', { method: 'POST' })
                        const result = await response.json()
                        if (result.success) {
                          toast.success('ทำความสะอาดข้อมูลสำเร็จ!')
                        } else {
                          toast.error('ทำความสะอาดข้อมูลล้มเหลว')
                        }
                      } catch (error) {
                        toast.error('เกิดข้อผิดพลาดในการทำความสะอาดข้อมูล')
                      }
                    }}
                    className="btn-secondary bg-purple-600 hover:bg-purple-700 text-white"
                    style={{ marginLeft: '8px' }}
                  >
                    ทำความสะอาดข้อมูล
                  </button>
                </div>
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-700 italic">
                    ส่งข้อมูลทาง email ให้ทางคลินิก ผู้ป่วยต้องโทรหรือติดต่อ line เพื่อสอบถามให้ติดตามข้อมูลต่อ ทางคลินิกจะไม่ได้เปิดดู email โดยอัตโนมัติ
                  </p>
                </div>
                {isLineBrowser && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      <strong>สำหรับ LINE Browser:</strong> LINE ไม่รองรับการดาวน์โหลดไฟล์โดยตรง
                      กรุณาเปิดหน้านี้ด้วยเบราว์เซอร์อื่น เช่น Chrome หรือ Safari เพื่อดาวน์โหลดไฟล์ได้ตามปกติ
                      หากต้องการใช้งานทันที ให้กดปุ่มด้านบนเพื่อสร้างไฟล์ HTML แล้วเปิดด้วยเบราว์เซอร์อื่นเพื่อพิมพ์เป็น PDF
                    </p>
                  </div>
                )}
                <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm text-purple-700">
                    <strong>การทำความสะอาดข้อมูล:</strong> ลบข้อมูลเก่าเกิน 1 เดือน, ลบประวัติส่งอีเมลเก่า 7 วัน, 
                    ลบข้อมูลซ้ำซ้อน, และเคลียร์หมายเหตุว่างเปล่า เพื่อประหยัดเนื้อที่และทำให้ระบบเร็วขึ้น
                  </p>
                </div>
                {!user?.consent && (
                  <p className="text-sm text-yellow-600">
                    คุณต้องยินยอมการแชร์ข้อมูลก่อนส่งให้คลินิก
                  </p>
                )}
                
                {!(user as any)?.lineId && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">
                      เชื่อม LINE Account
                    </h4>
                    <p className="text-sm text-blue-700 mb-3">
                      เชื่อม LINE เพื่อความสะดวกในการเข้าสู่ระบบครั้งต่อไป
                    </p>
                    <button
                      onClick={() => router.push('/connect-line')}
                      className="btn-primary text-sm py-2 px-4"
                    >
                      เชื่อม LINE Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
