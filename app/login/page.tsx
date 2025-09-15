'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Heart, Eye, EyeOff } from 'lucide-react'

const loginSchema = z.object({
  phone: z.string().min(10, 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 10 หลัก'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน')
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        toast.success('เข้าสู่ระบบสำเร็จ')
        router.push('/dashboard')
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาด')
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
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
            เข้าสู่ระบบ - โรงพยาบาลสงฆ์
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            สำหรับพระคุณเจ้า หรือ{' '}
            <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
              ลงทะเบียนใหม่
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                เบอร์โทรศัพท์
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
              <label htmlFor="password" className="form-label">
                รหัสผ่าน
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
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
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
