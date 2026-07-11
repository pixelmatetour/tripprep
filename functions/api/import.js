const decode=s=>s.replace(/&nbsp;|&#160;/g,' ').replace(/&amp;|&#038;|&#38;/g,'&').replace(/&#8211;|&ndash;/g,'–').replace(/&#8212;|&mdash;/g,'—').replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"');
const clean=s=>decode(s).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
function attr(tag,name){return decode(tag.match(new RegExp(`${name}=["']([^"']+)`,'i'))?.[1]||'')}
function absolute(value,base){try{return new URL(decode(value),base).href}catch{return''}}
function parse(html,url){
  const metas=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>m[0]);
  const meta=key=>{const t=metas.find(x=>attr(x,'property')===key||attr(x,'name')===key);return t?attr(t,'content'):''};
  const title=clean(meta('og:title')||html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]||'');
  const body=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1]||html;
  const paragraphs=[...body.matchAll(/<(?:p|h2|h3|h4|li)\b[^>]*>([\s\S]*?)<\/(?:p|h2|h3|h4|li)>/gi)].map(m=>clean(m[1])).filter(x=>x.length>40&&!/cookie|privacy policy|wishlist requires/i.test(x));
  const og=clean(meta('og:description'));const description=(/^visit the post/i.test(og)||og.length<40?paragraphs.slice(0,6).join('\n\n'):og).slice(0,2600);
  const imageSet=new Set();const add=v=>{const x=absolute(v,url);if(x&&/^https?:/.test(x)&&!/(logo|icon|avatar|favicon|emoji|qr-official|line_add_friends)/i.test(x))imageSet.add(x)};
  add(meta('og:image'));
  for(const m of html.matchAll(/<img\b[^>]*>/gi)){const t=m[0];add(attr(t,'data-lazy-src')||attr(t,'data-src')||attr(t,'src'));const set=attr(t,'srcset')||attr(t,'data-srcset');if(set)add(set.split(',').map(x=>x.trim().split(/\s+/)[0]).pop())}
  return{sourceUrl:url,title,description,images:[...imageSet].slice(0,100)};
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
