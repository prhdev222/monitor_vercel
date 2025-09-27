'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Heart, User, AlertCircle } from 'lucide-react'

export default function LineLoginFallbackPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleMockLineLogin = async () => {
    setIsLoading(true)
    try {
      // Create mock LINE profile
      const mockProfile = {
        userId: 'line_user_' + Date.now(),
        displayName: 'LINE User',
        pictureUrl: '',
        email: ''
      }

      // Send to LINE login API
      const response = await fetch('/api/auth/line', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          lineId: mockProfile.userId,
          displayName: mockProfile.displayName,
          pictureUrl: mockProfile.pictureUrl,
          email: mockProfile.email
        })
      })

      const result = await response.json()

      if (result.success) {
        const redirectTo = result.redirectTo || '/dashboard'
        const isProfileComplete = result.isProfileComplete
        
        if (isProfileComplete) {
          toast.success('เข้าสู่ระบบด้วย LINE สำเร็จ')
        } else {
          toast.success('เข้าสู่ระบบด้วย LINE สำเร็จ กรุณากรอกข้อมูลเพิ่มเติม')
        }
        
        // Store user data in localStorage as backup
        localStorage.setItem('user', JSON.stringify(result.user))
        localStorage.setItem('line-login-success', 'true')
        
        // Redirect
        setTimeout(() => {
          window.location.href = redirectTo
        }, 500)
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาด')
      }
    } catch (error) {
      console.error('Mock LINE login error:', error)
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
            เข้าสู่ระบบด้วย LINE
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            ระบบกำลังอยู่ในโหมดทดสอบ
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-start space-x-3 mb-4">
            <AlertCircle className="h-6 w-6 text-yellow-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900">
                หมายเหตุ
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                ระบบกำลังอยู่ในโหมดทดสอบ LINE Login กรุณาใช้ปุ่มด้านล่างเพื่อเข้าสู่ระบบ
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleMockLineLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 
                bg-[#00B900] hover:bg-[#009900] text-white font-medium rounded-lg
                transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
              )}
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย LINE (ทดสอบ)'}
            </button>

            <div className="text-center">
              <button
                onClick={() => router.push('/login')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                กลับไปหน้า Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
