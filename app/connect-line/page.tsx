'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Heart, User, Link } from 'lucide-react'
import LineLoginButton from '@/components/LineLoginButton'

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
}

export default function ConnectLinePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const router = useRouter()

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
          
          // ถ้าเชื่อม LINE แล้ว ให้ไป dashboard
          if (result.user.lineId) {
            toast.success('คุณได้เชื่อม LINE account แล้ว')
            router.push('/dashboard')
            return
          }
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

  const handleLineConnect = async (lineProfile: any) => {
    if (!user) return

    setIsConnecting(true)
    try {
      const response = await fetch('/api/auth/connect-line', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          lineId: lineProfile.userId,
          displayName: lineProfile.displayName,
          pictureUrl: lineProfile.pictureUrl,
          email: lineProfile.email
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('เชื่อม LINE account สำเร็จ!')
        router.push('/dashboard')
      } else {
        toast.error(result.error || 'เกิดข้อผิดพลาด')
      }
    } catch (error) {
      console.error('LINE connect error:', error)
      toast.error('เกิดข้อผิดพลาดในการเชื่อม LINE')
    } finally {
      setIsConnecting(false)
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
            เชื่อม LINE Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            เชื่อม LINE account เพื่อความสะดวกในการเข้าสู่ระบบครั้งต่อไป
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center space-x-3 mb-4">
            <User className="h-8 w-8 text-primary-600" />
            <div>
              <p className="font-medium text-gray-900">
                สวัสดี, พระคุณเจ้า {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-gray-500">
                {user?.hnNumber && `HN: ${user.hnNumber}`}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">
                ประโยชน์ของการเชื่อม LINE
              </h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• เข้าสู่ระบบได้ง่ายขึ้น</li>
                <li>• รับการแจ้งเตือนผ่าน LINE</li>
                <li>• ส่งข้อมูลให้คลินิกได้สะดวก</li>
              </ul>
            </div>

            <div className="text-center">
              <LineLoginButton 
                onLineLogin={handleLineConnect}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? 'กำลังเชื่อม...' : 'เชื่อม LINE Account'}
              </LineLoginButton>
            </div>

            <div className="text-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ข้ามไปยัง Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
