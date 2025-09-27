import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('Auth me API called')
    console.log('Request URL:', request.url)
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    
    const token = request.cookies.get('auth-token')?.value
    console.log('Token found:', !!token)
    console.log('Token length:', token?.length || 0)
    console.log('All cookies:', request.cookies.getAll().map(c => `${c.name}=${c.value.substring(0, 20)}...`))

    if (!token) {
      console.log('No token found in cookies')
      console.log('Available cookies:', request.cookies.getAll().map(c => `${c.name}=${c.value.substring(0, 20)}...`))
      return NextResponse.json(
        { error: 'ไม่พบ token' },
        { status: 401 }
      )
    }

    const user = verifyToken(token)
    console.log('User verified:', !!user, user ? user.phone : 'N/A')
    
    if (!user) {
      console.log('Token verification failed')
      return NextResponse.json(
        { error: 'Token ไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    console.log('Returning user data:', user)
    return NextResponse.json({
      success: true,
      user
    })

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' },
      { status: 500 }
    )
  }
}
