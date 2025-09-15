# ระบบบันทึกข้อมูลสุขภาพ (Patient Monitoring App)

เว็บแอปพลิเคชันสำหรับบันทึกค่าความดันโลหิตและน้ำตาลในเลือดที่บ้าน เพื่อให้แพทย์สามารถติดตามและให้คำแนะนำได้อย่างมีประสิทธิภาพ

## คุณสมบัติหลัก

- 🔐 **ระบบ Authentication** - เข้าสู่ระบบด้วยเบอร์โทรศัพท์และรหัสผ่าน
- 📊 **บันทึกข้อมูลสุขภาพ** - บันทึกค่าความดันโลหิตและน้ำตาลในเลือด
- 📈 **กราฟแสดงผล** - แสดงประวัติข้อมูลในรูปแบบกราฟ
- 📧 **ส่งข้อมูลให้แพทย์** - ส่งข้อมูลให้คลินิกผ่านอีเมล
- 🛡️ **ความปลอดภัย** - จัดการข้อมูลตาม PDPA
- ⏰ **ลบข้อมูลอัตโนมัติ** - ลบข้อมูลหลังจาก 3 เดือน
- 📱 **Responsive Design** - ใช้งานได้ทั้งบนเว็บและมือถือ

## เทคโนโลยีที่ใช้

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: Neon (PostgreSQL)
- **Authentication**: JWT
- **Email**: Nodemailer
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

## การติดตั้ง

### 1. Clone โปรเจค
```bash
git clone <repository-url>
cd patient-monitoring-app
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. ตั้งค่า Environment Variables
สร้างไฟล์ `.env` จาก `.env.example` และกรอกข้อมูล:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/patient_monitoring"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-here"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Clinic Email
CLINIC_EMAIL="clinic@example.com"
```

### 4. ตั้งค่าฐานข้อมูล
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 5. รันแอปพลิเคชัน
```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

## การใช้งาน

### 1. ลงทะเบียน
- ไปที่หน้า Register
- กรอกเบอร์โทรศัพท์, รหัสผ่าน, ชื่อ-นามสกุล (ไม่บังคับ), อีเมล (ไม่บังคับ)
- ติ๊กยินยอมตาม PDPA
- กดลงทะเบียน

### 2. เข้าสู่ระบบ
- ไปที่หน้า Login
- กรอกเบอร์โทรศัพท์และรหัสผ่าน
- กดเข้าสู่ระบบ

### 3. บันทึกข้อมูล
- **ความดันโลหิต**: กรอกค่า Systolic, Diastolic, Pulse (ไม่บังคับ), หมายเหตุ
- **น้ำตาลในเลือด**: กรอกค่า, หน่วย (mg/dL หรือ mmol/L), หมายเหตุ

### 4. ดูประวัติและกราฟ
- ไปที่แท็บ "ประวัติและกราฟ"
- ดูกราฟแสดงแนวโน้มข้อมูล 7 วันล่าสุด
- ดูสถิติข้อมูลทั้งหมด

### 5. ส่งข้อมูลให้คลินิก
- ไปที่แท็บ "ประวัติและกราฟ"
- กดปุ่ม "ส่งข้อมูลให้คลินิก"
- ระบบจะส่งอีเมลข้อมูลทั้งหมดให้คลินิก

## API Endpoints

### Authentication
- `POST /api/auth/register` - ลงทะเบียน
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/logout` - ออกจากระบบ
- `GET /api/auth/me` - ตรวจสอบสถานะการเข้าสู่ระบบ

### ข้อมูลสุขภาพ
- `POST /api/blood-pressure` - บันทึกความดันโลหิต
- `GET /api/blood-pressure` - ดึงข้อมูลความดันโลหิต
- `POST /api/blood-sugar` - บันทึกน้ำตาลในเลือด
- `GET /api/blood-sugar` - ดึงข้อมูลน้ำตาลในเลือด

### อีเมล
- `POST /api/email/send-data` - ส่งข้อมูลให้คลินิก

### การจัดการข้อมูล
- `POST /api/cleanup` - ลบข้อมูลเก่า (3 เดือน)

## ระบบลบข้อมูลอัตโนมัติ

ระบบจะลบข้อมูลที่เก่ากว่า 3 เดือนอัตโนมัติ โดย:
1. ตรวจสอบข้อมูลที่เก่ากว่า 3 เดือน
2. ส่งอีเมลข้อมูลก่อนลบให้คลินิก (หากผู้ใช้ยินยอม)
3. ลบข้อมูลออกจากฐานข้อมูล

สามารถเรียกใช้ API `/api/cleanup` เพื่อลบข้อมูลด้วยตนเอง

## การ Deploy

### 1. Deploy บน Vercel
```bash
# ติดตั้ง Vercel CLI
npm i -g vercel

# Deploy
vercel

# ตั้งค่า Environment Variables ใน Vercel Dashboard
```

### 2. ตั้งค่า Neon Database
1. สร้างโปรเจคใหม่ใน [Neon Console](https://console.neon.tech/)
2. คัดลอก Connection String
3. ตั้งค่าใน Environment Variables

### 3. ตั้งค่าอีเมล
1. ใช้ Gmail App Password หรือ SMTP service อื่น
2. ตั้งค่า SMTP credentials ใน Environment Variables

## ข้อกำหนดด้านความปลอดภัย

- ข้อมูลทั้งหมดถูกเข้ารหัสในขณะส่งผ่าน (HTTPS)
- รหัสผ่านถูกเข้ารหัสด้วย bcrypt
- ใช้ JWT สำหรับ authentication
- จัดการตาม PDPA พร้อมระบบยินยอม
- ข้อมูลถูกเก็บไว้ 3 เดือนเท่านั้น

## การพัฒนาต่อ

### เพิ่มฟีเจอร์ใหม่
1. ระบบแจ้งเตือน
2. การส่งข้อมูลแบบ Real-time
3. Mobile App (React Native)
4. ระบบรายงานที่ซับซ้อนขึ้น

### ปรับปรุงประสิทธิภาพ
1. ใช้ Redis สำหรับ caching
2. ใช้ CDN สำหรับ static files
3. ใช้ Database indexing

## License

MIT License

## Support

หากมีปัญหาหรือข้อสงสัย กรุณาติดต่อทีมพัฒนา
