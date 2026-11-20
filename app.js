// ===== NEW COMMITTEE APP - FROM SCRATCH - ALL FUNCTIONS =====
console.log("App.js load ho gaya - NEW VERSION");

let members = [
  {id:1, name:"Khalid Farooq", phone:"03001111111", amount:10000, isAdmin:true},
  {id:2, name:"Fatima Noor", phone:"03002222222", amount:10000},
  {id:3, name:"Bilal Ahmed", phone:"03003333333", amount:10000},
  {id:4, name:"Ayesha Khan", phone:"03004444444", amount:10000},
  {id:5, name:"Usman Ali", phone:"03005555555", amount:10000},
  {id:6, name:"Hassan Raza", phone:"03006666666", amount:10000},
  {id:7, name:"Sana Iqbal", phone:"03007777777", amount:10000},
  {id:8, name:"Ahmed Khan", phone:"03008888888", amount:10000},
  {id:9, name:"Maryam Bibi", phone:"03009999999", amount:10000},
  {id:10, name:"Ali Raza", phone:"03001010101", amount:10000},
  {id:11, name:"Zainab Fatima", phone:"03001111112", amount:10000},
  {id:12, name:"Umar Farooq", phone:"03001212121", amount:10000},
];
let calendar = {};
let drawBoxes = [
  {box:1, winner:"Khalid Farooq", month:"December 2026", status:"DISABLED"},
  {box:5, winner:"Fatima Noor", month:"October 2027", status:"TAKEN"},
];
let history = [];
let currentUser = null;
let isAdmin = false;
let editingMemberId = null;

members.forEach(m=>{ if(!calendar[m.name]) calendar[m.name]={}; calendar[m.name]["Month-1"]="paid"; });

// LOAD / SAVE
function loadLocal(){ try{ let s=JSON.parse(localStorage.getItem("committee_NEW_v1")||"null"); if(s && s.members && s.members.length>0){ members=s.members; calendar=s.calendar; drawBoxes=s.drawBoxes; history=s.history; } }catch(e){} }
loadLocal();
function save(){ try{ localStorage.setItem("committee_NEW_v1", JSON.stringify({members, calendar, drawBoxes, history})); }catch(e){} saveToFirebase(); render(); }
async function saveToFirebase(){ try{ if(window.fb && window.fb.db) await window.fb.setDoc(window.fb.doc(window.fb.db,"committee","members"),{members, calendar, drawBoxes, history, totalMonths:getTotalMonths(), updatedAt:new Date().toString()}); }catch(e){ console.log("Firebase save skip:", e.message); } }
async function loadFromFirebase(){ try{ if(window.fb && window.fb.db){ let snap=await window.fb.getDoc(window.fb.doc(window.fb.db,"committee","members")); if(snap.exists()){ let d=snap.data(); if(d.members && d.members.length>0){ members=d.members; calendar=d.calendar; drawBoxes=d.drawBoxes; history=d.history; render(); } } } }catch(e){} }

// AUTO COMMITTEE - JITNE MEMBER UTNE MAHINE
function getTotalMonths(){ return members.length; }
function getPaidCount(name){ if(!calendar[name]) return 0; return Object.values(calendar[name]).filter(v=>v==="paid").length; }

// LOGIN - FIXED WITH EVENT LISTENERS
function doAdminLogin(){
  let el=document.getElementById('adminPass');
  let err=document.getElementById('loginError');
  if(!el){ alert("Password box nahi mila"); return; }
  let pass=el.value.trim();
  if(pass==="1234"){
    isAdmin=true; currentUser="Khalid Farooq";
    document.getElementById('loginScreen').style.display='none';
    document.getElementById('mainScreen').classList.remove('hidden');
    document.getElementById('mainScreen').style.display='block';
    document.getElementById('drawLoginMsg').innerText="Admin view me ho. Member login kar ke Draw kholo.";
    if(err) err.style.display='none';
    render();
  } else {
    if(err){ err.innerText="Ghalat PIN! 1234 likhen. Aap ne likha: "+pass; err.style.display='block'; }
    alert("Ghalat PIN! 1234 likhen");
  }
}
function doMemberLogin(){
  let name=document.getElementById('memberNameInput').value.trim();
  if(!name){ alert("Naam likhen"); return; }
  let m=members.find(x=>x.name.toLowerCase()===name.toLowerCase());
  if(!m){ alert("Member nahi mila! Naam: "+name); return; }
  isAdmin=false; currentUser=m.name;
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('mainScreen').classList.remove('hidden');
  document.getElementById('mainScreen').style.display='block';
  document.getElementById('drawLoginMsg').innerText="Welcome "+m.name+" - Apna Box Kholo!";
  render();
}
function doLogout(){ currentUser=null; isAdmin=false; document.getElementById('loginScreen').style.display='block'; document.getElementById('mainScreen').classList.add('hidden'); document.getElementById('mainScreen').style.display='none'; }
function switchLogin(t){ document.getElementById('tabAdmin').classList.toggle('active', t==='admin'); document.getElementById('tabMember').classList.toggle('active', t==='member'); document.getElementById('adminLoginBox').classList.toggle('hidden', t!=='admin'); document.getElementById('memberLoginBox').classList.toggle('hidden', t!=='member'); }
function showPage(p){ ['dashboard','draw','members','winners'].forEach(x=>{ let el=document.getElementById('page'+x.charAt(0).toUpperCase()+x.slice(1)); if(el) el.classList.toggle('hidden', x!==p); }); document.querySelectorAll('.tabbar button').forEach(b=>b.classList.remove('active')); if(p==='dashboard') document.getElementById('btnDashboard').classList.add('active'); if(p==='draw') document.getElementById('btnDraw').classList.add('active'); if(p==='members') document.getElementById('btnMembers').classList.add('active'); if(p==='winners') document.getElementById('btnWinners').classList.add('active'); }

// ADD / EDIT / DELETE
function showAddMember(){ document.getElementById('addMemberBox').classList.toggle('hidden'); }
function doAddMember(){ let name=document.getElementById('newName').value.trim(); let phone=document.getElementById('newPhone').value.trim(); let amount=document.getElementById('newAmount').value; if(!name) return alert("Naam likhen"); if(members.find(m=>m.name.toLowerCase()===name.toLowerCase())) return alert("Pehle se hai!"); let nm={id:Date.now(), name, phone, amount:parseInt(amount)||10000}; members.push(nm); calendar[nm.name]={}; history.push({text:`${nm.name} ko add kiya gaya`, date:new Date().toLocaleString()}); document.getElementById('newName').value=""; document.getElementById('newPhone').value=""; document.getElementById('newAmount').value=""; save(); alert(nm.name+" Add ho gaya! Ab Committee "+getTotalMonths()+" Mahine ki hai"); }
function editMember(id){ let m=members.find(x=>x.id===id); if(!m) return; editingMemberId=m.id; document.getElementById('editName').value=m.name; document.getElementById('editPhone').value=m.phone||""; document.getElementById('editAmount').value=m.amount||""; document.getElementById('editBox').style.display='block'; }
function doSaveEdit(){ let m=members.find(x=>x.id===editingMemberId); if(!m) return; let oldName=m.name; let newName=document.getElementById('editName').value.trim(); if(!newName) return alert("Naam khali nahi"); if(oldName!==newName && calendar[oldName]){ calendar[newName]=calendar[oldName]; delete calendar[oldName]; drawBoxes.forEach(b=>{ if(b.winner===oldName) b.winner=newName; }); } m.name=newName; m.phone=document.getElementById('editPhone').value.trim(); m.amount=parseInt(document.getElementById('editAmount').value)||10000; history.push({text:`${oldName} ko Edit karke ${newName} kiya`, date:new Date().toLocaleString()}); document.getElementById('editBox').style.display='none'; save(); alert("✅ Update ho gaya!"); }
function closeEdit(){ document.getElementById('editBox').style.display='none'; }
function deleteMember(name){ if(!confirm(name+" ko delete karna hai?")) return; members=members.filter(m=>m.name!==name); delete calendar[name]; drawBoxes=drawBoxes.filter(b=>b.winner!==name); history.push({text:`${name} ko delete kiya gaya`, date:new Date().toLocaleString()}); save(); }
function clearHistory(){ if(confirm("History clear karni hai?")){ history=[]; save(); } }
function resetDraw(){ if(confirm("Calendar + Draw Reset karna hai?")){ drawBoxes=[{box:1,winner:"Khalid Farooq",month:"December 2026",status:"DISABLED"}]; calendar={}; members.forEach(m=>calendar[m.name]={}); save(); } }
function togglePaid(name, month){ if(!calendar[name]) calendar[name]={}; if(calendar[name][month]==="paid") calendar[name][month]="unpaid"; else { calendar[name][month]="paid"; history.push({text:`${name} ne ${month} ki qist jama ki`, date:new Date().toLocaleString()}); } save(); }

// DRAW
function openBox(boxNo){ if(isAdmin){ alert("Admin view me ho. Member login kar ke Draw kholo."); return; } if(drawBoxes.find(b=>b.box===boxNo)){ alert("Ye box pehle se khul chuka hai!"); return; } if(drawBoxes.find(b=>b.winner===currentUser)){ alert("Aap pehle hi 1 box khol chuke hain!"); return; } let months=["January 2027","February 2027","March 2027","April 2027","May 2027","June 2027","July 2027","August 2027","September 2027","October 2027","November 2027","December 2027"]; let taken=drawBoxes.map(b=>b.month); let avail=months.filter(m=>!taken.includes(m)); let month=avail[Math.floor(Math.random()*avail.length)]||"Random Month"; drawBoxes.push({box:boxNo, winner:currentUser, month, status:"TAKEN"}); history.push({text:`${currentUser} ne Box #${boxNo} khola - ${month}`, date:new Date().toLocaleString()}); save(); alert(`🎉 Mubarak ho ${currentUser}! Aapko mila: ${month}`); }

// WITHDRAW LOCK
function canWithdraw(member){ if(!member) return false; let total=getTotalMonths(); let isWon=drawBoxes.some(b=>b.winner===member.name); let paid=getPaidCount(member.name); return isWon && paid>=total && total>0; }
function getWithdrawStatus(member){ if(!member) return ""; let total=getTotalMonths(); let paid=getPaidCount(member.name); let isWon=drawBoxes.some(b=>b.winner===member.name); if(!isWon) return `⏳ Abhi aapki committee nahi nikli. Withdraw baad me aayega. (Paid: ${paid}/${total})`; if(paid<total) return `⏳ Committee nikal gayi hai, Collection poori hote hi Withdraw khulega. (Paid: ${paid}/${total})`; return `✅ Mubarak ho! Aap Withdraw kar sakte hain. (Paid: ${paid}/${total})`; }
function doWithdraw(){ let member=members.find(m=>m.name===currentUser); if(!member){ alert("Pehle Member Login karen"); return; } if(!canWithdraw(member)){ alert(getWithdrawStatus(member)); return; } if(!confirm(member.name+" ko 120,000 PKR Withdraw dena hai?")) return; history.push({text:`${member.name} ne 120,000 PKR Withdraw liya`, date:new Date().toLocaleString()}); save(); alert(`💰 ${member.name} ka Withdraw ho gaya!`); }

// RENDER
function render(){
  let el1=document.getElementById('statMembers'); if(el1) el1.innerText=members.length;
  let el2=document.getElementById('memberCount'); if(el2) el2.innerText=members.length;
  let el3=document.getElementById('committeeInfo'); if(el3) el3.innerText=`Total Member: ${getTotalMonths()} | Committee: ${getTotalMonths()} Mahine ki`;
  let el4=document.getElementById('cycleText'); if(el4) el4.innerText=`1 of ${getTotalMonths()} - December 2026`;
  let el5=document.getElementById('drawStatusText'); if(el5) el5.innerText=`${drawBoxes.length} / ${getTotalMonths()} boxes khul chuke hain.`;
  let pot=members.length*10000;
  let el6=document.getElementById('totalPotText'); if(el6) el6.innerText=pot.toLocaleString()+" PKR";
  let el7=document.getElementById('collectionText'); if(el7) el7.innerText=pot.toLocaleString()+" PKR collected of "+pot.toLocaleString()+" PKR";

  let listEl=document.getElementById('membersList');
  if(listEl){
    listEl.innerHTML=members.map(m=>{
      let initials=m.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
      let paid=getPaidCount(m.name);
      let idx=drawBoxes.findIndex(b=>b.winner===m.name); let drawNo=idx>=0?idx+1:"-";
      let drawMonth=drawBoxes.find(b=>b.winner===m.name)?.month||"December";
      return `<div class="member-row"><div class="avatar">${initials}</div><div style="flex:1"><b>${m.name}</b><br><span style="font-size:13px;color:#555">Draw #${drawNo} • ⭐ Committee: ${drawMonth}</span><br><span style="font-size:12px;color:#888">📞 ${m.phone||""} | Paid: ${paid}/${getTotalMonths()}</span></div><div style="text-align:right"><span class="mini-btn" onclick="window.open('https://wa.me/${(m.phone||"").replace(/[^0-9]/g,'')}')">WhatsApp</span><br><span class="mini-btn" onclick="togglePaid('${m.name}','Month-1')">✓ Paid</span>${isAdmin?`<br><span class="mini-btn mini-btn-blue" onclick="editMember(${m.id})">✏️ Edit</span> <span class="mini-btn mini-btn-red" onclick="deleteMember('${m.name}')">🗑️ Delete</span>`:""}</div></div>${isAdmin?`<div style="font-size:12px;color:#888;margin:-5px 0 10px 68px">${canWithdraw(m)?"✅ Withdraw Available":getWithdrawStatus(m)}</div>`:""}`;
    }).join('');
  }
  let boxEl=document.getElementById('drawBoxes');
  if(boxEl){ let html=""; for(let i=1;i<=getTotalMonths();i++){ let found=drawBoxes.find(b=>b.box===i); if(found){ let cls=found.status==="DISABLED"?"box-dark":"box-orange"; html+=`<div class="box ${cls}" onclick="openBox(${i})">🔒 Box #${i}<br>${found.winner}<br>${found.month}<br>${found.status}</div>`; } else { html+=`<div class="box box-green" onclick="openBox(${i})">📦 Box #${i}<br>Click kar ke Kholo<br>???<br>Random Month</div>`; } } boxEl.innerHTML=html; }
  let calEl=document.getElementById('calendarList');
  if(calEl){ let total=getTotalMonths(); calEl.innerHTML=members.map(m=>{ let btns=""; for(let i=1;i<=total;i++){ let key="Month-"+i; let isPaid=calendar[m.name] && calendar[m.name][key]==="paid"; btns+=`<button onclick="togglePaid('${m.name}','${key}')" style="margin:3px;padding:7px 10px;border:none;border-radius:8px;background:${isPaid?"#0A7A3A":"#eee"};color:${isPaid?"#fff":"#333"}">M${i} ${isPaid?"✅":""}</button>`; } return `<div style="margin-bottom:10px"><b>${m.name}</b><br>${btns}</div>`; }).join(''); }
  let mem=members.find(m=>m.name===currentUser);
  if(mem){ let st=document.getElementById('memberStatus'); if(st) st.innerText=getWithdrawStatus(mem); let wb=document.getElementById('withdrawBtn'); if(wb) wb.style.display=canWithdraw(mem)?'block':'block'; }
  let drawEl=document.getElementById('drawList'); if(drawEl) drawEl.innerHTML=drawBoxes.map(d=>`🎉 Box #${d.box} - <b>${d.winner}</b> - ${d.month} - ${d.status}`).join('<br>');
  let histEl=document.getElementById('historyList'); if(histEl) histEl.innerHTML=history.length===0?"No payment history yet.":history.slice(-20).reverse().map(h=>`• ${h.text} - ${h.date}`).join('<br>');
  let target=new Date("2026-12-05T00:00:00").getTime(); let diff=Math.max(0,target-Date.now()); let d=Math.floor(diff/86400000), h=Math.floor(diff%86400000/3600000), mi=Math.floor(diff%3600000/60000), s=Math.floor(diff%60000/1000);
  if(document.getElementById('cdD')) document.getElementById('cdD').innerText=d; if(document.getElementById('cdH')) document.getElementById('cdH').innerText=h; if(document.getElementById('cdM')) document.getElementById('cdM').innerText=mi; if(document.getElementById('cdS')) document.getElementById('cdS').innerText=s;
}

// ===== ALL BUTTONS CONNECT - LOGIN FIX =====
function bindAll(){
  let bind=(id, fn)=>{ let e=document.getElementById(id); if(e) e.onclick=fn; };
  bind('tabAdmin', ()=>switchLogin('admin'));
  bind('tabMember', ()=>switchLogin('member'));
  bind('adminLoginBtn', doAdminLogin);
  bind('memberLoginBtn', doMemberLogin);
  bind('logoutBtn', doLogout);
  bind('goDrawBtn', ()=>showPage('draw'));
  bind('resetBtn', resetDraw);
  bind('showAddBtn', showAddMember);
  bind('addMemberBtn', doAddMember);
  bind('withdrawBtn', doWithdraw);
  bind('clearHistoryBtn', clearHistory);
  bind('saveEditBtn', doSaveEdit);
  bind('closeEditBtn', closeEdit);
  bind('btnDashboard', ()=>showPage('dashboard'));
  bind('btnDraw', ()=>showPage('draw'));
  bind('btnMembers', ()=>showPage('members'));
  bind('btnMembers2', ()=>showPage('members'));
  bind('btnWinners', ()=>showPage('winners'));
  // Enter dabane se bhi login ho
  let passEl=document.getElementById('adminPass');
  if(passEl) passEl.addEventListener('keydown', e=>{ if(e.key==='Enter') doAdminLogin(); });
  console.log("Sab buttons connect ho gaye - Login ready hai");
  // Firebase ko thodi der baad load karo taake login na ruke
  setTimeout(loadFromFirebase, 2000);
}
if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', ()=>{ bindAll(); render(); }); }
else { bindAll(); render(); }
setInterval(render, 1000);

// Window par bhi taake purane onclick bhi chalen
window.doAdminLogin=doAdminLogin; window.doMemberLogin=doMemberLogin; window.doLogout=doLogout;
window.switchLogin=switchLogin; window.showPage=showPage; window.showAddMember=showAddMember;
window.doAddMember=doAddMember; window.editMember=editMember; window.doSaveEdit=doSaveEdit;
window.closeEdit=closeEdit; window.deleteMember=deleteMember; window.clearHistory=clearHistory;
window.resetDraw=resetDraw; window.togglePaid=togglePaid; window.openBox=openBox; window.doWithdraw=doWithdraw;
