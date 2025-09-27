'use client'

import { useState, useEffect } from 'react'
import { Info, Database, Users, Activity, Mail, AlertTriangle } from 'lucide-react'

interface DatabaseStats {
  database: {
    totalSize: string
    systemTablesSize: string
    walSize: string
  }
  tables: Array<{
    table_name: string
    size: string
    row_count: number
  }>
  recordCounts: {
    users: number
    bloodPressureRecords: number
    bloodSugarRecords: number
    emailLogs: number
  }
  explanation: {
    whyLarge: string[]
    recommendations: string[]
  }
}

export default function DatabaseStatsPage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/database-stats')
      const data = await response.json()
      
      if (response.ok) {
        setStats(data)
      } else {
        setError(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Database className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p>กำลังโหลดข้อมูลฐานข้อมูล...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="border border-red-300 bg-red-50 text-red-700 p-4 rounded flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Database className="h-8 w-8" />
        <h1 className="text-3xl font-bold">สถิติฐานข้อมูล</h1>
      </div>

      {/* Database Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm font-medium mb-2">ขนาดฐานข้อมูลทั้งหมด</p>
          <div className="text-2xl font-bold text-red-600">{stats.database.totalSize}</div>
          <p className="text-xs text-gray-500">จาก 0.5GB ที่มี</p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm font-medium mb-2">System Tables</p>
          <div className="text-2xl font-bold">{stats.database.systemTablesSize}</div>
          <p className="text-xs text-gray-500">ตารางระบบ</p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm font-medium mb-2">WAL Files</p>
          <div className="text-2xl font-bold">{stats.database.walSize}</div>
          <p className="text-xs text-gray-500">Transaction logs</p>
        </div>
      </div>

      {/* Record Counts */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-5 w-5" />
          <span className="font-semibold">จำนวนข้อมูลจริง</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.recordCounts.users}</div>
            <p className="text-sm text-gray-500">ผู้ใช้</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.recordCounts.bloodPressureRecords}</div>
            <p className="text-sm text-gray-500">ความดันโลหิต</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.recordCounts.bloodSugarRecords}</div>
            <p className="text-sm text-gray-500">น้ำตาลในเลือด</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.recordCounts.emailLogs}</div>
            <p className="text-sm text-gray-500">Email Logs</p>
          </div>
        </div>
      </div>

      {/* Table Sizes */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="h-5 w-5" />
          <span className="font-semibold">ขนาดแต่ละตาราง</span>
        </div>
        <div className="space-y-2">
          {stats.tables.map((table, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span className="font-medium">{table.table_name}</span>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {table.row_count} records
                </span>
              </div>
              <span className="font-bold text-lg">{table.size}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Why Large */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Info className="h-5 w-5" />
          <span className="font-semibold">ทำไมใช้พื้นที่เยอะ?</span>
        </div>
        <div className="space-y-3">
          {stats.explanation.whyLarge.map((reason, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm">{reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-semibold">คำแนะนำ</span>
        </div>
        <div className="space-y-3">
          {stats.explanation.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <button 
          onClick={fetchStats}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          รีเฟรชข้อมูล
        </button>
      </div>
    </div>
  )
}
