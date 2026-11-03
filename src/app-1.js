(function(){
document.documentElement.dir='rtl';document.documentElement.lang='ar';

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9);
const nf=x=>Number(x||0).toLocaleString('en-US',{maximumFractionDigits:1});
const money=x=>nf(x)+' ج.م';
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return ymd(d)};
const todayStr=()=>ymd(new Date());
const L='ar-EG-u-nu-latn';
const fmtDate=(s,o)=>{try{return new Intl.DateTimeFormat(L,o).format(parse(s))}catch(e){return s}};
const dayName=s=>fmtDate(s,{weekday:'long'});
const dayShort=s=>fmtDate(s,{weekday:'short'});
const monthName=ym=>fmtDate(ym+'-01',{month:'long',year:'numeric'});
const daysUntil=s=>Math.round((parse(s)-parse(todayStr()))/864e5);
const sum=(a,f)=>a.reduce((t,x)=>t+(+f(x)||0),0);
const ICON={
  home:'<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',
  work:'<path d="M4 6h16v14H4zM4 10h16M9 3v4M15 3v4"/>',
  study:'<path d="M5 4h13v16H7a2 2 0 0 1-2-2zM9 8h5"/>',
  money:'<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.6c0-1 1-1.8 2.5-1.8s2.5.8 2.5 1.8-1 1.6-2.5 1.9-2.5.9-2.5 1.9 1 1.8 2.5 1.8 2.5-.8 2.5-1.8"/>',
  health:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.600-7 10-7 10z"/>',
  stats:'<path d="M4 20V11M10 20V4M16 20v-6M2 20h20"/>'
};
const CHECK='<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.500"/></svg>';
const STAR='<svg viewBox="0 0 24 24"><path d="M12 3.500l2.600 5.400 5.900.8-4.300 4.100 1 5.800L12 16.800 6.800 19.600l1-5.800L3.500 9.700l5.900-.8z"/></svg>';

/* ---------- data ---------- */
const TYPES={
  h24:{l:'نوبة 24 ساعة',short:'24',s:8,h:24}
};
const CATS=['أكل وبيت','مواصلات','سكن وفواتير','شخصي','أسرة','دراسة وكورسات','أخرى'];
const DEF=()=>({v:1,updated:0,
  settings:{sleep:7,study:2},
  hospitals:[{id:'h1',name:'مستشفى 1',r12:0,r24:0},{id:'h2',name:'مستشفى 2',r12:0,r24:0},{id:'h3',name:'مستشفى 3',r12:0,r24:0}],
  shifts:[],cases:[],tasks:[],appts:[],
  topics:['التهوية الميكانيكية','الصدمة وإدارة الدورة الدموية','اضطرابات الحمض والقاعدة','الإنتان والصدمة الإنتانية','ARDS','الفشل الكلوي الحاد والغسيل','التهدئة والتسكين والهذيان','التغذية في العناية المركزة','الإنعاش القلبي الرئوي ACLS'].map((n,i)=>({id:'t'+i,name:n,st:0})),
  sessions:[],goals:[],income:[],expenses:[],commits:[],savings:[],
  capital:[{id:'k1',name:'شهادة البنك',base:0},{id:'k2',name:'مدخرات فوري',base:0},{id:'k3',name:'ذهب',base:0},{id:'k4',name:'استثمار ثاندر',base:0}],
  habits:[{id:'b1',name:'شرب ماء كفاية'},{id:'b2',name:'حركة 15 دقيقة أو أكتر'},{id:'b3',name:'مذاكرة'},{id:'b4',name:'قراءة'}],
  habitLog:{},health:{},family:[],reading:[],journal:{}});
const LS='lifeos.v1';
let S;
try{const raw=localStorage.getItem(LS);S=raw?Object.assign(DEF(),JSON.parse(raw)):DEF()}catch(e){S=DEF()}
const norm=()=>S.shifts.forEach(s=>{s.type='h24'});norm();
const TABS=[['home','الرئيسية'],['work','الشغل والنوبات'],['study','التطور المهني'],['money','الفلوس'],['health','الصحة والحياة'],['stats','الإحصائيات']];
const MIN_YM='2026-11';
const ui={tab:'home',ym:todayStr().slice(0,7)<MIN_YM?MIN_YM:todayStr().slice(0,7),sheet:null,hid:null};
const h0=(location.hash||'').slice(1);if(TABS.some(t=>t[0]===h0))ui.tab=h0;

/* ---------- persistence ---------- */
let dbDoc=null,writing=false,dirty=false,saveT=0;
function setSync(k){const el=$('#sync');if(!el)return;el.className='sync'+(k==='saved'?' ok':'');el.textContent=k==='saved'?'محفوظ ومتزامن':k==='saving'?'بيحفظ...':'محفوظ على الجهاز فقط'}
let syncState='local';
function save(){
  S.updated=Date.now();
  try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}
  clearTimeout(saveT);
  if(dbDoc){syncState='saving';saveT=setTimeout(pushRemote,700)}
  if(syncCode)cloudSave();
}
async function pushRemote(){
  if(!dbDoc)return;
  if(writing){dirty=true;return}
  writing=true;
  try{await dbDoc.set({json:JSON.stringify(S),updated:S.updated});syncState='saved'}catch(e){syncState='local'}
  writing=false;setSync(syncState);
  if(dirty){dirty=false;pushRemote()}
}
const editing=()=>/INPUT|TEXTAREA|SELECT/.test(document.activeElement&&document.activeElement.tagName||'');
async function initDb(){
  try{
    if(!(window.claude&&window.claude.use))return;
    const [db,user]=await Promise.all([window.claude.use('db'),window.claude.use('user')]);
    if(!db||!user)return;
    const id=await user.id();if(!id)return;
    dbDoc=db.collection('data/users/'+id).doc('lifeos');
    const to=setTimeout(()=>{syncState='local';setSync('local')},10000);
    dbDoc.onSnapshot(snap=>{
      if(!snap.metadata.fromCache)clearTimeout(to);
      if(snap.metadata.hasPendingWrites)return;
      if(snap.exists){
        let r=null;try{r=JSON.parse(snap.data().json)}catch(e){}
        if(r&&(r.updated||0)>(S.updated||0)&&!editing()){
          S=Object.assign(DEF(),r);norm();
          try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}
          render();
        }else if(r&&(r.updated||0)<(S.updated||0)&&!snap.metadata.fromCache){pushRemote();return}
        if(!snap.metadata.fromCache){syncState='saved';setSync('saved')}
      }else if(!snap.metadata.fromCache){
        syncState='saved';setSync('saved');
        if(S.updated)pushRemote();
      }
    },()=>{syncState='local';setSync('local')});
  }catch(e){}
}

/* ---------- cloud sync (Supabase RPC, secret code) ---------- */
const SB='https://fwxpuejpnyylqjwfmdhh.supabase.co/rest/v1/rpc/',SBK='sb_publishable_WRpo_LiP2Po7KBhLanEF7g_fWD0LBLO',LSC='lifeos.sync';
let syncCode='';try{syncCode=localStorage.getItem(LSC)||''}catch(e){}
const rpc=(fn,body)=>fetch(SB+fn,{method:'POST',headers:{apikey:SBK,'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()});
let cT=0,cBusy=false,cDirty=false;
function cloudSave(){if(!syncCode)return;syncState='saving';clearTimeout(cT);cT=setTimeout(cloudPush,900)}
async function cloudPush(){
  if(!syncCode)return;
  if(cBusy){cDirty=true;return}
  cBusy=true;
  try{await rpc('lifeos_put',{p_code:syncCode,p_data:S});syncState='saved'}catch(e){syncState='local'}
  cBusy=false;setSync(syncState);
  if(cDirty){cDirty=false;cloudPush()}
}
async function cloudPull(){
  if(!syncCode||cBusy)return;
  try{
    const r=await rpc('lifeos_get',{p_code:syncCode});
    if(!r||!r.data){if(S.updated)await cloudPush();return}
    const ru=+r.updated||0;
    if(ru>(S.updated||0)){
      if(editing())return;
      S=Object.assign(DEF(),r.data);norm();
      try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}
      render();
    }else if(ru<(S.updated||0)){await cloudPush();return}
    syncState='saved';setSync('saved');
  }catch(e){syncState='local';setSync('local')}
}
async function joinCode(c,fresh){
  try{
    const r=fresh?null:await rpc('lifeos_get',{p_code:c});
    syncCode=c;try{localStorage.setItem(LSC,c)}catch(e){}
    if(r&&r.data){
      try{localStorage.setItem('lifeos.prejoin',JSON.stringify(S))}catch(e){}
      S=Object.assign(DEF(),r.data);norm();
      try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}
      syncState='saved';render();toast('اتربط وتم تحميل بياناتك');
    }else{
      if(!S.updated)S.updated=Date.now();
      await cloudPush();render();toast(fresh?'اتفعلت المزامنة':'الكود جديد. رفعت بيانات الجهاز');
    }
  }catch(e){syncCode='';try{localStorage.removeItem(LSC)}catch(x){}toast('مقدرتش أتصل بالسيرفر. جرب تاني')}
}

/* ---------- domain logic ---------- */
const hosp=id=>S.hospitals.find(h=>h.id===id);
const hname=id=>{const h=hosp(id);return h?h.name:'—'};
const earn=s=>{const h=hosp(s.hid);if(!h)return 0;return +h.r24||0};
const shiftsOn=d=>S.shifts.filter(s=>s.date===d);
const recvYm=s=>(s.paidAt||s.date).slice(0,7);
const recvIn=ym=>S.shifts.filter(s=>s.paid&&recvYm(s)===ym);
const carryList=ym=>S.shifts.filter(s=>!s.paid&&s.date.slice(0,7)<ym);
function shiftHoursOn(date){
  const ds=parse(date),de=parse(addDays(date,1));let tot=0;
  for(const sd of [addDays(date,-1),date]){
    for(const s of shiftsOn(sd)){
      const T=TYPES[s.type],d=parse(sd);
      const st=new Date(d.getFullYear(),d.getMonth(),d.getDate(),T.s);
      const en=new Date(st.getTime()+T.h*36e5);
      tot+=Math.max(0,Math.min(en,de)-Math.max(st,ds))/36e5;
    }
  }
  return Math.min(24,tot);
}
function planFor(date){
  const sh=shiftHoursOn(date),free=24-sh,rest=Math.max(0,free-3);
  const need=+S.settings.sleep||7,study=Math.min(+S.settings.study||0,Math.max(0,rest-need));
  return{sh,free,rest,study,enough:rest>=need,gap:need-rest};
}
const hidx=id=>Math.max(0,S.hospitals.findIndex(h=>h.id===id));
const chips=(list)=>list.map(s=>`<span class="chip hc${hidx(s.hid)}">${hidx(s.hid)+1}</span>`).join(' ');
const monthShifts=ym=>S.shifts.filter(s=>s.date.startsWith(ym));
const topicProgress=()=>{const n=S.topics.length;return n?Math.round(sum(S.topics,t=>t.st===2?1:t.st===1?.5:0)/n*100):0};
const studyWeek=()=>{const t=todayStr(),from=addDays(t,-6);return sum(S.sessions.filter(x=>x.date>=from&&x.date<=t),x=>x.h)};
const monthIncome=ym=>sum(recvIn(ym),earn)+sum(S.income.filter(i=>i.date.startsWith(ym)),i=>i.amt);
const monthSpend=ym=>sum(S.expenses.filter(e=>e.date.startsWith(ym)),e=>e.amt);
const commitTotal=()=>sum(S.commits,c=>c.amt);
const duesAll=()=>sum(S.shifts.filter(s=>!s.paid),earn);
const habitsToday=()=>S.habitLog[todayStr()]||[];

/* ---------- views ---------- */
const card=(t,body,sm)=>`<section class="card"><h2>${t}${sm?`<small>${sm}</small>`:''}</h2>${body}</section>`;
const empty=t=>`<p class="empty">${t}</p>`;
const del=(k,id)=>`<button class="x" data-a="del" data-k="${k}" data-id="${id}" aria-label="حذف">×</button>`;
const chk=(on,a,attrs)=>`<button class="chk${on?' on':''}" data-a="${a}" ${attrs} aria-pressed="${!!on}" aria-label="تم">${CHECK}</button>`;
const hospOpts=sel=>S.hospitals.map(h=>`<option value="${h.id}"${h.id===sel?' selected':''}>${esc(h.name)}</option>`).join('');
const monthNav=()=>`<div class="monthbar"><button class="icn" data-a="ym" data-n="-1" aria-label="الشهر السابق"${ui.ym<=MIN_YM?' disabled':''}>${ico('prev')}</button><strong>${monthName(ui.ym)}</strong><button class="icn" data-a="ym" data-n="1" aria-label="الشهر التالي">${ico('next')}</button></div>`;

function weekStrip(){
  const t=todayStr();let h='';
  for(let i=0;i<7;i++){
    const d=addDays(t,i),p=planFor(d),sh=shiftsOn(d);
    h+=`<div class="wd${i===0?' today':''}"><span>${dayShort(d)}</span><b>${parse(d).getDate()}</b><span>${sh.length?chips(sh):'<span class="muted">حر</span>'}</span><span class="${p.enough?'':'low'}">${nf(p.rest)}س</span></div>`;
  }
  return `<div class="week">${h}</div>`;
}

const IC={
  building:'<path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M14 9h5a1 1 0 0 1 1 1v11M2 21h20M8 8h2M8 12h2M8 16h2M17 13h1M17 17h1"/>',
  moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  run:'<circle cx="15" cy="4.5" r="2"/><path d="M10 21l2.5-6-2.5-2 1-4 3.5-1 2.5 3 3 .5M9 12l-3 1.5"/>',
  scale:'<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M8.5 10a3.5 3.5 0 0 1 7 0M12 10l1.5-2"/>',
  flame:'<path d="M12 21c4 0 6.5-2.6 6.5-6 0-2.5-1.5-4.5-3-6-.5 2-1.5 3-3 3 0-3-1-5.5-3.5-8C8 7 5.5 10 5.5 15c0 3.4 2.5 6 6.5 6z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  book:'<path d="M5 4h13v16H7a2 2 0 0 1-2-2zM9 8h5"/>',
  prev:'<path d="M9 6l6 6-6 6"/>',
  next:'<path d="M15 6l-6 6 6 6"/>'
};
const ico=k=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg>`;
const lastN=n=>Array.from({length:n},(_,i)=>addDays(todayStr(),i-(n-1)));
const hv=(d,k)=>+(S.health[d]&&S.health[d][k])||0;
const avgOf=a=>{const x=a.filter(v=>v>0);return x.length?sum(x,v=>v)/x.length:0};
function minibars(vals){
  const mx=Math.max(1,...vals);
  return `<div class="mb">${vals.map(v=>`<i style="height:${v>0?Math.max(14,Math.round(v/mx*100)):8}%;${v>0?'':'opacity:.25'}"></i>`).join('')}</div>`;
}
function ring(pct){
  const r=34,c=2*Math.PI*r;
  return `<svg viewBox="0 0 84 84" class="ring" role="img" aria-label="${pct}%"><circle cx="42" cy="42" r="${r}" fill="none" stroke="var(--surface2)" stroke-width="8"/><circle cx="42" cy="42" r="${r}" fill="none" stroke="var(--accent)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(c*pct/100).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 42 42)"/><text x="42" y="47" text-anchor="middle" font-size="17" font-weight="700" fill="var(--ink)">${pct}%</text></svg>`;
}

function vHome(){
  const t=todayStr(),p=planFor(t),sh=shiftsOn(t);
  const open=S.tasks.filter(x=>!x.done&&x.date<=t).sort((a,b)=>(b.star?1:0)-(a.star?1:0));
  const doneT=S.tasks.filter(x=>x.done&&x.date===t);
  const top=open.filter(x=>x.star).slice(0,3);
  const appts=S.appts.filter(a=>a.date>=t).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,5);
  const hr=new Date().getHours();
  const greet=hr<5?'سهران؟':hr<12?'صباح الخير':hr<18?'نهارك سعيد':'مساء الخير';
  const taskRow=x=>`<li>${chk(x.done,'task',`data-id="${x.id}"`)}<span class="grow ${x.done?'done':''}">${esc(x.text)}${x.date<t&&!x.done?' <span class="pill warn">متأخرة</span>':''}</span><button class="star${x.star?' on':''}" data-a="star" data-id="${x.id}" aria-label="أولوية">${STAR}</button>${del('tasks',x.id)}</li>`;
  const todayAll=S.tasks.filter(x=>x.date<=t&&(!x.done||x.date===t));
  const tot=todayAll.length+S.habits.length,dn=todayAll.filter(x=>x.done).length+habitsToday().length;
  const pct=tot?Math.round(dn/tot*100):0;
  const stv=lastN(7).map(d=>sum(S.sessions.filter(s=>s.date===d),s=>s.h));
  const m=t.slice(0,7),net=monthIncome(m)-monthSpend(m);
  const tiles=[0,1,2].map(i=>top[i]
    ?`<div class="ptile"><span class="badge c${i}">${i+1}</span><div class="pt">${esc(top[i].text)}</div>${chk(false,'task',`data-id="${top[i].id}"`)}</div>`
    :`<div class="ptile idle"><span class="badge" style="background:var(--surface2);color:var(--muted)">${i+1}</span><div class="pt">فاضية. علّم مهمة بالنجمة</div></div>`).join('');
  const strip=Array.from({length:7},(_,i)=>{
    const d=addDays(t,i),pl=planFor(d),s=shiftsOn(d);
    return `<div class="ds${i===0?' today':''}"><span>${dayShort(d)}</span><b class="num">${parse(d).getDate()}</b><span class="dots">${s.map(x=>`<i class="dot hc${hidx(x.hid)}"></i>`).join('')}</span><small class="${pl.enough?'':'low'}">${nf(pl.rest)}س</small></div>`;
  }).join('');
  return `
  <header class="top"><div><h1>${greet} يا دكتور</h1><p>${dayName(t)} ${fmtDate(t,{day:'numeric',month:'long'})}</p></div><span class="sync" id="sync"></span></header>
  <div class="grid">
    <section class="card hero"><div class="hero-n num">${nf(p.rest)}</div><div class="hero-l">ساعة راحة متاحة</div>
      <div class="row wrap" style="justify-content:center;margin-top:14px">${sh.length?sh.map(s=>`<span class="pill">${esc(hname(s.hid))} · ${TYPES[s.type].l}</span>`).join(''):'<span class="pill">يوم حر من النوبات</span>'}${p.sh>0&&!sh.length?'<span class="pill">كمّلة نوبة امبارح</span>':''}${p.enough?`<span class="pill good">النوم ${nf(S.settings.sleep)} ساعات متاح</span>`:`<span class="pill bad">ناقص ${nf(p.gap)} ساعة عن هدف النوم</span>`}${p.study>0?`<span class="pill">مذاكرة مقترحة ${nf(p.study)} س</span>`:''}</div></section>
    <div class="ptiles">${tiles}</div>
    ${card('خطة الأسبوع','<p class="sub">النقط نوبات بلون المستشفى، والرقم ساعات الراحة المتاحة (الأحمر أقل من هدف نومك)</p><div class="dstrip">'+strip+'</div>')}
    <div class="duo">
      <section class="card tile"><h2>إنجاز اليوم</h2>${ring(pct)}<p class="sub" style="margin:0">${dn} من ${tot}</p></section>
      <section class="card tile"><h2>المذاكرة</h2><div class="big num">${nf(sum(stv,x=>x))}<span style="font-size:14px;font-weight:500"> س</span></div>${minibars(stv)}<p class="sub" style="margin:0">آخر 7 أيام</p></section>
    </div>
    ${card('مهام اليوم',(open.length||doneT.length?`<ul class="list" style="margin-top:6px">${open.map(taskRow).join('')}${doneT.map(taskRow).join('')}</ul>`:empty('مفيش مهام لسه. اكتب أول واحدة تحت.'))+
      `<form class="add" data-f="task"><input id="qt" name="text" placeholder="مهمة جديدة..." required autocomplete="off"><button class="btn" type="submit">إضافة</button></form>`,`${open.length} مفتوحة`)}
    ${card('المواعيد القادمة',(appts.length?`<ul class="list" style="margin-top:6px">${appts.map(a=>`<li><div class="num" style="min-width:76px"><b>${fmtDate(a.date,{day:'numeric',month:'short'})}</b><div class="muted" style="font-size:12px">${esc(a.time||'')}</div></div><span class="grow">${esc(a.title)}</span>${del('appts',a.id)}</li>`).join('')}</ul>`:empty('مفيش مواعيد قادمة.'))+
      `<form class="add" data-f="appt"><input type="date" name="date" value="${t}" required aria-label="التاريخ"><input type="time" name="time" aria-label="الوقت"><input name="title" class="wide" placeholder="عنوان الموعد" required autocomplete="off"><button class="btn" type="submit">إضافة</button></form>`)}
    ${card('الفلوس هذا الشهر',`<div class="big num" style="color:${net<0?'var(--bad)':'var(--ink)'}">${money(net)}</div><p class="sub" style="margin:2px 0 0">المستلم فعليًا − المصروفات</p><div class="stats"><div class="stat"><b>${money(capTotal())}</b><span>رأس المال</span></div><div class="stat"><b>${money(duesAll())}</b><span>مستحقات لسه ما اتسلمتش</span></div></div>`)}
    ${card('المزامنة بين الأجهزة',syncCode
      ?`<p class="sub">المزامنة شغالة. على أي جهاز تاني الصق نفس الكود في خانة الربط.</p><div class="row"><input readonly dir="ltr" value="${esc(syncCode)}" aria-label="كود المزامنة"><button class="btn ghost sm" data-a="syncCopy">نسخ</button></div><div class="row wrap" style="margin-top:10px"><button class="btn ghost sm" data-a="backup">نسخة احتياطية</button><button class="btn ghost sm" data-a="syncOff">إيقاف على الجهاز ده</button></div>`
      :`<p class="sub">فعّل المزامنة عشان بياناتك تتحفظ وتظهر على كل أجهزتك.</p><button class="btn" data-a="syncNew">تفعيل المزامنة (كود جديد)</button><div class="add"><input id="sc" dir="ltr" placeholder="عندك كود من جهاز تاني؟ الصقه هنا" autocomplete="off"><button class="btn ghost" data-a="syncSet">ربط</button></div><div class="row" style="margin-top:10px"><button class="btn ghost sm" data-a="backup">نسخة احتياطية</button></div>`)}
  </div>`;
}

function vWork(){
  const ym=ui.ym,ms=monthShifts(ym),t=todayStr();
  const sel=hosp(ui.hid)?ui.hid:(S.hospitals[0]||{}).id;
  const first=parse(ym+'-01'),lead=(first.getDay()+1)%7,dim=new Date(first.getFullYear(),first.getMonth()+1,0).getDate();
  let cells=['سبت','أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة'].map(x=>`<div class="h">${x}</div>`).join('');
  for(let i=0;i<lead;i++)cells+='<div class="blank"></div>';
  for(let d=1;d<=dim;d++){
    const ds=ym+'-'+pad(d),sh=shiftsOn(ds);
    cells+=`<button class="d${ds===t?' today':''}" data-a="shiftDay" data-d="${ds}" aria-label="${dayName(ds)} ${d}"><span class="n">${d}</span><span class="dots">${sh.map(s=>`<i class="dot hc${hidx(s.hid)}"></i>`).join('')}</span></button>`;
  }
  const hrs=sum(ms,s=>TYPES[s.type].h);
  const carry=carryList(ym);
  const rows=S.hospitals.map(h=>{
    const l=ms.filter(s=>s.hid===h.id),e=sum(l,earn),cr=sum(carry.filter(s=>s.hid===h.id),earn),due=sum(l.filter(s=>!s.paid),earn)+cr;
    return `<tr><td>${esc(h.name)}</td><td>${l.length}</td><td>${money(e)}</td><td>${money(cr)}</td><td>${money(due)}</td><td>${l.length||cr?`<button class="btn ghost sm" data-a="payAll" data-id="${h.id}">${due>0?'تم الاستلام':'تراجع'}</button>`:''}</td></tr>`;
  }).join('');
  const tN=ms.length,tE=sum(ms,earn),tC=sum(carry,earn),tD=sum(ms.filter(s=>!s.paid),earn)+tC,tR=sum(recvIn(ym),earn);
  const cases=[...S.cases].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,25);
  const cm=S.cases.filter(c=>c.date.startsWith(ym));
  return `
  <header class="top"><div><h1>الشغل والنوبات</h1><p>اختار المستشفى وبعدين اضغط على اليوم</p></div><span class="sync" id="sync"></span></header>
  <div class="grid">
    ${monthNav()}
    <div class="hgrid" role="group" aria-label="اختيار المستشفى">${S.hospitals.map((h,i)=>`<button class="htile hc${i}${h.id===sel?' on':''}" data-a="hosp" data-id="${h.id}" aria-pressed="${h.id===sel}">${ico('building')}<span>${esc(h.name)}</span></button>`).join('')}</div>
    ${card('جدول النوبات',`<div class="cal">${cells}</div>
      <div class="legend">${S.hospitals.map((h,i)=>`<span><span class="chip hc${i}">${i+1}</span> ${esc(h.name)}</span>`).join('')}<span>كل نوبة 24 ساعة (8ص–8ص)</span></div>
      <div class="stats"><div class="stat"><b>${ms.length}</b><span>نوبة</span></div><div class="stat"><b>${nf(hrs)}</b><span>ساعة شغل</span></div></div>`)}
    ${card('المستحقات حسب المكان',`<p class="sub">محسوبة من سعر النوبة لكل مستشفى. اللي ما اتسلمش بيتحسب مرحّل للشهر اللي بعده.</p><div class="scroll-x"><table><thead><tr><th>المستشفى</th><th>نوبات</th><th>حساب الشهر</th><th>مرحّل</th><th>لسه</th><th></th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td>الإجمالي</td><td>${tN}</td><td>${money(tE)}</td><td>${money(tC)}</td><td>${money(tD)}</td><td></td></tr></tfoot></table></div>
      <div class="stats"><div class="stat"><b>${money(tE)}</b><span>إجمالي حساب الشهر</span></div><div class="stat"><b>${money(tR)}</b><span>اتسلّم في الشهر ده</span></div><div class="stat"><b>${money(tD)}</b><span>لسه متبقي (شامل المرحّل ${money(tC)})</span></div></div>`,monthName(ym))}
    ${card('المستشفيات وأسعار النوبات',`<ul class="list">${S.hospitals.map(h=>`<li style="flex-wrap:wrap"><input class="grow" style="flex:1 1 130px" value="${esc(h.name)}" data-c="hname" data-id="${h.id}" aria-label="اسم المستشفى"><label class="f" style="flex:1 1 90px">سعر النوبة (24 ساعة)<input type="number" inputmode="decimal" min="0" step="any" value="${h.r24||''}" placeholder="0" data-c="r24" data-id="${h.id}"></label>${del('hospitals',h.id)}</li>`).join('')}</ul>
      <form class="add" data-f="hospital"><input name="name" placeholder="مستشفى جديدة" required autocomplete="off"><button class="btn" type="submit">إضافة</button></form>`)}
    ${card('سجل الحالات والإجراءات',`<p class="sub">${cm.length} حالة في ${monthName(ym)}</p>
      <form class="add" data-f="case" style="margin-top:0"><input type="date" name="date" value="${t}" required aria-label="التاريخ"><select name="hid" aria-label="المستشفى">${hospOpts('')}</select><input name="text" class="wide" placeholder="الحالة (مثال: صدمة إنتانية، تنفس صناعي)" required autocomplete="off"><input name="proc" class="wide" placeholder="الإجراء (اختياري)" autocomplete="off"><button class="btn" type="submit">تسجيل</button></form>
      ${cases.length?`<ul class="list" style="margin-top:8px">${cases.map(c=>`<li><div class="grow"><div>${esc(c.text)}</div><div class="muted" style="font-size:12.5px">${fmtDate(c.date,{day:'numeric',month:'short'})} · ${esc(hname(c.hid))}${c.proc?' · <b>'+esc(c.proc)+'</b>':''}</div></div>${del('cases',c.id)}</li>`).join('')}</ul>`:empty('لسه ما سجلتش حالات.')}`)}
  </div>`;
}

function vStudy(){
  const t=todayStr(),stl=['لسه','شغال عليه','خلص'],stc=['','warn','good'];
  const days=[];for(let i=6;i>=0;i--){const d=addDays(t,-i);days.push([d,sum(S.sessions.filter(s=>s.date===d),s=>s.h)])}
  const mx=Math.max(1,...days.map(d=>d[1]));
  const remaining=S.topics.filter(x=>x.st!==2);
  const sess=[...S.sessions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8);
  const total=sum(S.sessions,s=>s.h);
  return `
  <header class="top"><div><h1>التطور المهني</h1><p>المذاكرة والكورسات والأهداف</p></div><span class="sync" id="sync"></span></header>
  <div class="grid">
    ${card('تقدمك',`<div class="row between wrap"><div><div class="big num">${topicProgress()}%</div><div class="muted" style="font-size:13px">من الموضوعات خلصت (${S.topics.filter(x=>x.st===2).length} من ${S.topics.length})</div></div><div style="text-align:end"><div class="big num">${nf(studyWeek())}</div><div class="muted" style="font-size:13px">ساعة آخر 7 أيام</div></div></div>
      <div class="bar" style="margin-top:10px"><i style="width:${topicProgress()}%"></i></div>
      <div class="days7">${days.map(([d,v])=>`<div><span class="num">${v?nf(v):''}</span><i style="height:${Math.round(v/mx*52)+2}px;${v?'':'opacity:.25'}"></i><span>${dayShort(d)}</span></div>`).join('')}</div>
      <label class="f" style="margin-top:12px;max-width:220px">هدف المذاكرة اليومي (ساعات)<input type="number" min="0" max="8" step="0.5" value="${S.settings.study}" data-c="setting" data-k="study"></label>`)}
    ${card('تسجيل ساعات مذاكرة',`<form class="add" data-f="session" style="margin-top:0"><input type="date" name="date" value="${t}" required aria-label="التاريخ"><input type="number" name="h" min="0.25" max="16" step="0.25" inputmode="decimal" placeholder="ساعات" required aria-label="الساعات"><select name="topic" class="wide" aria-label="الموضوع"><option value="">موضوع عام</option>${S.topics.map(x=>`<option value="${esc(x.name)}">${esc(x.name)}</option>`).join('')}</select><button class="btn" type="submit">تسجيل</button></form>
      ${sess.length?`<ul class="list" style="margin-top:8px">${sess.map(s=>`<li><span class="num" style="min-width:64px">${fmtDate(s.date,{day:'numeric',month:'short'})}</span><span class="grow">${esc(s.topic||'مذاكرة عامة')}</span><b class="num">${nf(s.h)} س</b>${del('sessions',s.id)}</li>`).join('')}</ul><p class="sub" style="margin:8px 0 0">الإجمالي المسجل: ${nf(total)} ساعة</p>`:empty('سجّل أول جلسة مذاكرة.')}`)}
    ${card('الموضوعات المتبقية',`<p class="sub">اضغط على الحالة عشان تغيّرها (${remaining.length} متبقي)</p><ul class="list">${S.topics.map(x=>`<li><span class="grow ${x.st===2?'done':''}">${esc(x.name)}</span><button class="pill ${stc[x.st]}" style="border:0;cursor:pointer" data-a="topic" data-id="${x.id}">${stl[x.st]}</button>${del('topics',x.id)}</li>`).join('')}</ul>
      <form class="add" data-f="topic"><input name="name" placeholder="موضوع جديد" required autocomplete="off"><button class="btn" type="submit">إضافة</button></form>`)}
    ${card('الكورسات والشهادات والأهداف',(S.goals.length?`<ul class="list" style="margin-top:6px">${S.goals.map(g=>`<li>${chk(g.done,'plain',`data-k="goals" data-id="${g.id}"`)}<span class="grow ${g.done?'done':''}">${esc(g.text)}${g.due?` <span class="muted" style="font-size:12.5px">· ${fmtDate(g.due,{day:'numeric',month:'short',year:'numeric'})}</span>`:''}</span>${del('goals',g.id)}</li>`).join('')}</ul>`:empty('أضف كورس أو شهادة أو هدف مهني.'))+
      `<form class="add" data-f="goal"><input name="text" class="wide" placeholder="مثال: كورس FCCS، امتحان البورد" required autocomplete="off"><input type="date" name="due" aria-label="الموعد"><button class="btn" type="submit">إضافة</button></form>`)}
  </div>`;
}

const capAdded=id=>sum(S.savings.filter(x=>(x.bucket||'')===id),x=>x.amt);
const capLoose=()=>sum(S.savings.filter(x=>!x.bucket||!S.capital.some(k=>k.id===x.bucket)),x=>x.amt);
const capTotal=upTo=>sum(S.capital,k=>k.base)+sum(S.savings.filter(x=>!upTo||(x.date||'')<=upTo),x=>x.amt);
function vMoney(){
  const ym=ui.ym,t=todayStr();
  const shiftIn=monthShifts(ym),inc=S.income.filter(i=>i.date.startsWith(ym));
  const ex=S.expenses.filter(e=>e.date.startsWith(ym)).sort((a,b)=>b.date.localeCompare(a.date));
  const shiftSum=sum(recvIn(ym),earn),incSum=sum(inc,i=>i.amt),spend=sum(ex,e=>e.amt);
  const net=shiftSum+incSum-spend;
  const byCat=CATS.map(c=>[c,sum(ex.filter(e=>e.cat===c),e=>e.amt)]).filter(x=>x[1]>0);
  const cmax=Math.max(1,...byCat.map(x=>x[1]));
  const sv=sum(S.savings.filter(x=>x.kind==='ادخار'),x=>x.amt),iv=sum(S.savings.filter(x=>x.kind==='استثمار'),x=>x.amt);
  const perH=S.hospitals.map(h=>[h.name,sum(recvIn(ym).filter(s=>s.hid===h.id),earn)]).filter(x=>x[1]>0);
  return `
  <header class="top"><div><h1>الفلوس</h1><p>الدخل والمصروفات والمدخرات</p></div><span class="sync" id="sync"></span></header>
  ${monthNav()}
  <div class="grid">
    ${card('صافي الشهر',`<div class="big num" style="color:${net<0?'var(--bad)':'var(--ink)'}">${money(net)}</div><p class="sub" style="margin:2px 0 0">المستلم فعليًا − المصروفات</p>
      <div class="stats"><div class="stat"><b>${money(shiftSum+incSum)}</b><span>المستلم فعليًا</span></div><div class="stat"><b>${money(spend)}</b><span>المصروفات</span></div><div class="stat"><b>${money(duesAll())}</b><span>مستحقات لسه ما اتسلمتش</span></div></div>`,monthName(ym))}
    ${card('الدخل',`<ul class="list">${perH.map(([n,v])=>`<li><span class="grow">نوبات ${esc(n)} (مستلمة)</span><b class="num">${money(v)}</b></li>`).join('')}${inc.map(i=>`<li><span class="grow">${esc(i.src)} <span class="muted" style="font-size:12.5px">${fmtDate(i.date,{day:'numeric',month:'short'})}</span></span><b class="num">${money(i.amt)}</b>${del('income',i.id)}</li>`).join('')}</ul>${perH.length||inc.length?'':empty('دخل النوبات بيظهر هنا بعد ما تدوس "تم الاستلام" على النوبة في تبويب الشغل.')}
      <form class="add" data-f="income"><input type="date" name="date" value="${t}" required aria-label="التاريخ"><input name="src" placeholder="مصدر دخل تاني" required autocomplete="off"><input type="number" name="amt" min="0" step="any" inputmode="decimal" placeholder="المبلغ" required><button class="btn" type="submit">إضافة</button></form>`)}
    ${card('المصروفات',(byCat.length?byCat.map(([c,v])=>`<div class="catbar"><span>${c}</span><div class="bar"><i style="width:${Math.round(v/cmax*100)}%"></i></div><b class="num">${nf(v)}</b></div>`).join(''):'')+
      `<form class="add" data-f="expense"><input type="date" name="date" value="${t}" required aria-label="التاريخ"><select name="cat" aria-label="التصنيف">${CATS.map(c=>`<option>${c}</option>`).join('')}</select><input type="number" name="amt" min="0" step="any" inputmode="decimal" placeholder="المبلغ" required><input name="note" placeholder="ملاحظة" autocomplete="off"><button class="btn" type="submit">إضافة</button></form>`+
      (ex.length?`<ul class="list" style="margin-top:8px">${ex.slice(0,15).map(e=>`<li><span class="num muted" style="min-width:48px;font-size:12.5px">${fmtDate(e.date,{day:'numeric',month:'short'})}</span><span class="grow">${esc(e.note||e.cat)} <span class="muted" style="font-size:12.5px">${e.note?esc(e.cat):''}</span></span><b class="num">${money(e.amt)}</b>${del('expenses',e.id)}</li>`).join('')}</ul>`:empty('مفيش مصروفات متسجلة الشهر ده.')))}
    ${(()=>{
      const total=capTotal(),addedM=sum(S.savings.filter(x=>(x.date||'').startsWith(ym)),x=>x.amt),loose=capLoose();
      const yms6=[];{const b0=new Date();for(let i=5;i>=0;i--){const d=new Date(b0.getFullYear(),b0.getMonth()-i,1);yms6.push(d.getFullYear()+'-'+pad(d.getMonth()+1))}}
      const cum=yms6.map(y=>capTotal(y+'-31')),add6=yms6.map(y=>sum(S.savings.filter(x=>(x.date||'').startsWith(y)),x=>x.amt));
      const tile=(k,i)=>{const v=k.base+capAdded(k.id);return `<div class="mtile c${i%3}"><span class="mt-top"><span>${esc(k.name)}</span></span><input class="mt-in" type="number" step="100" min="0" inputmode="decimal" value="${v||''}" placeholder="0" data-c="capval" data-id="${k.id}" aria-label="${esc(k.name)}"><span class="mt-u">ج.م · ${total?Math.round(v/total*100):0}%</span>${del('capital',k.id)}</div>`};
      return card('رأس المال',`<div class="row between wrap"><div><div class="big num">${money(total)}</div><div class="muted" style="font-size:13px">مجموع كل الأوعية</div></div><span class="pill ${addedM>0?'good':''}">${addedM>0?'+':''}${money(addedM)} في ${monthName(ym)}</span></div>
        <div class="mgrid" style="margin-top:14px">${S.capital.map(tile).join('')}${loose>0?`<div class="mtile c2"><span class="mt-top"><span>غير محدد</span></span><b class="mt-in num">${nf(loose)}</b><span class="mt-u">ج.م</span></div>`:''}</div>
        <p class="sub" style="margin:10px 0 0">اضغط على أي قيمة وعدّلها. أي مدخرات بتضيفها بتزيد على الوعاء اللي اخترته.</p>
        <form class="add" data-f="bucket"><input name="name" placeholder="وعاء جديد (مثال: عقار)" required autocomplete="off"><button class="btn ghost" type="submit">إضافة وعاء</button></form>
        <h3 class="dh" style="margin-top:20px">نمو رأس المال <small>آخر 6 شهور</small></h3>${lineChart(yms6.map(y=>fmtDate(y+'-01',{month:'short'})),[{vals:cum,color:'var(--accent)'}],{aria:'نمو رأس المال'})}
        <div class="scroll-x"><table><thead><tr><th>الشهر</th><th>أضفت</th><th>رأس المال</th></tr></thead><tbody>${yms6.map((y,i)=>[y,i]).reverse().map(([y,i])=>`<tr><td>${monthName(y)}</td><td>${money(add6[i])}</td><td>${money(cum[i])}</td></tr>`).join('')}</tbody></table></div>`);
    })()}
    ${(()=>{
      const t0=todayStr(),list=S.savings.filter(x=>(x.date||'').startsWith(ym)).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
      return card('إضافة مدخرات',`<p class="sub">حدد بتدخر فين، والمبلغ بيتضاف على رأس المال.</p>
        <form class="add" data-f="saving" style="margin-top:0"><input type="date" name="date" value="${t0}" required aria-label="التاريخ"><select name="bucket" aria-label="بتدخر فين">${S.capital.map(k=>`<option value="${k.id}">${esc(k.name)}</option>`).join('')}</select><input type="number" name="amt" min="0" step="any" inputmode="decimal" placeholder="المبلغ" required><input name="note" placeholder="ملاحظة (اختياري)" autocomplete="off"><button class="btn" type="submit">إضافة</button></form>
        ${list.length?`<ul class="list" style="margin-top:8px">${list.map(x=>`<li><span class="num muted" style="min-width:48px;font-size:12.5px">${fmtDate(x.date,{day:'numeric',month:'short'})}</span><span class="grow">${esc((S.capital.find(k=>k.id===x.bucket)||{name:'غير محدد'}).name)}${x.note?` <span class="muted" style="font-size:12.5px">· ${esc(x.note)}</span>`:''}</span><b class="num">${money(x.amt)}</b>${del('savings',x.id)}</li>`).join('')}</ul>`:empty('مفيش مدخرات متسجلة الشهر ده.')}`,monthName(ym));
    })()}
  </div>`;
}

