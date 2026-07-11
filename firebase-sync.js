import{initializeApp}from'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import{getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,signOut,onAuthStateChanged,setPersistence,browserLocalPersistence}from'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import{getFirestore,doc,setDoc,collection,getDocs}from'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';
const firebaseConfig={projectId:'pixelmate-tripprep-2026',appId:'1:826579773090:web:c63f13421a95132a23d9fb',storageBucket:'pixelmate-tripprep-2026.firebasestorage.app',apiKey:'AIzaSyBfKQLqiPxcrbW3Z4yldxJBVF-9eY4Wk3A',authDomain:'pixelmate-tripprep-2026.firebaseapp.com',messagingSenderId:'826579773090'};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),button=document.querySelector('#firebaseBtn'),provider=new GoogleAuthProvider();provider.setCustomParameters({login_hint:'porbital@gmail.com'});let user=null,saveTimer;
async function pushProject(project){if(!user)return;await setDoc(doc(db,'users',user.uid,'projects',project.id),{name:project.name,updatedAt:project.updatedAt,data:project.data},{merge:true})}
async function pullProjects(){const snapshot=await getDocs(collection(db,'users',user.uid,'projects'));const records=snapshot.docs.map(item=>({id:item.id,...item.data()}));window.TripPrepBridge.mergeCloudProjects(records);await pushProject(window.TripPrepBridge.getCurrent())}
button.addEventListener('click',async()=>{try{if(user)await signOut(auth);else await signInWithPopup(auth,provider)}catch(error){alert('เชื่อม Firebase ไม่สำเร็จ: '+error.message)}});
window.addEventListener('tripprep-local-save',event=>{clearTimeout(saveTimer);if(user)saveTimer=setTimeout(()=>pushProject(event.detail).catch(console.error),800)});
async function startAuth(){
 await setPersistence(auth,browserLocalPersistence);
 try{await getRedirectResult(auth)}catch(error){console.error('Firebase redirect sign-in failed',error);sessionStorage.removeItem('tripprep-auto-auth-attempted')}
 onAuthStateChanged(auth,async current=>{user=current;button.classList.toggle('connected',!!user);button.textContent=user?`☁ ${user.displayName||user.email||'เชื่อมแล้ว'}`:'☁ กำลังเชื่อม Firebase';button.title=user?'คลิกเพื่อออกจาก Firebase':'ระบบจะเชื่อม Google อัตโนมัติ';if(user){sessionStorage.removeItem('tripprep-auto-auth-attempted');try{await pullProjects()}catch(error){console.error(error);alert('อ่านข้อมูล Firebase ไม่สำเร็จ: '+error.message)}}else if(!sessionStorage.getItem('tripprep-auto-auth-attempted')){sessionStorage.setItem('tripprep-auto-auth-attempted','1');await signInWithRedirect(auth,provider)}});
}
startAuth().catch(error=>{console.error(error);button.textContent='☁ เชื่อม Firebase';button.title='คลิกเพื่อลองใหม่'});
