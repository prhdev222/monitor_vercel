'use client'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            นโยบายความเป็นส่วนตัว
          </h1>
          
          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="text-sm text-gray-500 mb-6">
              อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. ข้อมูลที่เราเก็บรวบรวม</h2>
              <p className="mb-4">
                เราเก็บรวบรวมข้อมูลส่วนบุคคลของท่านเพื่อให้บริการตรวจสอบสุขภาพและการดูแลผู้ป่วย ข้อมูลที่เก็บรวบรวม ได้แก่:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>ข้อมูลส่วนตัว: ชื่อ นามสกุล เบอร์โทรศัพท์ อีเมล</li>
                <li>ข้อมูลทางการแพทย์: เลขที่ HN (Hospital Number) วัดที่สังกัด</li>
                <li>ข้อมูลสุขภาพ: ความดันโลหิต ระดับน้ำตาลในเลือด</li>
                <li>ข้อมูลจาก LINE: LINE User ID, ชื่อที่แสดง, รูปโปรไฟล์</li>
                <li>ข้อมูลการใช้งาน: เวลาการเข้าสู่ระบบ การบันทึกข้อมูล</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. วัตถุประสงค์ในการใช้ข้อมูล</h2>
              <p className="mb-4">เราใช้ข้อมูลของท่านเพื่อ:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>ให้บริการตรวจสอบและติดตามสุขภาพ</li>
                <li>ส่งข้อมูลสุขภาพให้แก่คลินิกหรือโรงพยาบาล</li>
                <li>ปรับปรุงและพัฒนาบริการ</li>
                <li>ติดต่อสื่อสารเกี่ยวกับบริการ</li>
                <li>ปฏิบัติตามกฎหมายและข้อบังคับ</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. การแบ่งปันข้อมูล</h2>
              <p className="mb-4">
                เราจะไม่เปิดเผยข้อมูลส่วนบุคคลของท่านแก่บุคคลที่สาม ยกเว้น:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>เมื่อได้รับความยินยอมจากท่าน</li>
                <li>การส่งข้อมูลให้แก่คลินิกหรือโรงพยาบาลที่ท่านระบุ</li>
                <li>เมื่อกฎหมายกำหนดให้ต้องเปิดเผย</li>
                <li>เพื่อปกป้องสิทธิและความปลอดภัยของเราและผู้ใช้อื่น</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. ความปลอดภัยของข้อมูล</h2>
              <p className="mb-4">
                เราใช้มาตรการรักษาความปลอดภัยที่เหมาะสมเพื่อปกป้องข้อมูลของท่าน:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>การเข้ารหัสข้อมูลระหว่างการส่งผ่าน (SSL/TLS)</li>
                <li>การจำกัดการเข้าถึงข้อมูลเฉพาะผู้ที่ได้รับอนุญาต</li>
                <li>การสำรองข้อมูลและการกู้คืนข้อมูล</li>
                <li>การตรวจสอบและอัปเดตระบบความปลอดภัยอย่างสม่ำเสมอ</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. สิทธิของเจ้าของข้อมูล</h2>
              <p className="mb-4">ท่านมีสิทธิในการ:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>เข้าถึงและขอสำเนาข้อมูลส่วนบุคคล</li>
                <li>แก้ไขหรือปรับปรุงข้อมูลที่ไม่ถูกต้อง</li>
                <li>ลบหรือทำลายข้อมูลส่วนบุคคล</li>
                <li>ระงับการใช้ข้อมูลส่วนบุคคล</li>
                <li>โอนย้ายข้อมูลส่วนบุคคล</li>
                <li>คัดค้านการใช้ข้อมูลส่วนบุคคล</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. การใช้คุกกี้</h2>
              <p className="mb-4">
                เราใช้คุกกี้เพื่อปรับปรุงประสบการณ์การใช้งานของท่าน รวมถึง:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>จดจำการเข้าสู่ระบบ</li>
                <li>บันทึกการตั้งค่าของท่าน</li>
                <li>วิเคราะห์การใช้งานเว็บไซต์</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. การเปลี่ยนแปลงนโยบาย</h2>
              <p className="mb-4">
                เราอาจปรับปรุงนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว การเปลี่ยนแปลงจะมีผลบังคับใช้
                ทันทีที่ประกาศบนเว็บไซต์ เราแนะนำให้ท่านตรวจสอบนโยบายนี้เป็นประจำ
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. ติดต่อเรา</h2>
              <p className="mb-4">
                หากท่านมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ หรือต้องการใช้สิทธิของท่าน 
                กรุณาติดต่อเราผ่าน:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>อีเมล:</strong> uradev222@gmail.com</p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-center">
              <button
                onClick={() => window.history.back()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200"
              >
                กลับ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}