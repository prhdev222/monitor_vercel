# 🔧 การแก้ไขปัญหา LINE Login ใน Production

## 🚨 ปัญหาที่พบ
LINE Login ไม่ทำงานใน production เพราะ:
1. **NEXT_PUBLIC_LIFF_ID** ไม่ได้ถูกตั้งค่าใน Vercel Environment Variables
2. ระบบใช้ fallback mode แทนการ login จริง
3. ต้องใช้การ login แบบธรรมดาเท่านั้น

## ✅ วิธีแก้ไข

### 1. ตั้งค่า LINE LIFF App

#### ขั้นตอนที่ 1: สร้าง LIFF App
1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. เลือก Channel ที่มีอยู่ หรือสร้างใหม่
3. ไปที่ **LIFF** tab
4. คลิก **Add** เพื่อสร้าง LIFF App ใหม่

#### ขั้นตอนที่ 2: ตั้งค่า LIFF App
```
LIFF app name: Patient Monitoring App
Size: Full
Endpoint URL: https://patient-monitoring-app.vercel.app/
Scope: profile, openid
Bot link feature: On
```

#### ขั้นตอนที่ 3: คัดลอก LIFF ID
- คัดลอก LIFF ID ที่ได้ (รูปแบบ: `1234567890-abcdefgh`)

### 2. ตั้งค่า Environment Variables ใน Vercel

#### วิธีที่ 1: ใช้ Vercel Dashboard
1. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. เลือกโปรเจค `patient-monitoring-app`
3. ไปที่ **Settings** > **Environment Variables**
4. เพิ่มตัวแปร:
   ```
   Name: NEXT_PUBLIC_LIFF_ID
   Value: [LIFF_ID ที่คัดลอกมา]
   Environment: Production, Preview, Development
   ```
5. คลิก **Save**

#### วิธีที่ 2: ใช้ Vercel CLI
```bash
# ติดตั้ง Vercel CLI (ถ้ายังไม่มี)
npm i -g vercel

# Login เข้า Vercel
vercel login

# ตั้งค่า Environment Variable
vercel env add NEXT_PUBLIC_LIFF_ID

# เมื่อถามให้ใส่ค่า ให้ใส่ LIFF ID ที่คัดลอกมา
# เลือก Environment: Production, Preview, Development
```

### 3. Redeploy โปรเจค

#### วิธีที่ 1: Auto Redeploy
- Vercel จะ auto-redeploy เมื่อมีการเปลี่ยนแปลง Environment Variables

#### วิธีที่ 2: Manual Redeploy
1. ไปที่ Vercel Dashboard
2. เลือกโปรเจค
3. ไปที่ **Deployments** tab
4. คลิก **Redeploy** บน deployment ล่าสุด

### 4. ทดสอบ LINE Login

#### ขั้นตอนการทดสอบ:
1. เปิดเว็บไซต์ใน LINE Browser
2. กดปุ่ม "เข้าสู่ระบบด้วย LINE"
3. ตรวจสอบว่า redirect ไป LINE login page
4. หลังจาก login สำเร็จ ควร redirect กลับมาที่เว็บไซต์
5. ตรวจสอบว่าเข้าสู่ระบบได้

## 🔍 การตรวจสอบปัญหา

### 1. ตรวจสอบ Environment Variables
```bash
# ใช้ Vercel CLI
vercel env ls
```

### 2. ตรวจสอบ Console Logs
เปิด Developer Console ใน LINE Browser และดู logs:
- `LIFF ID not found` = Environment Variable ไม่ถูกตั้งค่า
- `LIFF initialization failed` = LIFF ID ไม่ถูกต้อง
- `User not logged in to LINE` = ยังไม่ได้ login ใน LINE

### 3. ตรวจสอบ Network Requests
ดู Network tab ใน Developer Console:
- ตรวจสอบ request ไปยัง `/api/auth/line`
- ตรวจสอบ response status และ data

## 🚨 ปัญหาที่อาจเกิดขึ้น

### 1. LIFF ID ไม่ถูกต้อง
**อาการ:** `LIFF initialization failed`
**แก้ไข:** ตรวจสอบ LIFF ID และ Endpoint URL

### 2. Endpoint URL ไม่ตรงกัน
**อาการ:** LINE login redirect ไม่ทำงาน
**แก้ไข:** ตรวจสอบ Endpoint URL ใน LIFF App ต้องตรงกับ domain ของเว็บไซต์

### 3. Scope ไม่ครบ
**อาการ:** ไม่สามารถดึงข้อมูล profile ได้
**แก้ไข:** ตรวจสอบ Scope ใน LIFF App ต้องมี `profile` และ `openid`

### 4. CORS Issues
**อาการ:** Request ถูก block
**แก้ไข:** ตรวจสอบ Domain settings ใน LINE Developers Console

## 📱 การทดสอบใน LINE Browser

### 1. เปิดใน LINE App
- เปิด LINE App
- ไปที่ Chat หรือ Timeline
- กดลิงก์เว็บไซต์

### 2. เปิดใน LINE Browser
- เปิด LINE Browser
- ไปที่เว็บไซต์โดยตรง

### 3. ตรวจสอบ User Agent
```javascript
console.log(navigator.userAgent)
// ควรมี "Line" หรือ "LineBrowser" ใน user agent
```

## ✅ Checklist การแก้ไข

- [ ] สร้าง LIFF App ใน LINE Developers Console
- [ ] ตั้งค่า Endpoint URL ให้ถูกต้อง
- [ ] ตั้งค่า Scope ให้ครบถ้วน
- [ ] คัดลอก LIFF ID
- [ ] เพิ่ม NEXT_PUBLIC_LIFF_ID ใน Vercel Environment Variables
- [ ] Redeploy โปรเจค
- [ ] ทดสอบ LINE Login ใน LINE Browser
- [ ] ตรวจสอบ Console Logs
- [ ] ตรวจสอบ Network Requests

## 🎯 ผลลัพธ์ที่คาดหวัง

หลังจากแก้ไขแล้ว:
1. ✅ LINE Login ทำงานได้ใน LINE Browser
2. ✅ สามารถดึงข้อมูล profile จาก LINE ได้
3. ✅ สร้าง user ใน database ได้
4. ✅ Redirect ไปหน้า Profile หรือ Dashboard ได้
5. ✅ Cookie ถูกตั้งค่าถูกต้อง

## 📞 การขอความช่วยเหลือ

หากยังมีปัญหา:
1. ตรวจสอบ Console Logs ใน LINE Browser
2. ตรวจสอบ Vercel Function Logs
3. ตรวจสอบ LINE Developers Console
4. ตรวจสอบ Environment Variables ใน Vercel
