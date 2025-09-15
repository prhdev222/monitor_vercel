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
  Clock
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const bloodPressureSchema = z.object({
  systolic: z.number().min(50).max(300),
  diastolic: z.number().min(30).max(200),
  pulse: z.number().min(30).max(200).optional(),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'before_bed']),
  notes: z.string().optional()
})

const bloodSugarSchema = z.object({
  value: z.number().min(0).max(1000),
  unit: z.string().default('mg/dL'),
  timeOfDay: z.enum(['before_breakfast', 'before_lunch', 'before_dinner', 'after_meal_2h', 'before_bed']),
  notes: z.string().optional()
})

type BloodPressureForm = z.infer<typeof bloodPressureSchema>
type BloodSugarForm = z.infer<typeof bloodSugarSchema>

interface User {
  id: string
  phone: string
  name?: string
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
  value: number
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
  const router = useRouter()

  const bpForm = useForm<BloodPressureForm>({
    resolver: zodResolver(bloodPressureSchema),
    defaultValues: {
      systolic: 120,
      diastolic: 80,
      pulse: 70,
      timeOfDay: 'morning'
    }
  })

  const bsForm = useForm<BloodSugarForm>({
    resolver: zodResolver(bloodSugarSchema),
    defaultValues: {
      value: 100,
      unit: 'mg/dL',
      timeOfDay: 'before_breakfast'
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
      const response = await fetch('/api/blood-pressure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()
      if (result.success) {
        toast.success('บันทึกข้อมูลความดันโลหิตสำเร็จ')
        bpForm.reset()
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
      const response = await fetch('/api/blood-sugar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()
      if (result.success) {
        toast.success('บันทึกค่าน้ำตาลในเลือดสำเร็จ')
        bsForm.reset()
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

  const chartData = bloodPressureRecords.slice(0, 7).reverse().map(record => ({
    date: new Date(record.recordedAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
    systolic: record.systolic,
    diastolic: record.diastolic
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">ระบบบันทึกข้อมูลสุขภาพ</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                สวัสดี, {user?.name || user?.phone}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('bp')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bp'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Activity className="h-5 w-5 inline mr-2" />
                ความดันโลหิต
              </button>
              <button
                onClick={() => setActiveTab('bs')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bs'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Heart className="h-5 w-5 inline mr-2" />
                น้ำตาลในเลือด
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="h-5 w-5 inline mr-2" />
                ประวัติและกราฟ
              </button>
            </nav>
          </div>
        </div>

        {/* Blood Pressure Form */}
        {activeTab === 'bp' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-red-500" />
                บันทึกความดันโลหิต
              </h3>
              <form onSubmit={bpForm.handleSubmit(onSubmitBP)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Systolic (บน)</label>
                    <input
                      {...bpForm.register('systolic', { valueAsNumber: true })}
                      type="number"
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
                      className="input-field"
                      placeholder="80"
                    />
                    {bpForm.formState.errors.diastolic && (
                      <p className="error-message">{bpForm.formState.errors.diastolic.message}</p>
                    )}
                  </div>
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
                <button type="submit" className="w-full btn-primary">
                  <Plus className="h-5 w-5 inline mr-2" />
                  บันทึกข้อมูล
                </button>
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
                      <div>
                        <p className="font-medium">
                          {record.systolic}/{record.diastolic} mmHg
                        </p>
                        <p className="text-sm text-gray-600">
                          {timeLabels[record.timeOfDay as keyof typeof timeLabels]} - {new Date(record.recordedAt).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                      <div className="text-right">
                        {record.pulse && (
                          <p className="text-sm text-gray-600">Pulse: {record.pulse}</p>
                        )}
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
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="text-lg font-semibold mb-6 flex items-center">
                <Heart className="h-5 w-5 mr-2 text-green-500" />
                บันทึกน้ำตาลในเลือด
              </h3>
              <form onSubmit={bsForm.handleSubmit(onSubmitBS)} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">ค่าน้ำตาลในเลือด</label>
                  <input
                    {...bsForm.register('value', { valueAsNumber: true })}
                    type="number"
                    step="0.1"
                    className="input-field"
                    placeholder="100"
                  />
                  {bsForm.formState.errors.value && (
                    <p className="error-message">{bsForm.formState.errors.value.message}</p>
                  )}
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
                <button type="submit" className="w-full btn-primary">
                  <Plus className="h-5 w-5 inline mr-2" />
                  บันทึกข้อมูล
                </button>
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
                      <div>
                        <p className="font-medium">
                          {record.value} {record.unit}
                        </p>
                        <p className="text-sm text-gray-600">
                          {timeLabels[record.timeOfDay as keyof typeof timeLabels]} - {new Date(record.recordedAt).toLocaleDateString('th-TH')}
                        </p>
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
          <div className="space-y-8">
            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-8">
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
                <h3 className="text-lg font-semibold mb-4">กราฟน้ำตาลในเลือด (7 วันล่าสุด)</h3>
                {(() => {
                  const sugarChartData = bloodSugarRecords.slice(0, 7).reverse().map(record => ({
                    date: new Date(record.recordedAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
                    value: record.value,
                    timeOfDay: record.timeOfDay
                  }))
                  
                  return sugarChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={sugarChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} name="น้ำตาลในเลือด" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-center py-8">ไม่มีข้อมูลสำหรับแสดงกราฟ</p>
                  )
                })()}
              </div>
            </div>

            {/* Statistics */}
            <div className="grid lg:grid-cols-2 gap-8">
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
                          {bloodSugarRecords[0].unit === 'mg/dL' 
                            ? Math.round(bloodSugarRecords.reduce((sum, record) => sum + record.value, 0) / bloodSugarRecords.length)
                            : (bloodSugarRecords.reduce((sum, record) => sum + record.value, 0) / bloodSugarRecords.length).toFixed(1)
                          } {bloodSugarRecords[0].unit}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <span className="text-yellow-700 font-medium">ค่าสูงสุด</span>
                        <span className="text-yellow-900 font-bold">
                          {bloodSugarRecords[0].unit === 'mg/dL' 
                            ? Math.round(Math.max(...bloodSugarRecords.map(r => r.value)))
                            : Math.max(...bloodSugarRecords.map(r => r.value)).toFixed(1)
                          } {bloodSugarRecords[0].unit}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                        <span className="text-pink-700 font-medium">ค่าต่ำสุด</span>
                        <span className="text-pink-900 font-bold">
                          {bloodSugarRecords[0].unit === 'mg/dL' 
                            ? Math.round(Math.min(...bloodSugarRecords.map(r => r.value)))
                            : Math.min(...bloodSugarRecords.map(r => r.value)).toFixed(1)
                          } {bloodSugarRecords[0].unit}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Latest Data */}
            <div className="grid lg:grid-cols-2 gap-8">
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
                        {bloodSugarRecords[0].value} {bloodSugarRecords[0].unit}
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
