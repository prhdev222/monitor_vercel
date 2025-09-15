'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Heart, Eye, EyeOff, Check } from 'lucide-react'

const registerSchema = z.object({
  phone: z.string().min(10, 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 10 หลัก'),
  password: z.string().min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'กรุณากรอกชื่อ'),
  lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
  hnNumber: z.string().min(1, 'กรุณากรอกเลขที่ HN'),
  temple: z.string().min(1, 'กรุณากรอกชื่อวัด'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional().or(z.literal('')),
  consent: z.boolean().refine(val => val === true, 'ต้องยินยอมการเก็บข้อมูลส่วนบุคคล')
}).refine((data) => data.password === data.confirmPassword, {
  message: "รหัสผ่านไม่ตรงกัน",
  path: ["confirmPassword"],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  })

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      const { confirmPassword, ...submitData } = data
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('ลงทะเบียนสำเร็จ กรุณาเข้าสู่ระบบ')
        router.push('/login')
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาด')
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการลงทะเบียน')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Heart className="h-12 w-12 text-primary-600 mx-auto" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            ลงทะเบียน - โรงพยาบาลสงฆ์
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            สำหรับพระคุณเจ้า หรือ{' '}
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              เข้าสู่ระบบ
            </Link>
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

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="form-group">
              <label htmlFor="hnNumber" className="form-label">
                เลขที่ HN (Hospital Number) *
              </label>
              <input
                {...register('hnNumber')}
                type="text"
                id="hnNumber"
                className="input-field"
                placeholder="HN123456"
              />
              {errors.hnNumber && (
                <p className="error-message">{errors.hnNumber.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="temple" className="form-label">
                วัด *
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
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="error-message">{errors.email.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                รหัสผ่าน *
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="input-field pr-10"
                  placeholder="รหัสผ่าน"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="error-message">{errors.password.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                ยืนยันรหัสผ่าน *
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  className="input-field pr-10"
                  placeholder="ยืนยันรหัสผ่าน"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="error-message">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="form-group">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    {...register('consent')}
                    type="checkbox"
                    id="consent"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="consent" className="text-gray-700">
                    ฉันยินยอมให้เก็บข้อมูลส่วนบุคคลตาม{' '}
                    <span className="text-primary-600 font-medium">นโยบายความเป็นส่วนตัว (PDPA)</span>
                    {' '}และเข้าใจว่าระบบจะเก็บข้อมูลเป็นระยะเวลา 3 เดือนเท่านั้น
                  </label>
                  {errors.consent && (
                    <p className="error-message mt-1">{errors.consent.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/" className="text-sm text-primary-600 hover:text-primary-500">
              ← กลับหน้าหลัก
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
