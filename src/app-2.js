function spark(vals){
  if(vals.length<2)return '';
  const w=240,h=60,mn=Math.min(...vals),mx=Math.max(...vals),r=(mx-mn)||1;
  const pts=vals.map((v,i)=>[4+i/(vals.length-1)*(w-8),h-8-(v-mn)/r*(h-16)]);
  const l=pts[pts.length-1];
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;max-width:340px;height:auto;direction:ltr" role="img" aria-label="منحنى الوزن"><line x1="4" x2="${w-4}" y1="${h-2}" y2="${h-2}" stroke="var(--line)"/><polyline points="${pts.map(p=>p.map(n=>n.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${l[0]}" cy="${l[1]}" r="4" fill="var(--accent)"/></svg>`;
}
function mtile(k,icon,label,unit,cls,wide){
  const t=todayStr(),v=(S.health[t]||{})[k];
  const vals=lastN(7).map(d=>hv(d,k));
  const wts=Object.keys(S.health).sort().filter(d=>S.health[d].weight).slice(-30).map(d=>+S.health[d].weight);
  return `<label class="mtile ${cls}${wide?' wide':''}"><span class="mt-top">${ico(icon)}<span>${label}</span></span><input class="mt-in" type="number" step="${k==='weight'?'0.1':k==='cal'?'50':'0.5'}" min="0" inputmode="decimal" value="${v??''}" placeholder="0" data-c="hlog" data-k="${k}" aria-label="${label}"><span class="mt-u">${unit}</span>${k==='weight'&&wts.length>1?spark(wts):minibars(vals)}</label>`;
}
function vHealth(){
  const t=todayStr(),hdone=habitsToday();
  const sl=Object.keys(S.health).sort().filter(d=>S.health[d].sleep).slice(-7).map(d=>+S.health[d].sleep);
  const avgSleep=sl.length?sum(sl,x=>x)/sl.length:0;
  const fam=[...S.family].filter(f=>f.date>=t).sort((a,b)=>a.date.localeCompare(b.date));
  const rd=S.reading;
  const jdates=Object.keys(S.journal).filter(d=>S.journal[d]).sort().reverse().slice(0,3);
  return `
  <header class="top"><div><h1>الصحة والحياة</h1><p>اضغط على أي مربع واكتب قياس النهاردة</p></div><span class="sync" id="sync"></span></header>
  <div class="grid">
    <div class="mgrid">
      ${mtile('sleep','moon','النوم','ساعة','c2')}
      ${mtile('move','run','الحركة','دقيقة','c0')}
      ${mtile('weight','scale','الوزن','كجم','c0',true)}
      ${mtile('cal','flame','السعرات','kcal','c1')}
      ${mtile('fast','clock','الصيام','ساعة','c0')}
    </div>
    ${card('هدف النوم',`<div class="row between wrap"><span class="muted" style="font-size:13px">${sl.length?`متوسط نومك آخر ${sl.length} أيام: <b class="num">${nf(avgSleep)}</b> ساعة`:'سجّل ساعات نومك وهنحسب المتوسط.'}</span><label class="f" style="width:150px">هدف النوم (ساعات)<input type="number" min="4" max="12" step="0.5" value="${S.settings.sleep}" data-c="setting" data-k="sleep"></label></div>`)}
    ${card('عادات اليوم',`<p class="sub">${hdone.length} من ${S.habits.length}</p><ul class="list">${S.habits.map(b=>`<li>${chk(hdone.includes(b.id),'habit',`data-id="${b.id}"`)}<span class="grow ${hdone.includes(b.id)?'done':''}">${esc(b.name)}</span>${del('habits',b.id)}</li>`).join('')}</ul>
      <form class="add" data-f="habit"><input name="name" placeholder="عادة جديدة" required autocomplete="off"><button class="btn" type="submit">إضافة</button></form>`)}
    ${card('الأسرة والمناسبات',(fam.length?`<ul class="list" style="margin-top:6px">${fam.map(f=>{const n=daysUntil(f.date);return `<li><div class="grow"><div>${esc(f.title)}</div><div class="muted" style="font-size:12.5px">${fmtDate(f.date,{weekday:'long',day:'numeric',month:'long'})}</div></div><span class="pill ${n<=3?'warn':''}">${n===0?'النهاردة':n===1?'بكرة':n+' يوم'}</span>${del('family',f.id)}</li>`}).join('')}</ul>`:empty('أضف عيد ميلاد أو مناسبة أو وقت مخصص للأسرة.'))+
      `<form class="add" data-f="family"><input type="date" name="date" value="${t}" required aria-label="التاريخ"><input name="title" placeholder="المناسبة" required autocomplete="off"><button class="btn" type="submit">إضافة</button></form>`)}
    ${card('القراءة',(rd.length?`<ul class="list" style="margin-top:6px">${rd.map(b=>`<li>${chk(b.done,'plain',`data-k="reading" data-id="${b.id}"`)}<span class="grow ${b.done?'done':''}">${esc(b.title)}</span>${del('reading',b.id)}</li>`).join('')}</ul>`:empty('كتاب أو مقال نفسك تخلصه؟'))+
      `<form class="add" data-f="book"><input name="title" placeholder="عنوان الكتاب" required autocomplete="off"><button class="btn" type="submit">إضافة</button></form>`)}
    ${card('مراجعة النفس',`<p class="sub">اكتب كام سطر عن يومك: إيه اللي مشي كويس وإيه اللي محتاج يتغير؟</p><textarea data-c="journal" aria-label="تأمل اليوم" placeholder="النهاردة...">${esc(S.journal[t]||'')}</textarea>
      ${jdates.filter(d=>d!==t).map(d=>`<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--line)"><div class="muted" style="font-size:12.5px">${fmtDate(d,{weekday:'long',day:'numeric',month:'long'})}</div><div style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(S.journal[d])}</div></div>`).join('')}`)}
  </div>`;
}

const nice=v=>{if(v<=0)return 1;const p=Math.pow(10,Math.floor(Math.log10(v))),m=v/p;return (m<=1?1:m<=2?2:m<=5?5:10)*p};
function chart(labels,series,o){
  o=o||{};
  const w=340,h=176,pl=38,pr=6,pt=14,pb=26,n=labels.length,k=series.length;
  const top=nice(Math.max(0,...series.flatMap(s=>s.vals),o.goal||0));
  const iw=w-pl-pr,ih=h-pt-pb,gw=iw/n,bw=Math.min(24,gw*0.72/k);
  const y=v=>pt+ih-v/top*ih;
  let g='';
  for(let i=0;i<=2;i++){const v=top*i/2;g+=`<line x1="${pl}" x2="${w-pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${pl-5}" y="${y(v)+3}" text-anchor="end" font-size="10" fill="var(--muted)">${nf(v)}</text>`}
  const step=Math.ceil(n/7);
  for(let i=0;i<n;i++){
    const x0=pl+gw*i+(gw-bw*k)/2;
    series.forEach((s,j)=>{
      const v=s.vals[i];if(!(v>0))return;
      const col=s.color?s.color(v):'var(--accent)';
      g+=`<rect x="${(x0+bw*j).toFixed(1)}" y="${y(v).toFixed(1)}" width="${(bw-1).toFixed(1)}" height="${(ih-(y(v)-pt)).toFixed(1)}" rx="3" fill="${col}"/>`;
      if(n<=7)g+=`<text x="${(x0+bw*j+bw/2).toFixed(1)}" y="${(y(v)-3).toFixed(1)}" text-anchor="middle" font-size="9.5" fill="var(--ink)">${nf(v)}</text>`;
    });
    if(i%step===0||i===n-1)g+=`<text x="${(pl+gw*i+gw/2).toFixed(1)}" y="${h-8}" text-anchor="middle" font-size="10" fill="var(--muted)">${labels[i]}</text>`;
  }
  if(o.goal)g+=`<line x1="${pl}" x2="${w-pr}" y1="${y(o.goal)}" y2="${y(o.goal)}" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="5 4"/>`;
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;direction:ltr" role="img" aria-label="${esc(o.aria||'رسم بياني')}">${g}</svg>`;
}
function lineChart(labels,series,o){
  o=o||{};
  const w=340,h=190,pl=48,pr=12,pt=14,pb=26,n=labels.length;
  const top=nice(Math.max(0,...series.flatMap(s=>s.vals)));
  const iw=w-pl-pr,ih=h-pt-pb;
  const x=i=>pl+(n>1?i/(n-1):0.5)*iw,y=v=>pt+ih-v/top*ih;
  let g='';
  for(let i=0;i<=2;i++){const v=top*i/2;g+=`<line x1="${pl}" x2="${w-pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${pl-6}" y="${y(v)+3}" text-anchor="end" font-size="10" fill="var(--muted)">${nf(v)}</text>`}
  series.forEach(s=>{
    g+=`<polyline points="${s.vals.map((v,i)=>x(i).toFixed(1)+','+y(v).toFixed(1)).join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`;
    g+=s.vals.map((v,i)=>`<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3.5" fill="${s.color}"/>`).join('');
  });
  labels.forEach((l,i)=>{g+=`<text x="${x(i).toFixed(1)}" y="${h-8}" text-anchor="middle" font-size="10" fill="var(--muted)">${l}</text>`});
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;direction:ltr" role="img" aria-label="${esc(o.aria||'رسم بياني')}">${g}</svg>`;
}
function stile(icon,label,val,unit,vals,cls){
  return `<div class="mtile ${cls}"><span class="mt-top">${ico(icon)}<span>${label}</span></span><b class="mt-in num">${val?nf(val):'—'}</b><span class="mt-u">${unit}</span>${minibars(vals)}</div>`;
}
function vStats(){
  const t=todayStr();
  const d14=lastN(14),l7=lastN(7);
  const studyV=d14.map(d=>sum(S.sessions.filter(s=>s.date===d),s=>s.h));
  const sleepV=d14.map(d=>hv(d,'sleep')),calV=d14.map(d=>hv(d,'cal')),fastV=d14.map(d=>hv(d,'fast'));
  const dl=d14.map(d=>String(parse(d).getDate()));
  const b=new Date(),yms=[];
  for(let i=5;i>=0;i--){const d=new Date(b.getFullYear(),b.getMonth()-i,1);yms.push(d.getFullYear()+'-'+pad(d.getMonth()+1))}
  const inc=yms.map(monthIncome),spd=yms.map(monthSpend);
  const ml=yms.map(y=>fmtDate(y+'-01',{month:'short'}));
  const goalS=+S.settings.study||0,goalSl=+S.settings.sleep||0;
  const cur=yms[5];
  const wkStart=d=>{const x=parse(d);x.setDate(x.getDate()-((x.getDay()+1)%7));return ymd(x)};
  const weeks=Array.from({length:8},(_,j)=>addDays(wkStart(t),-7*(7-j)));
  const wl=weeks.map(w=>fmtDate(w,{day:'numeric',month:'numeric'}));
  const inWk=(w,f)=>Array.from({length:7},(_,i)=>f(addDays(w,i)));
  const studyW=weeks.map(w=>sum(inWk(w,d=>sum(S.sessions.filter(s=>s.date===d),s=>s.h)),x=>x));
  const sleepW=weeks.map(w=>avgOf(inWk(w,d=>hv(d,'sleep'))));
  const calW=weeks.map(w=>Math.round(avgOf(inWk(w,d=>hv(d,'cal')))));
  const fastW=weeks.map(w=>avgOf(inWk(w,d=>hv(d,'fast'))));
  const wk=Object.keys(S.health).sort().filter(d=>S.health[d].weight).slice(-30).map(d=>+S.health[d].weight);
  const wd=wk.length>1?wk[wk.length-1]-wk[0]:0;
  const rows=yms.map((y,i)=>[y,i]).reverse().map(([y,i])=>`<tr><td>${monthName(y)}</td><td>${monthShifts(y).length}</td><td>${money(inc[i])}</td><td>${money(spd[i])}</td><td style="color:${inc[i]-spd[i]<0?'var(--bad)':'inherit'}">${money(inc[i]-spd[i])}</td></tr>`).join('');
  return `
  <header class="top"><div><h1>الإحصائيات</h1><p>آخر 7 أيام في كل مربع</p></div><span class="sync" id="sync"></span></header>
  <div class="grid">
    <div class="mgrid">
      ${stile('book','المذاكرة',avgOf(studyV.slice(7)),'ساعة يومياً',studyV.slice(7),'c0')}
      ${stile('moon','النوم',avgOf(sleepV.slice(7)),'ساعة (المتوسط)',sleepV.slice(7),'c2')}
      ${stile('flame','السعرات',Math.round(avgOf(calV.slice(7))),'kcal (المتوسط)',calV.slice(7),'c1')}
      ${stile('clock','الصيام',avgOf(fastV.slice(7)),'ساعة (المتوسط)',fastV.slice(7),'c0')}
    </div>
    ${card('الدخل والمصروفات',`<div class="stats" style="margin-top:0"><div class="stat"><b>${money(inc[5])}</b><span>دخل ${monthName(cur)}</span></div><div class="stat"><b>${money(inc[5]-spd[5])}</b><span>الصافي</span></div></div><div class="legend" style="margin:10px 0 0"><span><span class="chip" style="color:var(--accent)">■</span> الدخل</span><span><span class="chip" style="color:var(--h1)">■</span> المصروفات</span></div>${lineChart(ml,[{vals:inc,color:'var(--accent)'},{vals:spd,color:'var(--h1)'}],{aria:'الدخل والمصروفات آخر 6 شهور'})}`,'آخر 6 شهور')}
    ${card('الوزن',wk.length?`<div class="row between wrap"><div><div class="big num">${nf(wk[wk.length-1])}<span style="font-size:15px;font-weight:500"> كجم</span></div><div class="muted" style="font-size:13px">آخر قياس · منحنى آخر ${wk.length} قياس</div></div>${wk.length>1?`<span class="pill">${wd>0?'+':''}${nf(wd)} كجم</span>`:''}</div>${spark(wk)}`:empty('سجّل وزنك في تبويب الصحة وهيظهر هنا.'))}
    ${card('جدول الشهور',`<div class="scroll-x"><table><thead><tr><th>الشهر</th><th>نوبات</th><th>الدخل</th><th>المصروفات</th><th>الصافي</th></tr></thead><tbody>${rows}</tbody></table></div>`)}
    <details class="card" open><summary>التفاصيل الأسبوعية (آخر 8 أسابيع)</summary>
      <p class="sub" style="margin-top:6px">كل عمود أسبوع من السبت للجمعة، والتاريخ تحته بداية الأسبوع.</p>
      <h3 class="dh">المذاكرة (مجموع الأسبوع) <small>الخط المتقطع هدفك (${nf(goalS*7)} س)</small></h3>${chart(wl,[{vals:studyW}],{goal:goalS*7,aria:'ساعات المذاكرة الأسبوعية'})}
      <h3 class="dh">النوم (متوسط يومي) <small>الباهت أقل من هدفك (${nf(goalSl)} س)</small></h3>${chart(wl,[{vals:sleepW,color:v=>v>=goalSl?'var(--night)':'color-mix(in srgb,var(--night) 45%,transparent)'}],{goal:goalSl,aria:'متوسط النوم الأسبوعي'})}
      <h3 class="dh">السعرات (متوسط يومي)</h3>${chart(wl,[{vals:calW,color:()=>'var(--h1)'}],{aria:'متوسط السعرات الأسبوعي'})}
      <h3 class="dh">ساعات الصيام (متوسط يومي)</h3>${chart(wl,[{vals:fastW}],{aria:'متوسط الصيام الأسبوعي'})}
    </details>
  </div>`;
}

function sheetHtml(){
  if(!ui.sheet)return '';
  const d=ui.sheet,sh=shiftsOn(d);
  return `<div class="sheet-bg" data-a="closeSheet"><div class="sheet" role="dialog" aria-modal="true" aria-label="نوبات اليوم">
    <div class="row between"><h3>${dayName(d)} ${fmtDate(d,{day:'numeric',month:'long'})}</h3><button class="x" data-a="closeSheet" aria-label="إغلاق">×</button></div>
    ${sh.length?`<ul class="list">${sh.map(s=>`<li><div class="grow"><div class="t-${s.type}" style="font-weight:600">${TYPES[s.type].l}</div><div class="muted" style="font-size:12.5px">${esc(hname(s.hid))} · ${money(earn(s))} · ${s.paid?'اتسلمت':'لسه ما اتسلمتش'}</div></div>${del('shifts',s.id)}</li>`).join('')}</ul>`:empty('مفيش نوبات في اليوم ده.')}
    <form class="add" data-f="shift"><input type="hidden" name="date" value="${d}"><input type="hidden" name="type" value="h24"><select name="hid" aria-label="المستشفى">${hospOpts('')}</select><button class="btn" type="submit">إضافة نوبة</button></form>
  </div></div>`;
}

/* ---------- render ---------- */
function render(){
  const y=window.scrollY;
  $('#nav').innerHTML='<div class="brand"><svg viewBox="0 0 24 24" style="width:24px;height:24px;vertical-align:-5px;margin-inline-end:6px;color:var(--accent)" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.600-7 10-7 10z"/><path d="M6 12h3l1.500-3 2 5 1.500-2H18"/></svg>نظام حياتي</div>'+TABS.map(([k,l])=>`<button data-a="tab" data-k="${k}" aria-label="${l}" title="${l}"${ui.tab===k?' aria-current="page"':''}><svg viewBox="0 0 24 24">${ICON[k]}</svg><span>${l}</span></button>`).join('');
  const V={home:vHome,work:vWork,study:vStudy,money:vMoney,health:vHealth,stats:vStats};
  $('#app').innerHTML=V[ui.tab]()+sheetHtml();
  setSync(syncState);
  window.scrollTo(0,y);
}
let tt=0;
function toast(m){const el=$('#toast');el.innerHTML='<span>'+esc(m)+'</span>';clearTimeout(tt);tt=setTimeout(()=>{el.innerHTML=''},2200)}
const commit=()=>{save();render()};
const find=(k,id)=>S[k].find(x=>x.id===id);

/* ---------- events ---------- */
const OK_DEL=['capital','tasks','appts','shifts','cases','hospitals','topics','sessions','goals','income','expenses','commits','savings','habits','family','reading'];
const A={
  tab(e){ui.tab=e.k;ui.sheet=null;try{history.replaceState(null,'','#'+e.k)}catch(x){location.hash=e.k}window.scrollTo(0,0);render()},
  ym(e){const [y,m]=ui.ym.split('-').map(Number),d=new Date(y,m-1+Number(e.n),1);const nx=d.getFullYear()+'-'+pad(d.getMonth()+1);if(nx<MIN_YM)return;ui.ym=nx;render()},
  hosp(e){ui.hid=e.id;render()},
  shiftDay(e){const id=hosp(ui.hid)?ui.hid:(S.hospitals[0]||{}).id;if(!id){toast('أضف مستشفى الأول');return}const ex=S.shifts.find(s=>s.date===e.d&&s.hid===id);if(ex)S.shifts=S.shifts.filter(s=>s!==ex);else S.shifts.push({id:uid(),date:e.d,type:'h24',hid:id,paid:false});commit()},
  day(e){ui.sheet=e.d;render()},
  closeSheet(e,ev){if(ev.target.closest('.sheet')&&!ev.target.closest('button.x'))return;ui.sheet=null;render()},
  task(e){const x=find('tasks',e.id);if(!x)return;x.done=!x.done;if(x.done){x.star=false;x.date=todayStr()}commit()},
  star(e){const x=find('tasks',e.id);if(!x)return;if(!x.star&&S.tasks.filter(t=>t.star&&!t.done).length>=3){toast('عندك 3 أولويات بالفعل. شيل نجمة الأول.');return}x.star=!x.star;commit()},
  plain(e){const x=find(e.k,e.id);if(x){x.done=!x.done;commit()}},
  paid(e){const x=find('shifts',e.id);if(x){x.paid=!x.paid;if(x.paid)x.paidAt=todayStr();else delete x.paidAt;commit()}},
  payAll(e){const end=ui.ym+'-31',l=S.shifts.filter(s=>s.hid===e.id&&s.date<=end);const anyDue=l.some(s=>!s.paid);if(anyDue)l.filter(s=>!s.paid).forEach(s=>{s.paid=true;s.paidAt=todayStr()});else l.filter(s=>s.date.startsWith(ui.ym)).forEach(s=>{s.paid=false;delete s.paidAt});commit()},
  topic(e){const x=find('topics',e.id);if(x){x.st=(x.st+1)%3;commit()}},
  habit(e){const t=todayStr(),l=S.habitLog[t]||(S.habitLog[t]=[]),i=l.indexOf(e.id);i<0?l.push(e.id):l.splice(i,1);commit()},
  syncNew(){const a=new Uint8Array(28);crypto.getRandomValues(a);const ch='abcdefghjkmnpqrstuvwxyz23456789';const c=Array.from(a,b=>ch[b%ch.length]).join('').match(/.{4}/g).join('-');joinCode(c,true)},
  syncSet(){const v=(($('#sc')||{}).value||'').trim();if(v.length<24){toast('الكود غير صحيح');return}joinCode(v)},
  syncCopy(){try{navigator.clipboard.writeText(syncCode);toast('اتنسخ الكود')}catch(e){toast('انسخه يدوي من الخانة')}},
  syncOff(){syncCode='';try{localStorage.removeItem(LSC)}catch(e){}syncState='local';render();toast('اتوقفت المزامنة على الجهاز ده')},
  backup(){(async()=>{try{const d=await window.claude.use('downloads');if(!d){toast('التنزيل مش متاح هنا');return}await d.save({filename:'lifeos-backup-'+todayStr()+'.json',data:JSON.stringify(S,null,1)})}catch(e){if(!e||e.code!=='declined')toast('ما قدرتش أحفظ الملف')}})()},
  del(e){if(!OK_DEL.includes(e.k))return;S[e.k]=S[e.k].filter(x=>x.id!==e.id);commit()}
};
document.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-a]');if(!b)return;
  const fn=A[b.dataset.a];if(fn)fn(b.dataset,ev);
});
const num=v=>{const n=parseFloat(v);return isFinite(n)?n:0};
const FORMS={
  task:f=>{S.tasks.push({id:uid(),text:f.text.trim(),date:todayStr(),done:false,star:false})},
  appt:f=>{S.appts.push({id:uid(),date:f.date,time:f.time,title:f.title.trim()})},
  shift:f=>{S.shifts.push({id:uid(),date:f.date,type:f.type,hid:f.hid,paid:false})},
  hospital:f=>{S.hospitals.push({id:uid(),name:f.name.trim(),r12:0,r24:0})},
  case:f=>{S.cases.push({id:uid(),date:f.date,hid:f.hid,text:f.text.trim(),proc:(f.proc||'').trim()})},
  session:f=>{S.sessions.push({id:uid(),date:f.date,h:num(f.h),topic:f.topic})},
  topic:f=>{S.topics.push({id:uid(),name:f.name.trim(),st:0})},
  goal:f=>{S.goals.push({id:uid(),text:f.text.trim(),due:f.due,done:false})},
  income:f=>{S.income.push({id:uid(),date:f.date,src:f.src.trim(),amt:num(f.amt)})},
  commit:f=>{S.commits.push({id:uid(),name:f.name.trim(),amt:num(f.amt)})},
  expense:f=>{
    if(f.cat===FAWRY_CAT){
      let k=S.capital.find(x=>x.name.includes('فوري'));
      if(!k){k={id:uid(),name:'مدخرات فوري',base:0};S.capital.push(k)}
      S.savings.push({id:uid(),date:f.date,bucket:k.id,amt:num(f.amt),note:(f.note||'').trim()||'من الإضافة السريعة'});
      toast('اتضاف '+money(num(f.amt))+' لمدخرات فوري');
    }else S.expenses.push({id:uid(),date:f.date,cat:f.cat,amt:num(f.amt),note:(f.note||'').trim()});
  },
  saving:f=>{S.savings.push({id:uid(),date:f.date,bucket:f.bucket,amt:num(f.amt),note:(f.note||'').trim()})},
  bucket:f=>{S.capital.push({id:uid(),name:f.name.trim(),base:0})},
  habit:f=>{S.habits.push({id:uid(),name:f.name.trim()})},
  family:f=>{S.family.push({id:uid(),date:f.date,title:f.title.trim()})},
  book:f=>{S.reading.push({id:uid(),title:f.title.trim(),done:false})}
};
document.addEventListener('submit',ev=>{
  const form=ev.target.closest('form[data-f]');if(!form)return;
  ev.preventDefault();
  const fn=FORMS[form.dataset.f];if(!fn)return;
  fn(Object.fromEntries(new FormData(form)));
  commit();
  if(form.dataset.f==='task'){const q=$('#qt');if(q)q.focus()}
});
document.addEventListener('change',ev=>{
  const el=ev.target.closest('[data-c]');if(!el)return;
  const c=el.dataset.c,t=todayStr();
  if(c==='hname'){const h=hosp(el.dataset.id);if(h&&el.value.trim())h.name=el.value.trim()}
  else if(c==='r12'||c==='r24'){const h=hosp(el.dataset.id);if(h)h[c]=num(el.value)}
  else if(c==='setting'){S.settings[el.dataset.k]=num(el.value)||S.settings[el.dataset.k]}
  else if(c==='hlog'){const o=S.health[t]||(S.health[t]={});if(el.value==='')delete o[el.dataset.k];else o[el.dataset.k]=num(el.value)}
  else if(c==='journal'){S.journal[t]=el.value}
  else if(c==='capval'){const k=S.capital.find(x=>x.id===el.dataset.id);if(k)k.base=num(el.value)-capAdded(k.id)}
  save();
  if(c==='hname'||c==='r12'||c==='r24'||c==='setting'||c==='hlog'||c==='capval')render();
});
window.addEventListener('hashchange',()=>{const k=location.hash.slice(1);if(TABS.some(t=>t[0]===k)&&k!==ui.tab){ui.tab=k;render()}});

render();
initDb();
(()=>{const m=(location.hash||'').match(/^#sync=([A-Za-z0-9-]{24,64})$/);if(!m)return;try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}if(!syncCode)joinCode(m[1]);else if(syncCode!==m[1])toast('الجهاز ده مربوط بكود تاني')})();
cloudPull();setInterval(cloudPull,20000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)cloudPull()});
})();
