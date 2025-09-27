'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { User, Lock, ArrowLeft } from 'lucide-react'

const editProfileSchema = z.object({
  phone: z.string().min(10, 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 10 หลัก'),
  firstName: z.string().min(1, 'กรุณากรอกชื่อ'),
  lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
  hnNumber: z.string().min(1, 'กรุณากรอกเลขที่ HN'),
  temple: z.string().min(1, 'กรุณากรอกชื่อวัด'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional().or(z.literal(''))
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน'),
  newPassword: z.string().min(6, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'),
  confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่านใหม่')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "รหัสผ่านใหม่ไม่ตรงกัน",
  path: ["confirmPassword"],
})

type EditProfileForm = z.infer<typeof editProfileSchema>
type ChangePasswordForm = z.infer<typeof changePasswordSchema>

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

export default function EditProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')
  const router = useRouter()

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    setValue: setValueProfile,
    formState: { errors: profileErrors }
  } = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema)
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors }
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema)
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setUser(result.user)
          // Pre-fill form with existing data
          setValueProfile('phone', result.user.phone || '')
          setValueProfile('firstName', result.user.firstName || '')
          setValueProfile('lastName', result.user.lastName || '')
          setValueProfile('hnNumber', result.user.hnNumber || '')
          setValueProfile('temple', result.user.temple || '')
          setValueProfile('email', result.user.email || '')
        } else {
          router.push('/login')
        }
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitProfile = async (data: EditProfileForm) => {
    setIsSaving(true)
    try {
      console.log('Updating profile data:', data)
      
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      })

      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Response result:', result)

      if (response.ok && result.success) {
        toast.success('บันทึกข้อมูลสำเร็จ')
        setUser(result.user)
      } else {
        const errorMessage = result.error || `เกิดข้อผิดพลาด (${response.status})`
        toast.error(errorMessage)
        console.error('Profile update failed:', result)
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setIsSaving(false)
    }
  }

  const onSubmitPassword = async (data: ChangePasswordForm) => {
    setIsChangingPassword(true)
    try {
      console.log('Changing password')
      
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        })
      })

      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Response result:', result)

      if (response.ok && result.success) {
        toast.success('เปลี่ยนรหัสผ่านสำเร็จ')
        resetPassword()
      } else {
        const errorMessage = result.error || `เกิดข้อผิดพลาด (${response.status})`
        toast.error(errorMessage)
        console.error('Password change failed:', result)
      }
    } catch (error) {
      console.error('Password change error:', error)
      toast.error('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน')
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center text-primary-600 hover:text-primary-500 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับไปยัง Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            แก้ไขประวัติส่วนตัว
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            จัดการข้อมูลส่วนตัวและรหัสผ่านของคุณ
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="h-4 w-4 inline mr-2" />
                ข้อมูลส่วนตัว
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'password'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Lock className="h-4 w-4 inline mr-2" />
                เปลี่ยนรหัสผ่าน
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">
                      เบอร์โทรศัพท์ *
                    </label>
                    <input
                      {...registerProfile('phone')}
                      type="tel"
                      id="phone"
                      className="input-field"
                      placeholder="0812345678"
                    />
                    {profileErrors.phone && (
                      <p className="error-message">{profileErrors.phone.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      อีเมล
                    </label>
                    <input
                      {...registerProfile('email')}
                      type="email"
                      id="email"
                      className="input-field"
                      placeholder="อีเมล (ไม่บังคับ)"
                    />
                    {profileErrors.email && (
                      <p className="error-message">{profileErrors.email.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="firstName" className="form-label">
                      ชื่อ *
                    </label>
                    <input
                      {...registerProfile('firstName')}
                      type="text"
                      id="firstName"
                      className="input-field"
                      placeholder="ชื่อ"
                    />
                    {profileErrors.firstName && (
                      <p className="error-message">{profileErrors.firstName.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName" className="form-label">
                      นามสกุล *
                    </label>
                    <input
                      {...registerProfile('lastName')}
                      type="text"
                      id="lastName"
                      className="input-field"
                      placeholder="นามสกุล"
                    />
                    {profileErrors.lastName && (
                      <p className="error-message">{profileErrors.lastName.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="hnNumber" className="form-label">
                      เลขที่ HN *
                    </label>
                    <input
                      {...registerProfile('hnNumber')}
                      type="text"
                      id="hnNumber"
                      className="input-field"
                      placeholder="เลขที่ HN"
                    />
                    {profileErrors.hnNumber && (
                      <p className="error-message">{profileErrors.hnNumber.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="temple" className="form-label">
                      ชื่อวัด *
                    </label>
                    <input
                      {...registerProfile('temple')}
                      type="text"
                      id="temple"
                      className="input-field"
                      placeholder="ชื่อวัด"
                    />
                    {profileErrors.temple && (
                      <p className="error-message">{profileErrors.temple.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                  </button>
                </div>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
                <div className="space-y-4">
                  <div className="form-group">
                    <label htmlFor="currentPassword" className="form-label">
                      รหัสผ่านปัจจุบัน *
                    </label>
                    <input
                      {...registerPassword('currentPassword')}
                      type="password"
                      id="currentPassword"
                      className="input-field"
                      placeholder="รหัสผ่านปัจจุบัน"
                    />
                    {passwordErrors.currentPassword && (
                      <p className="error-message">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword" className="form-label">
                      รหัสผ่านใหม่ *
                    </label>
                    <input
                      {...registerPassword('newPassword')}
                      type="password"
                      id="newPassword"
                      className="input-field"
                      placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                    />
                    {passwordErrors.newPassword && (
                      <p className="error-message">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">
                      ยืนยันรหัสผ่านใหม่ *
                    </label>
                    <input
                      {...registerPassword('confirmPassword')}
                      type="password"
                      id="confirmPassword"
                      className="input-field"
                      placeholder="ยืนยันรหัสผ่านใหม่"
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="error-message">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingPassword ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
