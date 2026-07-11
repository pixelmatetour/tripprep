import{initializeApp}from'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import{getAuth,GoogleAuthProvider,signInWithRedirect,getRedirectResult,onAuthStateChanged,setPersistence,browserLocalPersistence}from'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import{getFirestore,doc,setDoc,collection,getDocs}from'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';
const firebaseConfig={projectId:'pixelmate-tripprep-2026',appId:'1:826579773090:web:c63f13421a95132a23d9fb',storageBucket:'pixelmate-tripprep-2026.firebasestorage.app',apiKey:'AIzaSyBfKQLqiPxcrbW3Z4yldxJBVF-9eY4Wk3A',authDomain:'pixelmate-tripprep-2026.firebaseapp.com',messagingSenderId:'826579773090'};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),button=document.querySelector('#firebaseBtn'),provider=new GoogleAuthProvider();let user=null,saveTimer;
const sharedProjects=()=>collection(db,'workspaces','tripprep','projects');
async function pushProject(project){if(!user)return;await setDoc(doc(db,'workspaces','tripprep','projects',project.id),{name:project.name,updatedAt:project.updatedAt,data:project.data,lastEditedBy:user.email||user.uid},{merge:true})}
async function migrateOwnerProjects(){if(user.email!=='porbital@gmail.com')return;const shared=await getDocs(sharedProjects());if(!shared.empty)return;const personal=await getDocs(collection(db,'users',user.uid,'projects'));await Promise.all(personal.docs.map(item=>setDoc(doc(db,'workspaces','tripprep','projects',item.id),{...item.data(),lastEditedBy:user.email},{merge:true})))}
async function pullProjects(){await migrateOwnerProjects();const snapshot=await getDocs(sharedProjects());const records=snapshot.docs.map(item=>({id:item.id,...item.data()}));window.TripPrepBridge.mergeCloudProjects(records);await pushProject(window.TripPrepBridge.getCurrent())}
window.addEventListener('tripprep-local-save',event=>{clearTimeout(saveTimer);if(user)saveTimer=setTimeout(()=>pushProject(event.detail).catch(console.error),800)});
async function startAuth(){
 await setPersistence(auth,browserLocalPersistence);
 try{await getRedirectResult(auth)}catch(error){console.error('Firebase redirect sign-in failed',error);sessionStorage.removeItem('tripprep-auto-auth-attempted')}
 onAuthStateChanged(auth,async current=>{user=current;button.classList.toggle('connected',!!user);button.textContent=user?'☁ ซิงก์แล้ว':'☁ กำลังซิงก์';button.title=user?`ซิงก์ Firebase อัตโนมัติด้วย ${user.email||user.displayName||'บัญชี Google'}`:'ระบบกำลังเชื่อม Google อัตโนมัติ';if(user){sessionStorage.removeItem('tripprep-auto-auth-attempted');try{await pullProjects()}catch(error){console.error(error);button.textContent='☁ ซิงก์ไม่สำเร็จ';button.title=error.message}}else if(!sessionStorage.getItem('tripprep-auto-auth-attempted')){sessionStorage.setItem('tripprep-auto-auth-attempted','1');await signInWithRedirect(auth,provider)}});
}
startAuth().catch(error=>{console.error(error);button.textContent='☁ ซิงก์ไม่สำเร็จ';button.title=error.message});
