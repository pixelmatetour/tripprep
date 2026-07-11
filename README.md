# TripPrep Studio

เว็บสำหรับกรอกข้อมูลทริป สร้างเอกสาร A4 และบันทึกเป็น PDF

## เปิดใช้งาน

เปิด `index.html` ได้โดยตรง หรือรัน local server:

```bash
node server.mjs
```

จากนั้นเปิด http://localhost:4173

ปุ่ม **ดาวน์โหลด PDF** จะเปิดหน้าต่างพิมพ์ของเบราว์เซอร์ เลือก **Save as PDF** และตั้ง margins เป็น None (ค่า CSS กำหนด A4 ไว้แล้ว)

ข้อมูลถูกบันทึกอัตโนมัติใน browser ด้วย localStorage และไม่ส่งออกไปภายนอก

การนำเข้าจากเว็บไซต์ต้องเปิดผ่าน `server.mjs` เพราะ browser ไม่อนุญาตให้ไฟล์ HTML ดึงข้อมูลเว็บภายนอกโดยตรง

## Deploy to Cloudflare Pages

โปรเจกต์มี Pages Function ที่ `functions/api/import.js` สำหรับระบบนำเข้าจากเว็บไซต์

```bash
wrangler pages deploy . --project-name pixelmate-tripprep
```
