export async function onRequestPost({request,env}){
  try{
    const {place,context}=await request.json();
    if(!place||typeof place!=='string')return Response.json({error:'กรุณาระบุชื่อสถานที่'},{status:400});
    if(!env.OPENAI_API_KEY)return Response.json({error:'ยังไม่ได้ตั้งค่า OpenAI API key บน Cloudflare'},{status:503});
    const prompt=`เขียนคำบรรยายภาษาไทยเกี่ยวกับสถานที่ "${place}"${context?` ในบริบท ${context}`:''} จำนวน 80-130 คำ ใช้ภาษาเป็นทางการ อ่านง่าย เน้นข้อเท็จจริงที่ตรวจสอบได้ เช่น ที่ตั้ง ภูมิศาสตร์ ประวัติศาสตร์ ความสำคัญ หรือข้อมูลเฉพาะของสถานที่ หลีกเลี่ยงภาษาพรรณนาเชิงโฆษณา คำอวดอ้างเกินจริง และคำว่า สวยงามตระการตา หากไม่มั่นใจในตัวเลขหรือข้อเท็จจริงเฉพาะ ให้ละเว้น ไม่ต้องใส่หัวข้อและไม่ใช้ bullet`;
    const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'authorization':`Bearer ${env.OPENAI_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({model:'gpt-5.4-mini',instructions:'คุณเป็นบรรณาธิการเอกสารท่องเที่ยวที่ให้ความสำคัญกับความถูกต้อง กระชับ เป็นกลาง และไม่สร้างข้อมูลที่ไม่มั่นใจ',input:prompt,max_output_tokens:450,reasoning:{effort:'low'},store:false})});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error?.message||'OpenAI API ตอบกลับไม่สำเร็จ');
    const text=(result.output_text||result.output?.flatMap(item=>item.content||[]).find(item=>item.type==='output_text')?.text||'').trim();
    if(!text)throw new Error('AI ไม่ส่งข้อความกลับมา');
    return Response.json({text});
  }catch(error){return Response.json({error:error.message},{status:500})}
}
