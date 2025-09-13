# ระบบติดตามค่าความดันโลหิตและ DTX

ระบบ Web Application สำหรับผู้ป่วยในการบันทึกและติดตามค่าความดันโลหิตและระดับน้ำตาลในเลือด (DTX) โดยใช้ Supabase เป็นฐานข้อมูล

## ✨ คุณสมบัติหลัก

### 📝 การบันทึกข้อมูล
- บันทึกค่าความดันโลหิต (ตัวบน/ตัวล่าง)
- บันทึกค่า DTX (น้ำตาลในเลือด)
- เลือกช่วงเวลาการวัด (เช้า, กลางวัน, เย็น, ก่อนนอน)
- เพิ่มหมายเหตุประกอบ

### 🔍 การค้นหาข้อมูล
- ค้นหาด้วยหมายเลข HN (ไม่แสดงชื่อ-นามสกุลเพื่อความเป็นส่วนตัว)
- กรองตามประเภทการวัด
- แสดงประวัติการวัดทั้งหมด

### 📊 สถิติและการวิเคราะห์
- ค่าเฉลี่ยในช่วง 1-3 เดือน
- ค่าสูงสุดและต่ำสุด
- การวิเคราะห์ตามช่วงเวลา
- แสดงแนวโน้มการเปลี่ยนแปลง

## 🚀 การติดตั้งและใช้งาน

### ข้อกำหนดเบื้องต้น
- Node.js (เวอร์ชัน 14 ขึ้นไป)
- บัญชี Supabase
- Git

### การติดตั้ง

1. **Clone repository**
   ```bash
   git clone https://github.com/yourusername/patient-monitoring-app.git
   cd patient-monitoring-app
   ```

2. **ติดตั้ง dependencies**
   ```bash
   npm install
   ```

3. **ตั้งค่า Supabase**
   - สร้างโปรเจกต์ใหม่ใน [Supabase](https://supabase.com)
   - รันคำสั่ง SQL ในไฟล์ `database.sql`
   - คัดลอก URL และ Anon Key

4. **แก้ไขการตั้งค่าใน script.js**
   ```javascript
   const SUPABASE_URL = 'your-supabase-url';
   const SUPABASE_ANON_KEY = 'your-supabase-anon-key';
   ```

5. **รันแอปพลิเคชัน**
   ```bash
   npm run dev
   ```

## 🗄️ โครงสร้างฐานข้อมูล

### ตาราง `patients`
- `id`: UUID (Primary Key)
- `hn`: หมายเลข HN (Unique)
- `age`: อายุ
- `gender`: เพศ
- `created_at`: วันที่สร้าง
- `updated_at`: วันที่อัปเดต

### ตาราง `patient_records`
- `id`: UUID (Primary Key)
- `patient_id`: Foreign Key ไปยัง patients
- `hn`: หมายเลข HN
- `record_type`: ประเภทการวัด ('blood_pressure' หรือ 'dtx')
- `systolic`: ความดันตัวบน
- `diastolic`: ความดันตัวล่าง
- `dtx_value`: ค่า DTX
- `time_period`: ช่วงเวลา ('morning', 'afternoon', 'evening', 'before_sleep')
- `measured_at`: วันเวลาที่วัด
- `notes`: หมายเหตุ
- `created_at`: วันที่บันทึก

## 🔒 ความปลอดภัย

- ใช้ Row Level Security (RLS) ของ Supabase
- ไม่เก็บชื่อ-นามสกุลในฐานข้อมูล
- การเข้าถึงข้อมูลผ่าน Authentication

## 📱 Responsive Design

- รองรับการใช้งานบนมือถือ
- UI/UX ที่เป็นมิตรกับผู้ใช้
- Bootstrap 5 สำหรับการจัดแต่ง

## 🚀 การ Deploy

### GitHub Pages

1. **Push โค้ดไปยัง GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/patient-monitoring-app.git
   git push -u origin main
   ```

2. **Deploy ด้วย gh-pages**
   ```bash
   npm run deploy
   ```

3. **เปิดใช้งาน GitHub Pages**
   - ไปที่ Settings > Pages
   - เลือก Source: Deploy from a branch
   - เลือก Branch: gh-pages

### การตั้งค่า Custom Domain (ถ้าต้องการ)

1. เพิ่มไฟล์ `CNAME` ในโฟลเดอร์หลัก
2. ใส่ชื่อโดเมนที่ต้องการ
3. ตั้งค่า DNS ให้ชี้ไปยัง GitHub Pages

## 🛠️ การพัฒนาต่อ

### เพิ่มฟีเจอร์ใหม่
- การแจ้งเตือนเมื่อค่าผิดปกติ
- การส่งออกข้อมูลเป็น PDF
- การตั้งค่าเป้าหมายค่าวัด
- การเชื่อมต่อกับอุปกรณ์วัดอัตโนมัติ

### การปรับปรุง UI/UX
- เพิ่มกราฟแสดงแนวโน้ม
- Dark mode
- การแจ้งเตือนแบบ Push notification

## 📞 การสนับสนุน

หากพบปัญหาหรือต้องการความช่วยเหลือ:
- สร้าง Issue ใน GitHub Repository
- ติดต่อทีมพัฒนา

## 📄 License

MIT License - ดูรายละเอียดในไฟล์ LICENSE

## 🤝 การมีส่วนร่วม

ยินดีรับการมีส่วนร่วมในการพัฒนา:
1. Fork repository
2. สร้าง feature branch
3. Commit การเปลี่ยนแปลง
4. Push ไปยัง branch
5. สร้าง Pull Request

---

**หมายเหตุ**: ระบบนี้พัฒนาขึ้นเพื่อช่วยในการติดตามสุขภาพของผู้ป่วย ไม่ใช่การทดแทนคำแนะนำทางการแพทย์