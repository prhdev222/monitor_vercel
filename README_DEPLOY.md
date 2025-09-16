# การ Deploy แอปพลิเคชัน Patient Monitoring ไปยัง Vercel

## ขั้นตอนการ Deploy

### 1. เตรียม Environment Variables

สร้างไฟล์ `.env.local` ในโปรเจคและเพิ่มตัวแปรต่อไปนี้:

```env
# Database (ใช้ PostgreSQL)
DATABASE_URL="postgresql://username:password@host:port/database"

# JWT Secret (สร้าง key ยาวๆ)
JWT_SECRET="your-super-secret-jwt-key-here"

# Email Configuration (สำหรับส่งรายงาน)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="your-email@gmail.com"
```

### 2. ตั้งค่า Database

#### ตัวเลือก A: ใช้ Vercel Postgres (แนะนำ)
1. ไปที่ Vercel Dashboard
2. เลือกโปรเจค
3. ไปที่ Settings > Storage
4. สร้าง Postgres Database
5. คัดลอก Connection String มาใส่ใน DATABASE_URL

#### ตัวเลือก B: ใช้ Supabase (ฟรี)
1. ไปที่ https://supabase.com
2. สร้างโปรเจคใหม่
3. ไปที่ Settings > Database
4. คัดลอก Connection String มาใส่ใน DATABASE_URL

### 3. Deploy ไปยัง Vercel

#### วิธีที่ 1: ใช้ Vercel CLI
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
```

#### วิธีที่ 2: ใช้ GitHub Integration
1. Push โค้ดไปยัง GitHub
2. ไปที่ https://vercel.com
3. คลิก "New Project"
4. เชื่อมต่อกับ GitHub repository
5. ตั้งค่า Environment Variables ใน Vercel Dashboard

### 4. ตั้งค่า Database Migration

หลังจาก deploy แล้ว ต้องรัน migration:

```bash
# ใน Vercel Dashboard > Functions > Edge Config
# หรือใช้ Vercel CLI
vercel env pull .env.local
npx prisma db push
```

### 5. ตรวจสอบการทำงาน

1. ไปที่ URL ที่ Vercel ให้
2. ทดสอบการสมัครสมาชิก
3. ทดสอบการบันทึกข้อมูล
4. ทดสอบการสร้าง PDF

## หมายเหตุสำคัญ

- ไฟล์ `vercel.json` มีการตั้งค่า build command ที่ถูกต้องแล้ว
- Font ไทย THSarabunNew จะทำงานได้ปกติใน Vercel
- ต้องตั้งค่า Environment Variables ให้ครบถ้วน
- ควรใช้ PostgreSQL database ที่รองรับ Prisma

## การแก้ไขปัญหาที่อาจเกิดขึ้น

1. **Database Connection Error**: ตรวจสอบ DATABASE_URL
2. **Font ไม่แสดง**: ตรวจสอบ path ของ font file
3. **Email ไม่ส่ง**: ตรวจสอบ EMAIL_* variables
4. **Build Error**: ตรวจสอบ dependencies ใน package.json
