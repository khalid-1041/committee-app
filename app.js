// ===== COMMITTEE APP - COMPLETE FINAL app.js =====
let members = [];
let calendar = {};
let drawBoxes = [];
let history = [];
let proofs = [];
let currentUser = null;
let isAdmin = false;
let editingMemberId = null;

// ===== LOAD =====
function loadLocal(){
  try{
    members = JSON.parse(localStorage.getItem("members") || "[]");
    calendar = JSON.parse(localStorage.getItem("calendar") || "{}");
    drawBoxes = JSON.parse(localStorage.getItem("drawBoxes") || "[]");
    history = JSON.parse(localStorage.getItem("history") || "[]");
  }catch(e){ members=[]; calendar={}; drawBoxes=[]; history=[]; }
}
if(localStorage.getItem("firstTime") !== "done"){
  members=[]; calendar={}; drawBoxes=[]; history=[]; proofs=[];
  localStorage.setItem("firstTime","done");
  localStorage.setItem("members","[]");
} else { loadLocal(); }

// ===== SAVE =====
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
      await window.fb.setDoc(window.fb.doc(window.fb.db,"committee","members"),{
        members, calendar, drawBoxes, history,
        updatedAt: new Date().toString(),
        totalMonths: getTotalMonths()
      });
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

// ===== AUTO COMMITTEE =====
function getTotalMonths(){ return members.length; }
function getCommitteeInfo(){
  let t = getTotalMonths();
  return `📊 Total Member: ${t} | Committee: ${t} Mahine ki | Har Mahine 1 Draw`;
}
function getPaidCount(name){
  if(!calendar[name]) return 0;
  return Object.values(calendar[name]).filter(v=>v==="paid").length;
}

// ===== LOGIN =====
function showLogin(type){
  document.getElementById('adminLogin').classList.toggle('hidden', type!=='admin');
  document.getElementById('memberLogin').classList.toggle('hidden', type!=='member');
}
function doAdminLogin(){
  let p = document.getElementById('adminPass').value;
  if(p==="1234"){
    isAdmin=true; currentUser="Admin";
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainScreen').classList.remove('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    document.getElementById('welcomeText').innerText="Welcome Admin";
    document.getElementById('roleText').innerText="Aap Admin hain - Sab kuch control kar sakte hain";
    render();
  } else alert("Ghalat Password! 1234 likhen");
}
function doMemberLogin(){
  let name = document.getElementById('memberNameInput').value.trim();
  if(!name){ alert("Naam likhen"); return; }
  let m = members.find(x=>x.name.toLowerCase()===name.toLowerCase());
  if(!m){ alert("Member nahi mila! Pehle Admin se Add karwayen"); return; }
  isAdmin=false; currentUser=m.name;
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('mainScreen').classList.remove('hidden');
  document.getElementById('memberPanel').classList.remove('hidden');
  document.getElementById('welcomeText').innerText="Welcome "+m.name;
  document.getElementById('roleText').innerText="Aap Member hain";
  render();
}
function doLogout(){
  currentUser=null; isAdmin=false;
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('mainScreen').classList.add('hidden');
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
  if(members.find(m=>m.name.toLowerCase()===name.toLowerCase())){ alert("Ye member pehle se hai!"); return; }
  let nm={ id: Date.now(), name, phone, amount: parseInt(amount)||0, joinedDate: new Date().toLocaleDateString() };
  members.push(nm);
  calendar[nm.name]={};
  history.push({type:"add", text:`${nm.name} ko add kiya gaya`, date:new Date().toLocaleString()});
  document.getElementById('newName').value=""; document.getElementById('newPhone').value=""; document.getElementById('newAmount').value="";
  save();
  alert(nm.name+" Add ho gaya! Ab Committee "+getTotalMonths()+" Mahine ki hai");
}
function editMember(id){
  let m=members.find(x=>x.id===id);
  if(!m) return;
  editingMemberId=m.id;
  document.getElementById('editName').value=m.name;
  document.getElementById('editPhone').value=m.phone||"";
  document.getElementById('editAmount').value=m.amount||"";
  document.getElementById('editBox').style.display='block';
}
function doSaveEdit(){
  let m=members.find(x=>x.id===editingMemberId);
  if(!m) return;
  let oldName=m.name;
  let newName=document.getElementById('editName').value.trim();
  let newPhone=document.getElementById('editPhone').value.trim();
  let newAmount=document.getElementById('editAmount').value;
  if(!newName){ alert("Naam khali nahi ho sakta"); return; }
  if(oldName!==newName){
    if(calendar[oldName]){ calendar[newName]=calendar[oldName]; delete calendar[oldName]; }
    drawBoxes.forEach(b=>{ if(b.winner===oldName) b.winner=newName; });
  }
  m.name=newName; m.phone=newPhone; m.amount=parseInt(newAmount)||0;
  history.push({type:"edit", text:`${oldName} ko Edit karke ${newName} kar diya`, date:new Date().toLocaleString()});
  editingMemberId=null;
  document.getElementById('editBox').style.display='none';
  save();
  alert("✅ "+newName+" Update ho gaya!");
}
function closeEdit(){ editingMemberId=null; document.getElementById('editBox').style.display='none'; }
function deleteMember(name){
  if(!confirm(name+" ko delete karna hai?")) return;
  members=members.filter(m=>m.name!==name);
  delete calendar[name];
  drawBoxes=drawBoxes.filter(b=>b.winner!==name);
  history.push({type:"delete", text:`${name} ko delete kiya gaya`, date:new Date().toLocaleString()});
  save();
}
function clearAll(){
  if(!confirm("SARA DATA DELETE karna hai?")) return;
  members=[]; calendar={}; drawBoxes=[]; history=[];
  localStorage.clear(); localStorage.setItem("firstTime","done");
  save(); alert("Sara Data Clear ho gaya");
}

// ===== PAYMENT =====
function togglePaid(memberName, monthKey){
  if(!calendar[memberName]) calendar[memberName]={};
  if(calendar[memberName][monthKey]==="paid"){ calendar[memberName][monthKey]="unpaid"; }
  else { calendar[memberName][monthKey]="paid"; history.push({type:"paid", text:`${memberName} ne ${monthKey} ki qist jama ki`, date:new Date().toLocaleString()}); }
  save();
}

// ===== DRAW =====
function doDrawNow(){
  if(members.length===0){ alert("Pehle member add karen"); return; }
  let alreadyWon=drawBoxes.map(b=>b.winner);
  let eligible=members.filter(m=>!alreadyWon.includes(m.name));
  if(eligible.length===0){ alert("Sab ki committee nikal chuki hai!"); return; }
  let winner=eligible[Math.floor(Math.random()*eligible.length)];
  let draw={ winner:winner.name, month:`Month-${drawBoxes.length+1}`, date:new Date().toLocaleString() };
  drawBoxes.push(draw);
  history.push({type:"draw", text:`${draw.month} ka Draw - Winner: ${winner.name}`, date:draw.date});
  save();
  alert(`🎉 Mubarak ho! ${winner.name} ki Committee nikal gayi!`);
}

// ===== WITHDRAW - LOCK =====
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
  if(!isWon) return `⏳ Abhi aapki committee nahi nikli. Withdraw ka option baad me aayega. (Paid: ${paid}/${total})`;
  if(paid<total) return `⏳ Aapki committee nikal gayi hai, Collection poori hote hi Withdraw khul jayega. (Paid: ${paid}/${total})`;
  return `✅ Mubarak ho! Aap Withdraw kar sakte hain. (Paid: ${paid}/${total})`;
}
function doWithdraw(){
  let member=members.find(m=>m.name===currentUser);
  if(!member && isAdmin) { alert("Admin se withdraw nahi hota"); return; }
  if(!member) return;
  if(!canWithdraw(member)){ alert(getWithdrawStatus(member)); return; }
  if(!confirm(member.name+" ko Withdraw dena hai?")) return;
  history.push({type:"withdraw", text:`${member.name} ne Withdraw liya`, date:new Date().toLocaleString()});
  save(); alert(`💰 ${member.name} ka Withdraw ho gaya!`);
}

// ===== RENDER =====
function render(){
  let infos=document.querySelectorAll('.committee-info, #committeeInfo');
  infos.forEach(el=>el.innerText=getCommitteeInfo());
  let cnt=document.getElementById('memberCount'); if(cnt) cnt.innerText=members.length;

  let listEl=document.getElementById('membersList');
  if(listEl){
    if(members.length===0){
      listEl.innerHTML=`<div style="text-align:center;padding:20px;color:#888">Koi member nahi hai.<br>Admin se naya member Add karwayen.</div>`;
    } else {
      listEl.innerHTML=members.map(m=>{
        let paid=getPaidCount(m.name); let total=getTotalMonths();
        let won=drawBoxes.some(b=>b.winner===m.name);
        let canW=canWithdraw(m);
        return `<div class="member">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div><b>${m.name}</b><br><span class="small">📞 ${m.phone||"No Phone"} | 💰 ${m.amount||0}/mahina | Paid: ${paid}/${total} ${won?"🎉 Draw Jeeta":""}</span></div>
            ${isAdmin?`<div style="display:flex;gap:6px"><button onclick="editMember(${m.id})" style="background:#007bff;color:#fff;border:none;padding:7px 10px;border-radius:8px">✏️ Edit</button><button onclick="deleteMember('${m.name}')" style="background:#ff4444;color:#fff;border:none;padding:7px 10px;border-radius:8px">🗑️</button></div>`:""}
          </div>
          <div style="margin-top:6px;font-size:13px;color:${canW?"green":"#888"}">${canW?"✅ Withdraw Available":getWithdrawStatus(m)}</div>
        </div>`;
      }).join('');
    }
  }

  // Calendar - Har member ke liye mahine ke button
  let calEl=document.getElementById('calendarList');
  if(calEl){
    let total=getTotalMonths();
    if(total===0) calEl.innerHTML="Pehle member add karen";
    else {
      calEl.innerHTML=members.map(m=>{
        let btns="";
        for(let i=1;i<=total;i++){
          let key="Month-"+i;
          let isPaid=calendar[m.name] && calendar[m.name][key]==="paid";
          btns+=`<button onclick="togglePaid('${m.name}','${key}')" style="padding:7px 10px;margin:3px;border:none;border-radius:8px;background:${isPaid?"#0A7A3A":"#eee"};color:${isPaid?"#fff":"#333"}">M${i} ${isPaid?"✅":""}</button>`;
        }
        return `<div style="margin-bottom:12px"><b>${m.name}</b><br>${btns}</div>`;
      }).join('');
    }
  }

  // Member Panel - Withdraw button
  let mem=members.find(m=>m.name===currentUser);
  if(mem){
    let st=document.getElementById('memberStatus'); if(st) st.innerText=getWithdrawStatus(mem);
    let wb=document.getElementById('withdrawBtn');
    if(wb){ if(canWithdraw(mem)){ wb.classList.remove('hidden'); } else { wb.classList.add('hidden'); } }
  }

  let drawEl=document.getElementById('drawList');
  if(drawEl) drawEl.innerHTML=drawBoxes.length===0?"Abhi koi Draw nahi hua":drawBoxes.map(d=>`🎉 ${d.month} - <b>${d.winner}</b> - ${d.date}`).join('<br>');

  let histEl=document.getElementById('historyList');
  if(histEl) histEl.innerHTML=history.slice(-20).reverse().map(h=>`• ${h.text} - ${h.date}`).join('<br>');
}

document.addEventListener('DOMContentLoaded', render);
render();

// Export
window.showLogin=showLogin; window.doAdminLogin=doAdminLogin; window.doMemberLogin=doMemberLogin;
window.doLogout=doLogout; window.doAddMember=doAddMember; window.editMember=editMember;
window.doSaveEdit=doSaveEdit; window.closeEdit=closeEdit; window.deleteMember=deleteMember;
window.clearAll=clearAll; window.togglePaid=togglePaid; window.doDrawNow=doDrawNow;
window.doWithdraw=doWithdraw; window.getTotalMonths=getTotalMonths;
