# 🚀 คู่มือการ Deploy บน Vercel และแก้ไข LINE Login

## 🔧 ปัญหาที่แก้ไขแล้ว

### 1. TypeScript Error ใน lib/auth.ts
- ✅ แก้ไข `lineId` เป็น `lineUserId` ในฟังก์ชัน `createUserWithLine`
- ✅ แก้ไข duplicate import ใน `connect-line/route.ts`

## 📋 Environment Variables ที่ต้องตั้งค่าใน Vercel

### 1. ไปที่ Vercel Dashboard
1. เปิด [Vercel Dashboard](https://vercel.com/dashboard)
2. เลือกโปรเจค `patient-monitoring-app`
3. ไปที่ **Settings** > **Environment Variables**

### 2. เพิ่ม Environment Variables ต่อไปนี้:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# JWT Secret (สร้าง random string ยาวๆ)
JWT_SECRET=your-super-secret-jwt-key-here

# LINE Login Configuration
NEXT_PUBLIC_LINE_CHANNEL_ID=your-line-channel-id
LINE_CHANNEL_SECRET=your-line-channel-secret
NEXT_PUBLIC_LINE_REDIRECT_URI=https://your-domain.vercel.app/api/auth/line/callback

# Environment
NODE_ENV=production
```

## 🔑 การตั้งค่า LINE Login

### 1. สร้าง LINE Login Channel
1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. สร้าง Channel ใหม่ หรือใช้ Channel ที่มีอยู่
3. ไปที่ **LINE Login** tab

### 2. ตั้งค่า Callback URL
```
Callback URL: https://your-domain.vercel.app/api/auth/line/callback
```

### 3. ตั้งค่า OpenID Connect
```
OpenID Connect: Enable
```

### 4. ตั้งค่า Scopes
```
profile
openid
```

## 🚨 แก้ไขปัญหา 404 Not Found

### ปัญหา: `public_line_redirect_URI 404 not found`

**สาเหตุ:** 
- Environment Variable `NEXT_PUBLIC_LINE_REDIRECT_URI` ไม่ถูกตั้งค่า
- URL ไม่ตรงกับ Callback URL ที่ตั้งค่าใน LINE Developers Console

**วิธีแก้ไข:**

1. **ตรวจสอบ Environment Variables ใน Vercel:**
   ```bash
   NEXT_PUBLIC_LINE_REDIRECT_URI=https://your-actual-domain.vercel.app/api/auth/line/callback
   ```

2. **ตรวจสอบ Callback URL ใน LINE Developers Console:**
   - ต้องตรงกับ `NEXT_PUBLIC_LINE_REDIRECT_URI` ทุกตัวอักษร
   - ต้องใช้ HTTPS
   - ต้องไม่มี trailing slash

3. **ตรวจสอบ Route Handler:**
   - ไฟล์ `app/api/auth/line/callback/route.ts` ต้องมีอยู่
   - ต้อง export function `GET`

## 🔍 การตรวจสอบปัญหา

### 1. ตรวจสอบ Environment Variables
```bash
# ใช้ Vercel CLI
vercel env ls
```

### 2. ตรวจสอบ Build Logs
- ดู Vercel Build Logs ว่ามี error อะไร
- ตรวจสอบ TypeScript compilation

### 3. ตรวจสอบ Runtime Logs
- ดู Vercel Function Logs
- ตรวจสอบ console.log ใน API routes

## 📱 การทดสอบ LINE Login

### 1. ทดสอบใน Browser ปกติ
1. เปิด `https://your-domain.vercel.app/login`
2. กดปุ่ม "เข้าสู่ระบบด้วย LINE"
3. ควร redirect ไป LINE login page

### 2. ทดสอบใน LINE Browser
1. เปิด LINE App
2. ไปที่ Chat หรือ Timeline
3. กดลิงก์เว็บไซต์
4. ทดสอบ LINE Login

## 🛠️ การแก้ไขปัญหาเพิ่มเติม

### 1. Database Connection Issues
```bash
# ตรวจสอบ DATABASE_URL
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

### 2. CORS Issues
- ตรวจสอบ Domain settings ใน LINE Developers Console
- เพิ่ม domain ใน Allowed Domains

### 3. Cookie Issues
- ตรวจสอบ SameSite settings
- ตรวจสอบ Secure flag ใน production

## ✅ Checklist การ Deploy

- [ ] แก้ไข TypeScript errors
- [ ] ตั้งค่า Environment Variables ใน Vercel
- [ ] ตั้งค่า LINE Login Channel
- [ ] ตั้งค่า Callback URL
- [ ] Deploy โปรเจค
- [ ] ทดสอบ LINE Login
- [ ] ตรวจสอบ Database connection
- [ ] ตรวจสอบ Cookie settings

## 🎯 ผลลัพธ์ที่คาดหวัง

หลังจากแก้ไขแล้ว:
1. ✅ Build สำเร็จบน Vercel
2. ✅ LINE Login redirect ทำงานได้
3. ✅ สามารถเข้าสู่ระบบได้
4. ✅ สร้าง user ใน database ได้
5. ✅ Redirect ไป dashboard หรือ profile ได้

## 📞 การขอความช่วยเหลือ

หากยังมีปัญหา:
1. ตรวจสอบ Vercel Build Logs
2. ตรวจสอบ Vercel Function Logs
3. ตรวจสอบ LINE Developers Console
4. ตรวจสอบ Environment Variables
5. ทดสอบใน Browser ปกติก่อน แล้วค่อยทดสอบใน LINE Browser
