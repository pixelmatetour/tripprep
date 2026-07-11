const decode=s=>s.replace(/&nbsp;|&#160;/g,' ').replace(/&amp;|&#038;|&#38;/g,'&').replace(/&#8211;|&ndash;/g,'–').replace(/&#8212;|&mdash;/g,'—').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"');
const clean=s=>decode(s).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
function attr(tag,name){return decode(tag.match(new RegExp(`${name}=["']([^"']+)`,'i'))?.[1]||'')}
function absolute(value,base){try{return new URL(decode(value),base).href}catch{return''}}
function originalImage(value,base){
  const absoluteUrl=absolute(value,base);if(!absoluteUrl)return'';
  try{const u=new URL(absoluteUrl);u.pathname=u.pathname.replace(/-\d{2,5}x\d{2,5}(?=\.(?:jpe?g|png|webp|avif)$)/i,'');return u.href}catch{return absoluteUrl}
}
function largestSrcset(value){
  return value.split(',').map(item=>{const parts=item.trim().split(/\s+/);const score=parseFloat(parts[1])||0;return{url:parts[0],score}}).filter(x=>x.url).sort((a,b)=>b.score-a.score)[0]?.url||'';
}
function labeled(html,label){const match=html.match(new RegExp(`<strong[^>]*>\\s*${label}\\s*<\\/strong>([\\s\\S]*?)<\\/p>`,'i'));return clean(match?.[1]||'')}
function thaiDateRange(html){
  const text=clean(html).match(/(\d{1,2})\s*[-–]\s*(\d{1,2})\s*(มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรก(?:ฎ|ฏ)าคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)\s*(25\d{2})/) ;if(!text)return{};
  const months=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];const normalized=text[3].replace('กรกฏาคม','กรกฎาคม');const month=String(months.indexOf(normalized)+1).padStart(2,'0'),year=+text[4]-543;return{startDate:`${year}-${month}-${String(text[1]).padStart(2,'0')}`,endDate:`${year}-${month}-${String(text[2]).padStart(2,'0')}`}
}
function structured(html,url){
  const itinerary=(html.split(/id=["']itinerary["']/i)[1]||'').split(/id=["']misc["']/i)[0]||'';
  const days=itinerary.split(/gdlr-core-toggle-box-item-tab/i).slice(1).map(chunk=>{const heading=clean(chunk.match(/<h4\b[^>]*>([\s\S]*?)<\/h4>/i)?.[1]||'');if(!/^Day\s/i.test(heading))return null;const dayName=heading.match(/^Day\s*[\d-]+/i)?.[0]||'Day';const date=heading.slice(dayName.length).trim();const body=(chunk.match(/gdlr-core-toggle-box-item-content["'][^>]*>([\s\S]*)/i)?.[1]||'').replace(/<div class=[\s\S]*$/i,'');const fact=clean(body.match(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/i)?.[1]||'');const hotel=clean(body.match(/<p[^>]*>\s*(พักที่[\s\S]*?)<\/p>/i)?.[1]||'').replace(/^พักที่\s*/,'');const detail=clean(body.replace(/<blockquote\b[^>]*>[\s\S]*?<\/blockquote>/gi,' ').replace(/<p[^>]*>\s*Meal[\s\S]*?<\/p>/gi,' ').replace(/<img\b[^>]*>/gi,' '));const photos=[];for(const image of body.matchAll(/<img\b[^>]*>/gi)){const src=originalImage(attr(image[0],'data-orig-file')||attr(image[0],'src'),url);if(src&&!photos.includes(src))photos.push(src)}return{date,place:'',title:dayName,detail,hotel,funFactTitle:'',funFactText:fact,photos:photos.slice(0,2)}}).filter(Boolean);
  const misc=(html.split(/id=["']misc["']/i)[1]||'').split(/id=["']photos["']/i)[0]||'';const items=[...misc.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map(m=>clean(m[1])).filter(x=>x&&x.length<500);const packing=items.slice(0,14).join('\n');const documents=items.filter(x=>/วีซ่า|passport|หนังสือเดินทาง|ประกันการเดินทาง/i.test(x)).slice(0,6).join('\n');const beforeItinerary=html.split(/id=["']itinerary["']/i)[0];const flights=[...beforeItinerary.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>clean(m[1])).filter(x=>x.length<600&&/\b(?:TG|LH)\d{3,4}\b/.test(x)).join('\n');const hotels=[...itinerary.matchAll(/<p[^>]*>\s*(พักที่[\s\S]*?)<\/p>/gi)].map(m=>clean(m[1]).replace(/^พักที่\s*/, '')).filter(Boolean);return{...thaiDateRange(html),groupSize:labeled(html,'สมาชิก'),leaders:labeled(html,'Trip leader'),weather:labeled(html,'สภาพอากาศ'),transport:labeled(html,'ลักษณะการเดินทาง'),hotels:[...new Set(hotels)].join('\n'),flights,packing,documents,notes:labeled(html,'ระดับความยาก'),days}
}
function parse(html,url){
  const metas=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]);
  const meta=key=>{const t=metas.find(x=>attr(x,'property')===key||attr(x,'name')===key);return t?attr(t,'content'):''};
  const detailHtml=html.split(/id=["']detail["']/i)[1]||html;const title=clean(detailHtml.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||meta('og:title')||html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]||'');
  const body=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1]||html;
  const paragraphs=[...body.matchAll(/<(?:p|h2|h3|h4|li)\b[^>]*>([\s\S]*?)<\/(?:p|h2|h3|h4|li)>/gi)].map(m=>clean(m[1])).filter(x=>x.length>40&&!/cookie|privacy policy|wishlist requires/i.test(x));
  const og=clean(meta('og:description'));const description=(/^visit the post/i.test(og)||og.length<40?paragraphs.slice(0,6).join('\n\n'):og).slice(0,2600);
  const imageSet=new Set();const add=v=>{const x=originalImage(v,url);if(x&&/^https?:/.test(x)&&!/(logo|icon|avatar|favicon|emoji|placeholder|blur|lazy|qr-official|line_add_friends)/i.test(x))imageSet.add(x)};
  add(meta('og:image'));
  for(const m of html.matchAll(/<img\b[^>]*>/gi)){const t=m[0];const set=attr(t,'srcset')||attr(t,'data-srcset');add(attr(t,'data-orig-file')||attr(t,'data-large-file')||attr(t,'data-full-url')||(set&&largestSrcset(set))||attr(t,'data-lazy-src')||attr(t,'data-src')||attr(t,'src'))}
  return{sourceUrl:url,title,description,images:[...imageSet].slice(0,100),fields:structured(html,url)};
}
export async function onRequestGet({request}){
  try{
    const target=new URL(request.url).searchParams.get('url');
    if(!target||!/^https?:\/\//.test(target))return Response.json({error:'URL ไม่ถูกต้อง'},{status:400});
    const upstream=await fetch(target,{headers:{'user-agent':'Mozilla/5.0 TripPrepImporter/1.0','accept':'text/html'}});
    if(!upstream.ok)throw new Error(`เว็บไซต์ตอบกลับ ${upstream.status}`);
    return Response.json(parse(await upstream.text(),target));
  }catch(error){return Response.json({error:error.message},{status:500})}
}
