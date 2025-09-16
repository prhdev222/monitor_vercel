'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, Activity, Users, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">ระบบบันทึกข้อมูลสุขภาพดิจิตอล - อายุรกรรม โรงพยาบาลสงฆ์</h1>
            </div>
            <div className="flex space-x-4">
              <Link href="/login" className="btn-secondary">
                เข้าสู่ระบบ
              </Link>
              <Link href="/register" className="btn-primary">
                ลงทะเบียน
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            บันทึกข้อมูลสุขภาพของพระคุณเจ้าอย่างง่ายดาย
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            ระบบบันทึกค่าความดันโลหิตและน้ำตาลในเลือดสำหรับพระคุณเจ้า 
            เพื่อให้แพทย์สามารถติดตามและให้คำแนะนำได้อย่างมีประสิทธิภาพ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary text-lg px-8 py-3">
              เริ่มต้นใช้งาน
            </Link>
            <Link href="/login" className="btn-secondary text-lg px-8 py-3">
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            คุณสมบัติหลัก
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card text-center">
              <Activity className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">บันทึกข้อมูล</h4>
              <p className="text-gray-600">
                บันทึกค่าความดันโลหิตและน้ำตาลในเลือดได้ทุกวัน
              </p>
            </div>
            
            <div className="card text-center">
              <Users className="h-12 w-12 text-secondary-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">แชร์กับคลินิกอายุรกรรม</h4>
              <p className="text-gray-600">
                ส่งข้อมูลให้คลินิกเพื่อติดตามและให้คำแนะนำนัดพบแพทย์ต่อไป
              </p>
            </div>
            
            <div className="card text-center">
              <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">กราฟแสดงผล</h4>
              <p className="text-gray-600">
                ดูประวัติและแนวโน้มของข้อมูลในรูปแบบกราฟ
              </p>
            </div>
            
            <div className="card text-center">
              <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">ความปลอดภัย</h4>
              <p className="text-gray-600">
                ข้อมูลถูกเข้ารหัสและจัดการตาม PDPA
              </p>
            </div>
          </div>
        </div>

        {/* PDPA Notice */}
        <div className="mt-20 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-yellow-800 mb-2">
            ข้อกำหนดด้านความเป็นส่วนตัว
          </h4>
          <p className="text-yellow-700">
            ระบบจะเก็บข้อมูลของคุณเป็นระยะเวลา 3 เดือนเท่านั้น 
            และจะลบข้อมูลอัตโนมัติ
          </p>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 ระบบบันทึกข้อมูลสุขภาพ. สงวนลิขสิทธิ์.</p>
        </div>
      </footer>
    </div>
  )
}
