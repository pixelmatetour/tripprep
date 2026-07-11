const mediaPool=document.querySelector('#mediaPool');
const selectAllBtn=document.querySelector('#selectAllBtn');
function updateSelectAll(){
  const total=imported?.images?.length||0;
  const allSelected=total>0&&selected.size===total;
  selectAllBtn.textContent=allSelected?'ยกเลิกทั้งหมด':`เลือกทั้งหมด${selected.size?` (${selected.size})`:''}`;
  selectAllBtn.classList.toggle('has-selection',selected.size>0);
}
function guardImportedImages(){
  if(typeof imported!=='undefined')globalThis.imported=imported;
  mediaPool.querySelectorAll('.media-card img:not([data-image-guard])').forEach(img=>{
    img.dataset.imageGuard='true';
    const fail=()=>img.closest('.media-card')?.classList.add('image-error');
    img.addEventListener('error',fail,{once:true});
    if(img.complete&&img.naturalWidth===0)fail();
  });
}
new MutationObserver(guardImportedImages).observe(mediaPool,{childList:true,subtree:true});
guardImportedImages();
selectAllBtn.addEventListener('click',()=>{
  if(!imported?.images?.length)return;
  if(selected.size===imported.images.length)selected.clear();
  else imported.images.forEach((_,index)=>selected.add(index));
  pool();
  updateSelectAll();
});
mediaPool.addEventListener('click',()=>queueMicrotask(updateSelectAll));
document.querySelector('#importBtn').addEventListener('click',()=>{selected.clear();updateSelectAll()});
document.querySelector('#addSelectedBtn').addEventListener('click',()=>queueMicrotask(updateSelectAll));
