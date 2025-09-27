'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Heart, User, Check } from 'lucide-react'

const profileSchema = z.object({
  phone: z.string().min(10, 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 10 หลัก'),
  firstName: z.string().min(1, 'กรุณากรอกชื่อ'),
  lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
  hnNumber: z.string().min(1, 'กรุณากรอกเลขที่ HN'),
  temple: z.string().min(1, 'กรุณากรอกชื่อวัด'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional().or(z.literal('')),
  consent: z.boolean().refine(val => val === true, 'ต้องยินยอมการเก็บข้อมูลส่วนบุคคล')
})

type ProfileForm = z.infer<typeof profileSchema>

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

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema)
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
          setValue('phone', result.user.phone || '')
          setValue('firstName', result.user.firstName || '')
          setValue('lastName', result.user.lastName || '')
          setValue('hnNumber', result.user.hnNumber || '')
          setValue('temple', result.user.temple || '')
          setValue('email', result.user.email || '')
          setValue('consent', result.user.consent || false)
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

  const onSubmit = async (data: ProfileForm) => {
    setIsSaving(true)
    try {
      console.log('Submitting profile data:', data)
      
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
        router.push('/dashboard')
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Heart className="h-12 w-12 text-primary-600 mx-auto" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            กรอกข้อมูลเพิ่มเติม
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            กรุณากรอกข้อมูลให้ครบถ้วนเพื่อใช้งานระบบได้อย่างสมบูรณ์
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                เบอร์โทรศัพท์ *
              </label>
              <input
                {...register('phone')}
                type="tel"
                id="phone"
                className="input-field"
                placeholder="0812345678"
              />
              {errors.phone && (
                <p className="error-message">{errors.phone.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                ชื่อ *
              </label>
              <input
                {...register('firstName')}
                type="text"
                id="firstName"
                className="input-field"
                placeholder="ชื่อ"
              />
              {errors.firstName && (
                <p className="error-message">{errors.firstName.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                นามสกุล *
              </label>
              <input
                {...register('lastName')}
                type="text"
                id="lastName"
                className="input-field"
                placeholder="นามสกุล"
              />
              {errors.lastName && (
                <p className="error-message">{errors.lastName.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="hnNumber" className="form-label">
                เลขที่ HN *
              </label>
              <input
                {...register('hnNumber')}
                type="text"
                id="hnNumber"
                className="input-field"
                placeholder="เลขที่ HN"
              />
              {errors.hnNumber && (
                <p className="error-message">{errors.hnNumber.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="temple" className="form-label">
                ชื่อวัด *
              </label>
              <input
                {...register('temple')}
                type="text"
                id="temple"
                className="input-field"
                placeholder="ชื่อวัด"
              />
              {errors.temple && (
                <p className="error-message">{errors.temple.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                อีเมล
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="input-field"
                placeholder="อีเมล (ไม่บังคับ)"
              />
              {errors.email && (
                <p className="error-message">{errors.email.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="flex items-center space-x-2">
                <input
                  {...register('consent')}
                  type="checkbox"
                  className="form-checkbox"
                />
                <span className="text-sm text-gray-700">
                  ยินยอมการเก็บข้อมูลส่วนบุคคล *
                </span>
              </label>
              {errors.consent && (
                <p className="error-message">{errors.consent.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="text-sm text-orange-600 hover:text-orange-500 underline"
              >
                ข้ามไปยัง Dashboard
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
