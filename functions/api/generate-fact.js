export async function onRequestPost({request,env}){
  try{
    const {place,context}=await request.json();
    if(!place||typeof place!=='string')return Response.json({error:'กรุณาระบุชื่อสถานที่'},{status:400});
    if(!env.AI)return Response.json({error:'ยังไม่ได้เชื่อม Cloudflare Workers AI'},{status:503});
    const prompt=`เขียนคำบรรยายภาษาไทยเกี่ยวกับสถานที่ "${place}"${context?` ในบริบท ${context}`:''} จำนวน 80-130 คำ ใช้ภาษาเป็นทางการ อ่านง่าย เน้นข้อเท็จจริงที่ตรวจสอบได้ เช่น ที่ตั้ง ภูมิศาสตร์ ประวัติศาสตร์ ความสำคัญ หรือข้อมูลเฉพาะของสถานที่ หลีกเลี่ยงภาษาพรรณนาเชิงโฆษณา คำอวดอ้างเกินจริง และคำว่า สวยงามตระการตา หากไม่มั่นใจในตัวเลขหรือข้อเท็จจริงเฉพาะ ให้ละเว้น ไม่ต้องใส่หัวข้อและไม่ใช้ bullet`;
    const result=await env.AI.run('@cf/meta/llama-3.1-8b-instruct',{messages:[{role:'system',content:'คุณเป็นบรรณาธิการเอกสารท่องเที่ยวที่ให้ความสำคัญกับความถูกต้อง กระชับ และเป็นกลาง'},{role:'user',content:prompt}],max_tokens:350,temperature:.25});
    const text=(result.response||result.result?.response||'').trim();
    if(!text)throw new Error('AI ไม่ส่งข้อความกลับมา');
    return Response.json({text});
  }catch(error){return Response.json({error:error.message},{status:500})}
}
