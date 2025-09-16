// Thai font utility for jsPDF
export const thaiFont = {
  // ฟังก์ชันสำหรับโหลด font ไทย THSarabunNew
  loadThaiFont: async (doc: any) => {
    try {
      // โหลด font file จาก public/fonts/
      const fontResponse = await fetch('/fonts/THSarabunNew.ttf')
      const fontArrayBuffer = await fontResponse.arrayBuffer()
      
      // แปลง ArrayBuffer เป็น base64 string
      const fontBytes = new Uint8Array(fontArrayBuffer)
      let fontBase64 = ''
      for (let i = 0; i < fontBytes.length; i++) {
        fontBase64 += String.fromCharCode(fontBytes[i])
      }
      fontBase64 = btoa(fontBase64)
      
      // เพิ่ม font เข้าไปใน jsPDF
      doc.addFileToVFS('THSarabunNew.ttf', fontBase64)
      doc.addFont('THSarabunNew.ttf', 'THSarabunNew', 'normal')
      
      return doc
    } catch (error) {
      console.error('Error loading Thai font:', error)
      // fallback ไปยัง times font
      doc.setFont('times')
      return doc
    }
  },

  // ฟังก์ชันสำหรับเพิ่ม font ไทยลงใน jsPDF
  addThaiFont: (doc: any) => {
    // ใช้ font ที่รองรับภาษาไทย
    // jsPDF มี font ไทยในตัวอยู่แล้ว เช่น 'helvetica' แต่ไม่แสดงผลไทยได้ดี
    // ควรใช้ 'times' หรือ 'courier' ที่รองรับภาษาไทยได้ดีกว่า
    doc.setFont('times')
    return doc
  },

  // ฟังก์ชันสำหรับตั้งค่า font และขนาด
  setThaiFont: (doc: any, size: number = 12) => {
    // พยายามใช้ THSarabunNew ก่อน หากไม่มีใช้ times
    try {
      doc.setFont('THSarabunNew')
    } catch {
      doc.setFont('times')
    }
    doc.setFontSize(size)
    return doc
  },

  // ฟังก์ชันสำหรับเขียนข้อความไทย
  addThaiText: (doc: any, text: string, x: number, y: number, options?: any) => {
    // พยายามใช้ THSarabunNew ก่อน หากไม่มีใช้ times
    try {
      doc.setFont('THSarabunNew')
    } catch {
      doc.setFont('times')
    }
    doc.text(text, x, y, options)
    return doc
  },

  // ฟังก์ชันสำหรับสร้างตารางที่มีข้อความไทย
  addThaiTable: (doc: any, data: any[][], startY: number = 20) => {
    // พยายามใช้ THSarabunNew ก่อน หากไม่มีใช้ times
    try {
      doc.setFont('THSarabunNew')
    } catch {
      doc.setFont('times')
    }
    
    // ตั้งค่าขนาด font สำหรับตาราง
    const fontSize = 10
    doc.setFontSize(fontSize)
    
    // คำนวณความกว้างของคอลัมน์
    const pageWidth = doc.internal.pageSize.width
    const margin = 20
    const tableWidth = pageWidth - (margin * 2)
    const colWidth = tableWidth / data[0].length
    
    // วาดตาราง
    data.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const x = margin + (colIndex * colWidth)
        const y = startY + (rowIndex * 8) + 10
        
        // วาดกรอบ
        doc.rect(x, y - 6, colWidth, 8)
        
        // เขียนข้อความ
        doc.text(String(cell), x + 2, y - 1)
      })
    })
    
    return doc
  }
}
