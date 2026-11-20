// ===== COMMITTEE APP - PURANA VIEW + NAYE FUNCTIONS =====
let members = [];
let calendar = {};
let drawBoxes = [];
let history = [];
let currentUser = null;
let isAdmin = false;
let editingMemberId = null;

function loadLocal(){
  try{
    members = JSON.parse(localStorage.getItem("members") || "[]");
    calendar = JSON.parse(localStorage.getItem("calendar") || "{}");
    drawBoxes = JSON.parse(localStorage.getItem("drawBoxes") || "[]");
    history = JSON.parse(localStorage.getItem("history") || "[]");
  }catch(e){ members=[]; calendar={}; drawBoxes=[]; history=[]; }
}
if(localStorage.getItem("firstTime") !== "done"){
  members=[]; calendar={}; drawBoxes=[]; history=[];
  localStorage.setItem("firstTime","done");
} else { loadLocal(); }

function save(){
  localStorage.setItem("members", JSON.stringify(members));
  localStorage.setItem("calendar", JSON.stringify(calendar));
  localStorage.setItem("drawBoxes", JSON.stringify(drawBoxes));
  localStorage.setItem("history", JSON.stringify(history));
  saveToFirebase();
  render();
}
async function saveToFirebase(){
  try{
    if(window.fb && window.fb.db){
      await window.fb.setDoc(window.fb.doc(window.fb.db,"committee","members"),{ members, calendar, drawBoxes, history, updatedAt: new Date().toString(), totalMonths: getTotalMonths() });
    }
  }catch(e){ console.log(e.message); }
}
async function loadFromFirebase(){
  try{
    if(window.fb && window.fb.db){
      let snap = await window.fb.getDoc(window.fb.doc(window.fb.db,"committee","members"));
      if(snap.exists()){
        let d = snap.data();
        if(d.members) members=d.members;
        if(d.calendar) calendar=d.calendar;
        if(d.drawBoxes) drawBoxes=d.drawBoxes;
        if(d.history) history=d.history;
        render();
      }
    }
  }catch(e){ console.log(e.message); }
}
setTimeout(loadFromFirebase,1500);

// ===== AUTO COMMITTEE - JITNE MEMBER UTNE MAHINE =====
function getTotalMonths(){ return members.length; }
function getPaidCount(name){ if(!calendar[name]) return 0; return Object.values(calendar[name]).filter(v=>v==="paid").length; }

// ===== LOGIN =====
function showLogin(t){
  document.getElementById('adminLogin').classList.toggle('hidden', t!=='admin');
  document.getElementById('memberLogin').classList.toggle('hidden', t!=='member');
}
function doAdminLogin(){
  if(document.getElementById('adminPass').value==="1234"){
    isAdmin=true; currentUser="Admin";
    document.getElementById('loginBox').classList.add('hidden');
    document.getElementById('mainBox').classList.remove('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    document.getElementById('welcomeText').innerText="Welcome Admin";
    document.getElementById('roleText').innerText="Admin - Sab control kar sakte hain";
    render();
  } else alert("Ghalat Password!");
}
function doMemberLogin(){
  let name=document.getElementById('memberNameInput').value.trim();
  if(!name){ alert("Naam likhen"); return; }
  let m=members.find(x=>x.name.toLowerCase()===name.toLowerCase());
  if(!m){ alert("Member nahi mila!"); return; }
  isAdmin=false; currentUser=m.name;
  document.getElementById('loginBox').classList.add('hidden');
  document.getElementById('mainBox').classList.remove('hidden');
  document.getElementById('memberPanel').classList.remove('hidden');
  document.getElementById('welcomeText').innerText="Welcome "+m.name;
  document.getElementById('roleText').innerText="Member";
  render();
}
function doLogout(){
  currentUser=null; isAdmin=false;
  document.getElementById('loginBox').classList.remove('hidden');
  document.getElementById('mainBox').classList.add('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
  document.getElementById('memberPanel').classList.add('hidden');
  render();
}

// ===== ADD / EDIT / DELETE =====
function doAddMember(){
  let name=document.getElementById('newName').value.trim();
  let phone=document.getElementById('newPhone').value.trim();
  let amount=document.getElementById('newAmount').value;
  if(!name){ alert("Naam likhen"); return; }
  if(members.find(m=>m.name.toLowerCase()===name.toLowerCase())){ alert("Pehle se hai!"); return; }
  let nm={ id: Date.now(), name, phone, amount: parseInt(amount)||0, joinedDate: new Date().toLocaleDateString() };
  members.push(nm); calendar[nm.name]={};
  history.push({text:`${nm.name} ko add kiya gaya`, date:new Date().toLocaleString()});
  document.getElementById('newName').value=""; document.getElementById('newPhone').value=""; document.getElementById('newAmount').value="";
  save(); alert(nm.name+" Add ho gaya! Ab Committee "+getTotalMonths()+" Mahine ki hai");
}
function editMember(id){
  let m=members.find(x=>x.id===id); if(!m) return;
  editingMemberId=m.id;
  document.getElementById('editName').value=m.name;
  document.getElementById('editPhone').value=m.phone||"";
  document.getElementById('editAmount').value=m.amount||"";
  document.getElementById('editBox').style.display='block';
}
function doSaveEdit(){
  let m=members.find(x=>x.id===editingMemberId); if(!m) return;
  let oldName=m.name; let newName=document.getElementById('editName').value.trim();
  if(!newName){ alert("Naam khali nahi"); return; }
  if(oldName!==newName && calendar[oldName]){ calendar[newName]=calendar[oldName]; delete calendar[oldName]; drawBoxes.forEach(b=>{ if(b.winner===oldName) b.winner=newName; }); }
  m.name=newName; m.phone=document.getElementById('editPhone').value.trim(); m.amount=parseInt(document.getElementById('editAmount').value)||0;
  history.push({text:`${oldName} ko Edit karke ${newName} kiya gaya`, date:new Date().toLocaleString()});
  document.getElementById('editBox').style.display='none';
  save(); alert("✅ Update ho gaya!");
}
function closeEdit(){ document.getElementById('editBox').style.display='none'; }
function deleteMember(name){
  if(!confirm(name+" ko delete karna hai?")) return;
  members=members.filter(m=>m.name!==name); delete calendar[name]; drawBoxes=drawBoxes.filter(b=>b.winner!==name);
  history.push({text:`${name} ko delete kiya gaya`, date:new Date().toLocaleString()});
  save();
}
function clearAll(){
  if(!confirm("Sara Data Delete karna hai?")) return;
  members=[]; calendar={}; drawBoxes=[]; history=[];
  localStorage.clear(); localStorage.setItem("firstTime","done"); save();
}

// ===== PAYMENT =====
function togglePaid(name, month){
  if(!calendar[name]) calendar[name]={};
  if(calendar[name][month]==="paid") calendar[name][month]="unpaid";
  else { calendar[name][month]="paid"; history.push({text:`${name} ne ${month} ki qist jama ki`, date:new Date().toLocaleString()}); }
  save();
}

// ===== DRAW =====
function doDrawNow(){
  if(members.length===0){ alert("Pehle member add karen"); return; }
  let won=drawBoxes.map(b=>b.winner);
  let eligible=members.filter(m=>!won.includes(m.name));
  if(eligible.length===0){ alert("Sab ki nikal chuki hai!"); return; }
  let winner=eligible[Math.floor(Math.random()*eligible.length)];
  let draw={ winner:winner.name, month:`Month-${drawBoxes.length+1}`, date:new Date().toLocaleString() };
  drawBoxes.push(draw);
  history.push({text:`${draw.month} ka Draw - Winner: ${winner.name}`, date:draw.date});
  save(); alert(`🎉 Mubarak ho! ${winner.name} ki Committee nikal gayi!`);
}

// ===== WITHDRAW LOCK - AUTO =====
function canWithdraw(member){
  if(!member) return false;
  let total=getTotalMonths();
  let isWon=drawBoxes.some(b=>b.winner===member.name);
  let paid=getPaidCount(member.name);
  return isWon && paid>=total && total>0;
}
function getWithdrawStatus(member){
  if(!member) return "";
  let total=getTotalMonths(); let paid=getPaidCount(member.name);
  let isWon=drawBoxes.some(b=>b.winner===member.name);
  if(!isWon) return `⏳ Abhi aapki committee nahi nikli. (Paid: ${paid}/${total})`;
  if(paid<total) return `⏳ Committee nikal gayi hai, Collection poori hote hi Withdraw khulega. (Paid: ${paid}/${total})`;
  return `✅ Mubarak ho! Aap Withdraw kar sakte hain. (Paid: ${paid}/${total})`;
}
function doWithdraw(){
  let member=members.find(m=>m.name===currentUser); if(!member) return;
  if(!canWithdraw(member)){ alert(getWithdrawStatus(member)); return; }
  if(!confirm(member.name+" ko Withdraw dena hai?")) return;
  history.push({text:`${member.name} ne Withdraw liya`, date:new Date().toLocaleString()});
  save(); alert(`💰 ${member.name} ka Withdraw ho gaya!`);
}

// ===== RENDER - PURANA VIEW =====
function render(){
  let info=document.getElementById('committeeInfo'); if(info) info.innerText=`📊 Total Member: ${getTotalMonths()} | Committee: ${getTotalMonths()} Mahine ki | Har Mahine 1 Draw`;
  let cnt=document.getElementById('memberCount'); if(cnt) cnt.innerText=members.length;

  let listEl=document.getElementById('membersList');
  if(listEl){
    if(members.length===0) listEl.innerHTML=`<p class="small">Koi member nahi hai.</p>`;
    else listEl.innerHTML=members.map(m=>{
      let paid=getPaidCount(m.name); let total=getTotalMonths();
      let won=drawBoxes.some(b=>b.winner===m.name);
      let canW=canWithdraw(m);
      return `<div class="member-box">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><b>${m.name}</b><br><span class="small">📞 ${m.phone||"No Phone"} | 💰 ${m.amount||0} | Paid: ${paid}/${total} ${won?"🎉 Draw Jeeta":""}</span></div>
          ${isAdmin?`<div style="display:flex;gap:6px"><button onclick="editMember(${m.id})" style="background:#007bff;color:#fff">✏️ Edit</button><button onclick="deleteMember('${m.name}')" style="background:#ff4444;color:#fff">🗑️</button></div>`:""}
        </div>
        <div style="font-size:12px;color:${canW?"green":"#888"};margin-top:4px">${canW?"✅ Withdraw Available":getWithdrawStatus(m)}</div>
      </div>`;
    }).join('');
  }

  let calEl=document.getElementById('calendarList');
  if(calEl){
    let total=getTotalMonths();
    if(total===0) calEl.innerHTML="Pehle member add karen";
    else calEl.innerHTML=members.map(m=>{
      let btns="";
      for(let i=1;i<=total;i++){ let key="Month-"+i; let isPaid=calendar[m.name] && calendar[m.name][key]==="paid"; btns+=`<button onclick="togglePaid('${m.name}','${key}')" style="margin:3px;background:${isPaid?"#0A7A3A":"#eee"};color:${isPaid?"#fff":"#333"}">M${i} ${isPaid?"✅":""}</button>`; }
      return `<div style="margin-bottom:10px"><b>${m.name}</b><br>${btns}</div>`;
    }).join('');
  }

  let mem=members.find(m=>m.name===currentUser);
  if(mem){
    let st=document.getElementById('memberStatus'); if(st) st.innerText=getWithdrawStatus(mem);
    let wb=document.getElementById('withdrawBtn'); if(wb){ if(canWithdraw(mem)) wb.classList.remove('hidden'); else wb.classList.add('hidden'); }
  }
  let drawEl=document.getElementById('drawList'); if(drawEl) drawEl.innerHTML=drawBoxes.length===0?"Abhi koi Draw nahi hua":drawBoxes.map(d=>`🎉 ${d.month} - <b>${d.winner}</b> - ${d.date}`).join('<br>');
  let histEl=document.getElementById('historyList'); if(histEl) histEl.innerHTML=history.slice(-20).reverse().map(h=>`• ${h.text} - ${h.date}`).join('<br>');
}
document.addEventListener('DOMContentLoaded', render);
render();
