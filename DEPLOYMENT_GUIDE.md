# 🚀 คู่มือการ Deploy Patient Monitoring App ไปยัง Vercel

## 📋 ขั้นตอนการ Deploy

### 1. เตรียม GitHub Repository

```bash
# ตรวจสอบว่าโค้ดอยู่ใน GitHub แล้ว
git status
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. สร้าง Environment Variables

สร้างไฟล์ `.env.local` ในโปรเจค (สำหรับ local development):

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database"

# JWT Secret (สร้าง key ยาวๆ สำหรับ production)
JWT_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random"

# Email Configuration (สำหรับส่งรายงาน)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="your-email@gmail.com"

# LINE LIFF Configuration (สำหรับ LINE Login)
NEXT_PUBLIC_LIFF_ID="your-liff-id"

# Environment
NODE_ENV="production"
```

### 3. ตั้งค่า Database

#### ตัวเลือก A: ใช้ Vercel Postgres (แนะนำ)
1. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. เลือกโปรเจค
3. ไปที่ **Settings** > **Storage**
4. คลิก **Create Database** > **Postgres**
5. ตั้งชื่อ database
6. คัดลอก **Connection String** มาใส่ใน `DATABASE_URL`

#### ตัวเลือก B: ใช้ Supabase (ฟรี)
1. ไปที่ [Supabase](https://supabase.com)
2. สร้างโปรเจคใหม่
3. ไปที่ **Settings** > **Database**
4. คัดลอก **Connection String** มาใส่ใน `DATABASE_URL`

### 4. Deploy ไปยัง Vercel

#### วิธีที่ 1: ใช้ GitHub Integration (แนะนำ)

1. **ไปที่ [Vercel](https://vercel.com)**
2. **คลิก "New Project"**
3. **เชื่อมต่อกับ GitHub**
4. **เลือก repository** `patient-monitoring-app`
5. **ตั้งค่า Environment Variables:**
   - `DATABASE_URL` - Connection string ของ database
   - `JWT_SECRET` - Key สำหรับ JWT (สร้างใหม่)
   - `EMAIL_HOST` - SMTP host (เช่น smtp.gmail.com)
   - `EMAIL_PORT` - SMTP port (เช่น 587)
   - `EMAIL_USER` - อีเมลสำหรับส่ง
   - `EMAIL_PASS` - App password ของ Gmail
   - `EMAIL_FROM` - อีเมลผู้ส่ง
   - `NEXT_PUBLIC_LIFF_ID` - LINE LIFF ID (ถ้ามี)

6. **คลิก "Deploy"**

#### วิธีที่ 2: ใช้ Vercel CLI

```bash
# ติดตั้ง Vercel CLI
npm i -g vercel

# Login เข้า Vercel
vercel login

# Deploy
vercel

# ตั้งค่า Environment Variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add EMAIL_HOST
vercel env add EMAIL_PORT
vercel env add EMAIL_USER
vercel env add EMAIL_PASS
vercel env add EMAIL_FROM
vercel env add NEXT_PUBLIC_LIFF_ID
```

### 5. ตั้งค่า Database Migration

หลังจาก deploy สำเร็จ:

```bash
# ใช้ Vercel CLI
vercel env pull .env.local
npx prisma db push
```

หรือใช้ Vercel Dashboard:
1. ไปที่ **Functions** > **Edge Config**
2. รัน command: `npx prisma db push`

### 6. ตรวจสอบการทำงาน

1. **ไปที่ URL ที่ Vercel ให้**
2. **ทดสอบการสมัครสมาชิก**
3. **ทดสอบ LINE Login**
4. **ทดสอบการบันทึกข้อมูล**
5. **ทดสอบการสร้าง PDF**

## 🔧 การตั้งค่าเพิ่มเติม

### LINE LIFF Setup (ถ้าต้องการใช้ LINE Login)

1. ไปที่ [LINE Developers Console](https://developers.line.biz/)
2. สร้าง LIFF App
3. ตั้งค่า Endpoint URL: `https://your-app.vercel.app`
4. คัดลอก LIFF ID มาใส่ใน `NEXT_PUBLIC_LIFF_ID`

### Email Setup (Gmail)

1. เปิด 2-Factor Authentication ใน Gmail
2. สร้าง App Password
3. ใช้ App Password ใน `EMAIL_PASS`

## 🚨 การแก้ไขปัญหาที่อาจเกิดขึ้น

### 1. Database Connection Error
```
Error: Can't reach database server
```
**แก้ไข:** ตรวจสอบ `DATABASE_URL` และ network access

### 2. Build Error
```
Error: Prisma generate failed
```
**แก้ไข:** ตรวจสอบ `vercel.json` และ build command

### 3. Font ไม่แสดง
**แก้ไข:** ตรวจสอบ path ของ font file ใน `public/fonts/`

### 4. Email ไม่ส่ง
**แก้ไข:** ตรวจสอบ EMAIL_* variables และ Gmail App Password

### 5. LINE Login ไม่ทำงาน
**แก้ไข:** ตรวจสอบ `NEXT_PUBLIC_LIFF_ID` และ LIFF configuration

## 📊 Monitoring และ Analytics

### Vercel Analytics
1. ไปที่ **Analytics** tab ใน Vercel Dashboard
2. ดู performance metrics
3. ตรวจสอบ error logs

### Database Monitoring
- ใช้ Vercel Postgres dashboard
- หรือ Supabase dashboard

## 🔄 การอัปเดต

```bash
# อัปเดตโค้ด
git add .
git commit -m "Update app"
git push origin main

# Vercel จะ auto-deploy
```

## 📝 หมายเหตุสำคัญ

- ✅ ไฟล์ `vercel.json` มีการตั้งค่า build command ที่ถูกต้องแล้ว
- ✅ Font ไทย THSarabunNew จะทำงานได้ปกติใน Vercel
- ✅ Prisma schema รองรับ PostgreSQL
- ✅ API routes มี timeout 30 วินาที
- ✅ Environment variables ถูกตั้งค่าให้ production

## 🆘 การขอความช่วยเหลือ

หากมีปัญหา:
1. ตรวจสอบ Vercel Function Logs
2. ตรวจสอบ Database connection
3. ตรวจสอบ Environment Variables
4. ดู Error logs ใน Vercel Dashboard
