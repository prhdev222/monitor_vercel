import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ระบบบันทึกข้อมูลสุขภาพดิจิตอล - อายุรกรรม โรงพยาบาลสงฆ์',
  description: 'บันทึกค่าความดันโลหิตและน้ำตาลในเลือดสำหรับพระคุณเจ้า',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
