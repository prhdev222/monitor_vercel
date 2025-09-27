'use client'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            ข้อกำหนดการใช้งาน
          </h1>
          
          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="text-sm text-gray-500 mb-6">
              อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. การยอมรับข้อกำหนด</h2>
              <p className="mb-4">
                การใช้งานแอปพลิเคชันตรวจสอบสุขภาพนี้ ถือว่าท่านได้อ่าน เข้าใจ และยอมรับข้อกำหนดการใช้งานทั้งหมด 
                หากท่านไม่ยอมรับข้อกำหนดเหล่านี้ กรุณาหยุดการใช้งานทันที
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. คำนิยาม</h2>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>"บริการ"</strong> หมายถึง แอปพลิเคชันตรวจสอบสุขภาพและบริการที่เกี่ยวข้อง</li>
                <li><strong>"ผู้ใช้"</strong> หมายถึง บุคคลที่ใช้งานบริการนี้</li>
                <li><strong>"ข้อมูลสุขภาพ"</strong> หมายถึง ข้อมูลความดันโลหิต ระดับน้ำตาลในเลือด และข้อมูลสุขภาพอื่นๆ</li>
                <li><strong>"เรา"</strong> หมายถึง ผู้ให้บริการแอปพลิเคชันนี้</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. การใช้งานบริการ</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 สิทธิการใช้งาน</h3>
              <p className="mb-4">
                เราให้สิทธิแก่ท่านในการใช้งานบริการเพื่อวัตถุประสงค์ส่วนบุคคลเท่านั้น ท่านไม่สามารถ:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>ใช้งานเพื่อวัตถุประสงค์ทางการค้าโดยไม่ได้รับอนุญาต</li>
                <li>คัดลอก แก้ไข หรือแจกจ่ายบริการ</li>
                <li>พยายามเข้าถึงระบบโดยไม่ได้รับอนุญาต</li>
                <li>ใช้งานในลักษณะที่ผิดกฎหมายหรือเป็นอันตราย</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.2 บัญชีผู้ใช้</h3>
              <p className="mb-4">ท่านมีหน้าที่:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>ให้ข้อมูลที่ถูกต้องและเป็นปัจจุบัน</li>
                <li>รักษาความปลอดภัยของบัญชีและรหัสผ่าน</li>
                <li>แจ้งเราทันทีหากพบการใช้งานที่ไม่ได้รับอนุญาต</li>
                <li>รับผิดชอบต่อกิจกรรมทั้งหมดในบัญชีของท่าน</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. ข้อมูลสุขภาพและความรับผิดชอบ</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-yellow-800">
                  <strong>คำเตือนสำคัญ:</strong> บริการนี้เป็นเครื่องมือช่วยในการติดตามสุขภาพเท่านั้น 
                  ไม่ใช่การวินิจฉัยทางการแพทย์ กรุณาปรึกษาแพทย์เสมอ
                </p>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 ความถูกต้องของข้อมูล</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>ท่านรับผิดชอบในการบันทึกข้อมูลที่ถูกต้อง</li>
                <li>เราไม่รับประกันความแม่นยำของข้อมูลที่ท่านบันทึก</li>
                <li>ข้อมูลที่แสดงเป็นเพียงการอ้างอิงเท่านั้น</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 การใช้ข้อมูลทางการแพทย์</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>ไม่ใช้บริการนี้แทนการปรึกษาแพทย์</li>
                <li>ในกรณีฉุกเฉิน ให้ติดต่อแพทย์หรือโรงพยาบาลทันที</li>
                <li>การตีความผลต้องได้รับคำแนะนำจากแพทย์</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. การส่งข้อมูลให้คลินิก</h2>
              <p className="mb-4">
                เมื่อท่านยินยอมให้ส่งข้อมูลสุขภาพไปยังคลินิกหรือโรงพยาบาล:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>ท่านให้ความยินยอมในการแบ่งปันข้อมูลสุขภาพ</li>
                <li>ข้อมูลจะถูกส่งผ่านช่องทางที่ปลอดภัย</li>
                <li>ท่านสามารถยกเลิกการส่งข้อมูลได้ตลอดเวลา</li>
                <li>เราไม่รับผิดชอบต่อการใช้ข้อมูลของคลินิกหลังจากส่งแล้ว</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. ข้อจำกัดความรับผิดชอบ</h2>
              <p className="mb-4">เราไม่รับผิดชอบต่อ:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>ความเสียหายที่เกิดจากการใช้งานบริการ</li>
                <li>ความไม่ถูกต้องของข้อมูลที่ท่านบันทึก</li>
                <li>การขัดข้องของระบบหรือการหยุดให้บริการชั่วคราว</li>
                <li>การสูญหายของข้อมูลจากสาเหตุที่ไม่คาดคิด</li>
                <li>ผลกระทบทางสุขภาพจากการตีความข้อมูลผิด</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. การยกเลิกบริการ</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">7.1 การยกเลิกโดยผู้ใช้</h3>
              <p className="mb-4">ท่านสามารถยกเลิกการใช้งานได้ตลอดเวลาโดยการลบบัญชี</p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">7.2 การยกเลิกโดยเรา</h3>
              <p className="mb-4">เราสงวนสิทธิในการยกเลิกบริการหาก:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>ท่านละเมิดข้อกำหนดการใช้งาน</li>
                <li>มีการใช้งานที่ผิดกฎหมายหรือไม่เหมาะสม</li>
                <li>เพื่อปกป้องความปลอดภัยของระบบและผู้ใช้อื่น</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. ทรัพย์สินทางปัญญา</h2>
              <p className="mb-4">
                บริการนี้และเนื้อหาทั้งหมดเป็นทรัพย์สินทางปัญญาของเรา ท่านไม่สามารถ:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>คัดลอกหรือทำซ้ำเนื้อหาโดยไม่ได้รับอนุญาต</li>
                <li>ใช้เครื่องหมายการค้าของเราโดยไม่ได้รับอนุญาต</li>
                <li>สร้างงานดัดแปลงจากบริการของเรา</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. การแก้ไขข้อกำหนด</h2>
              <p className="mb-4">
                เราสงวนสิทธิในการแก้ไขข้อกำหนดการใช้งานนี้เป็นครั้งคราว การเปลี่ยนแปลงจะมีผลบังคับใช้
                ทันทีที่ประกาศบนแอปพลิเคชัน การใช้งานต่อไปถือว่าท่านยอมรับข้อกำหนดใหม่
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. กฎหมายที่ใช้บังคับ</h2>
              <p className="mb-4">
                ข้อกำหนดนี้อยู่ภายใต้กฎหมายไทย ข้อพิพาทใดๆ จะอยู่ในเขตอำนาจศาลไทย
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. ติดต่อเรา</h2>
              <p className="mb-4">
                หากท่านมีคำถามเกี่ยวกับข้อกำหนดการใช้งาน กรุณาติดต่อเราผ่าน:
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
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200"
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