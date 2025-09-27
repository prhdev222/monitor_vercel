'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { lineService } from '@/lib/line'

interface LineLoginButtonProps {
  className?: string
  children?: React.ReactNode
  onLineLogin?: (profile: any) => void
  disabled?: boolean
}

export default function LineLoginButton({ className = '', children, onLineLogin, disabled = false }: LineLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLiffReady, setIsLiffReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID
        if (!liffId) {
          console.warn('LIFF ID not found in environment variables - using fallback mode')
          setIsLiffReady(true) // Set ready even without LIFF
          return
        }

        await lineService.init(liffId)
        setIsLiffReady(true)

        // Check if already logged in
        if (lineService.isLoggedIn()) {
          console.log('User already logged in to LINE, auto-login')
          await handleLineLogin()
        } else {
          // Check URL parameters for LINE login callback
          const urlParams = new URLSearchParams(window.location.search)
          const code = urlParams.get('code')
          const state = urlParams.get('state')
          
          if (code && state) {
            console.log('LINE login callback detected, processing...')
            await handleLineLogin()
          }
        }
      } catch (error) {
        console.error('LIFF initialization failed:', error)
        console.log('Falling back to manual login mode')
        setIsLiffReady(true) // Set ready even if LIFF fails
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
      console.log('LINE login started')
      
      // Check if LIFF is available
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID
      if (!liffId) {
        console.log('LIFF not available, redirecting to fallback page')
        // Redirect to fallback page for LINE login
        router.push('/line-login-fallback')
        return
      }
      
      if (!lineService.isLoggedIn()) {
        console.log('User not logged in to LINE, redirecting to LINE login')
        await lineService.login()
        return
      }

      console.log('User is logged in to LINE, getting profile')
      const profile = await lineService.getProfile()
      const accessToken = await lineService.getAccessToken()
      console.log('LINE profile:', profile)
      console.log('LINE access token:', accessToken ? 'Available' : 'Not available')
      
      if (!profile) {
        throw new Error('ไม่สามารถดึงข้อมูลโปรไฟล์ LINE ได้')
      }

      // Add access token to profile
      const profileWithToken = {
        ...profile,
        accessToken: accessToken
      }

      if (onLineLogin) {
        onLineLogin(profileWithToken)
      } else {
        await processLineLogin(profileWithToken)
      }
    } catch (error) {
      console.error('LINE login error:', error)
      toast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE')
    } finally {
      setIsLoading(false)
    }
  }

  const processLineLogin = async (profile: any) => {
    try {
      // Send profile to backend
      console.log('Sending profile to backend:', {
        lineId: profile.userId, // This is LINE User ID
        displayName: profile.displayName,
        hasEmail: !!profile.email,
        hasAccessToken: !!profile.accessToken
      })
      console.log('Full profile data:', profile)
      
      const response = await fetch('/api/auth/line', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Ensure cookies are sent and received
        body: JSON.stringify({
          lineId: profile.userId, // This is actually LINE User ID
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          email: profile.email,
          accessToken: profile.accessToken
        })
      })

      console.log('Backend response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('HTTP error:', response.status, response.statusText, errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('Backend response:', result)
      console.log('Response success:', result.success)
      console.log('Redirect to:', result.redirectTo)

      if (result.success) {
        const redirectTo = result.redirectTo || '/dashboard'
        const isProfileComplete = result.isProfileComplete
        
        console.log('Login successful, redirecting to:', redirectTo)
        console.log('Profile complete:', isProfileComplete)
        
        if (isProfileComplete) {
          toast.success('เข้าสู่ระบบด้วย LINE สำเร็จ')
        } else {
          toast.success('เข้าสู่ระบบด้วย LINE สำเร็จ กรุณากรอกข้อมูลเพิ่มเติม')
        }
        
        // Show additional message for LINE Browser users
        const isLineBrowserForToast = /Line/i.test(navigator.userAgent) || 
                                     /LineBrowser/i.test(navigator.userAgent) ||
                                     /LINE/i.test(navigator.userAgent)
        
        if (isLineBrowserForToast) {
          const message = isProfileComplete 
            ? 'กำลังพาไปยังหน้า Dashboard... หากไม่ไปอัตโนมัติ กรุณากดปุ่มด้านล่าง'
            : 'กำลังพาไปยังหน้า Profile... หากไม่ไปอัตโนมัติ กรุณากดปุ่มด้านล่าง'
          toast(message, {
            duration: 5000,
            position: 'top-center'
          })
        }
        
        // Store user data in localStorage as backup
        console.log('Storing user data in localStorage:', result.user)
        localStorage.setItem('user', JSON.stringify(result.user))
        localStorage.setItem('line-login-success', 'true')
        
        // Verify storage
        const storedUser = localStorage.getItem('user')
        const storedFlag = localStorage.getItem('line-login-success')
        console.log('Verification - stored user:', !!storedUser, 'stored flag:', storedFlag)
        
        // For LINE Browser, use window.location.href instead of router.push
        const isLineBrowserForRedirect = /Line/i.test(navigator.userAgent) || 
                                        /LineBrowser/i.test(navigator.userAgent) ||
                                        /LINE/i.test(navigator.userAgent)
        
        if (isLineBrowserForRedirect) {
          console.log('LINE Browser detected, using immediate redirect')
          console.log('Redirecting to:', redirectTo)
          
          // For LINE Browser, try immediate redirect without setTimeout
          console.log('Attempting immediate redirect: window.location.href')
          try {
            // Add a small delay to ensure cookie is set
            setTimeout(() => {
              console.log('Executing redirect to:', redirectTo)
              window.location.href = redirectTo
            }, 100)
          } catch (error) {
            console.error('Immediate redirect failed:', error)
            
            // Fallback: try router.push
            console.log('Fallback: using router.push')
            router.push(redirectTo)
          }
        } else {
          console.log('Regular browser, using router.push')
          console.log('Redirecting to:', redirectTo)
          setTimeout(() => {
            console.log('Executing redirect to', redirectTo, 'with router.push')
            router.push(redirectTo)
          }, 500)
        }
      } else {
        console.error('Login failed:', result.error)
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
      }
    } catch (error) {
      console.error('LINE login processing error:', error)
      throw error
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleLineLogin}
        disabled={isLoading || !isLiffReady || disabled}
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
      
      {/* Manual redirect button for LINE Browser users */}
      {typeof window !== 'undefined' && localStorage.getItem('line-login-success') === 'true' && (
        <button
          onClick={() => {
            const userData = localStorage.getItem('user')
            if (userData) {
              try {
                const user = JSON.parse(userData)
                const isProfileComplete = user.phone && user.firstName && user.lastName && 
                                         user.hnNumber && user.temple && user.consent
                const redirectTo = isProfileComplete ? '/dashboard' : '/profile'
                console.log('Manual redirect to:', redirectTo)
                window.location.href = redirectTo
              } catch (error) {
                console.error('Error parsing user data:', error)
                window.location.href = '/dashboard'
              }
            } else {
              window.location.href = '/dashboard'
            }
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          ไปยังหน้าถัดไป
        </button>
      )}
    </div>
  )
}