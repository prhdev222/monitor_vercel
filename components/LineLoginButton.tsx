'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { lineService } from '@/lib/line'

interface LineLoginButtonProps {
  className?: string
  children?: React.ReactNode
}

export default function LineLoginButton({ className = '', children }: LineLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLiffReady, setIsLiffReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID
        if (!liffId) {
          console.error('LIFF ID not found in environment variables')
          return
        }

        await lineService.init(liffId)
        setIsLiffReady(true)

        // Check if already logged in
        if (lineService.isLoggedIn()) {
          await handleLineLogin()
        }
      } catch (error) {
        console.error('LIFF initialization failed:', error)
        toast.error('ไม่สามารถเชื่อมต่อกับ LINE ได้')
      }
    }

    initLiff()
  }, [])

  const handleLineLogin = async () => {
    if (!isLiffReady) {
      toast.error('กรุณารอสักครู่...')
      return
    }

    setIsLoading(true)
    try {
      if (!lineService.isLoggedIn()) {
        await lineService.login()
        return
      }

      const profile = await lineService.getProfile()
      if (!profile) {
        throw new Error('ไม่สามารถดึงข้อมูลโปรไฟล์ LINE ได้')
      }

      // Send profile to backend
      const response = await fetch('/api/auth/line', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lineId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          email: profile.email
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('เข้าสู่ระบบด้วย LINE สำเร็จ')
        // Add a small delay to ensure cookie is set before redirect
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 500)
      } else {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
      }
    } catch (error) {
      console.error('LINE login error:', error)
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleLineLogin}
      disabled={isLoading || !isLiffReady}
      className={`
        flex items-center justify-center gap-3 w-full py-3 px-4 
        bg-[#00B900] hover:bg-[#009900] text-white font-medium rounded-lg
        transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
        </svg>
      )}
      {children || (isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย LINE')}
    </button>
  )
}