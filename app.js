// ===== COMMITTEE APP - COMPLETE app.js =====
// Khalid-1041 Version - Auto Committee + Withdraw Lock + Firebase

let members = [];
let calendar = {}; // { "Bilal": { "Month-1": "paid", ... } }
let drawBoxes = []; // { winner, month, date }
let history = [];
let proofs = [];
let currentUser = null;
let isAdmin = false;

// ===== 1. LOAD DATA =====
function loadLocal(){
  try{
    members = JSON.parse(localStorage.getItem("members") || "[]");
    calendar = JSON.parse(localStorage.getItem("calendar") || "{}");
    drawBoxes = JSON.parse(localStorage.getItem("drawBoxes") || "[]");
    history = JSON.parse(localStorage.getItem("history") || "[]");
    proofs = JSON.parse(localStorage.getItem("proofs") || "[]");
  }catch(e){ members=[]; calendar={}; drawBoxes=[]; history=[]; proofs=[]; }
}

// Pehli dafa khali rakho - Dummy data nahi bharna
if(localStorage.getItem("firstTime") !== "done"){
  members = [];
  calendar = {};
  drawBoxes = [];
  history = [];
  proofs = [];
  localStorage.setItem("firstTime", "done");
  localStorage.setItem("members", "[]");
  localStorage.setItem("calendar", "{}");
  localStorage.setItem("drawBoxes", "[]");
  localStorage.setItem("history", "[]");
} else {
  loadLocal();
}

// ===== 2. SAVE DATA - Local + Firebase =====
function save(){
  localStorage.setItem("members", JSON.stringify(members));
  localStorage.setItem("calendar", JSON.stringify(calendar));
  localStorage.setItem("drawBoxes", JSON.stringify(drawBoxes));
  localStorage.setItem("history", JSON.stringify(history));
  localStorage.setItem("proofs", JSON.stringify(proofs));
  saveToFirebase();
  render();
}

async function saveToFirebase(){
  try{
    if(window.fb && window.fb.db && window.fb.setDoc && window.fb.doc){
      await window.fb.setDoc(window.fb.doc(window.fb.db, "committee", "members"), {
        members: members,
        calendar: calendar,
        drawBoxes: drawBoxes,
        history: history,
        proofs: proofs,
        updatedAt: new Date().toString(),
        totalMonths: getTotalMonths()
      });
      console.log("✅ Firebase me save ho gaya");
    }
  }catch(e){ console.log("Firebase save error:", e.message); }
}

async function loadFromFirebase(){
  try{
    if(window.fb && window.fb.db && window.fb.getDoc && window.fb.doc){
      let snap = await window.fb.getDoc(window.fb.doc(window.fb.db, "committee", "members"));
      if(snap.exists()){
        let d = snap.data();
        if(d.members) members = d.members;
        if(d.calendar) calendar = d.calendar;
        if(d.drawBoxes) drawBoxes = d.drawBoxes;
        if(d.history) history = d.history;
        if(d.proofs) proofs = d.proofs;
        localStorage.setItem("members", JSON.stringify(members));
        localStorage.setItem("calendar", JSON.stringify(calendar));
        localStorage.setItem("drawBoxes", JSON.stringify(drawBoxes));
        localStorage.setItem("history", JSON.stringify(history));
        render();
        console.log("✅ Firebase se load ho gaya");
      }
    }
  }catch(e){ console.log("Firebase load error:", e.message); }
}

// Firebase ready hone ke baad load karo
setTimeout(loadFromFirebase, 1500);

// ===== 3. AUTO COMMITTEE - JITNE MEMBER UTNE MAHINE =====
function getTotalMonths(){
  return members.length;
}

function getCommitteeInfo(){
  let total = getTotalMonths();
  return `📊 Total Member: ${total} | Committee: ${total} Mahine ki | Har Mahine 1 Draw`;
}

// ===== 4. LOGIN =====
function loginAdmin(pass){
  if(pass === "1234"){
    isAdmin = true;
    currentUser = "Admin";
    render();
    return true;
  }
  alert("Ghalat Password!");
  return false;
}

function loginMember(name, phone){
  let m = members.find(x => x.name.toLowerCase() === name.toLowerCase());
  if(!m){ alert("Member nahi mila! Pehle Admin se Add karwayen"); return false; }
  // Phone match ho to bhi theek, warna sirf naam se login kar lo
  isAdmin = false;
  currentUser = m.name;
  render();
  renderMemberView();
  return true;
}

function logout(){
  currentUser = null;
  isAdmin = false;
  render();
}

// ===== 5. ADD / DELETE MEMBER =====
function addMember(name, phone, monthlyAmount){
  if(!name) { alert("Naam likhen"); return; }
  if(members.find(m => m.name.toLowerCase() === name.toLowerCase())){
    alert("Ye member pehle se hai!"); return;
  }
  let newMember = {
    id: Date.now(),
    name: name.trim(),
    phone: phone || "",
    amount: monthlyAmount || 0,
    joinedDate: new Date().toLocaleDateString(),
    totalPaid: 0,
    totalMonthsPaid: 0
  };
  members.push(newMember);
  calendar[newMember.name] = {};
  history.push({ type: "add", text: `${newMember.name} ko add kiya gaya`, date: new Date().toLocaleString() });
  console.log("Member add hua, ab committee: " + getTotalMonths() + " mahine ki ho gayi");
  save();
  alert(newMember.name + " Add ho gaya! Ab Committee " + getTotalMonths() + " Mahine ki hai");
}

function deleteMember(name){
  if(!confirm(name + " ko delete karna hai?")) return;
  members = members.filter(m => m.name !== name);
  delete calendar[name];
  drawBoxes = drawBoxes.filter(b => b.winner !== name);
  history.push({ type: "delete", text: `${name} ko delete kiya gaya`, date: new Date().toLocaleString() });
  console.log("Member delete hua, ab committee: " + getTotalMonths() + " mahine ki ho gayi");
  save();
}

function clearAllData(){
  if(!confirm("SARA DATA DELETE karna hai? Ye wapas nahi aayega!")) return;
  members = []; calendar = {}; drawBoxes = []; history = []; proofs = [];
  localStorage.clear();
  localStorage.setItem("firstTime", "done");
  save();
  alert("Sara Dummy Data Delete ho gaya, App ab khali hai");
}

// ===== 6. PAYMENT - PAID / UNPAID =====
function togglePaid(memberName, monthKey){
  if(!calendar[memberName]) calendar[memberName] = {};
  if(calendar[memberName][monthKey] === "paid"){
    calendar[memberName][monthKey] = "unpaid";
  } else {
    calendar[memberName][monthKey] = "paid";
    history.push({ type: "paid", text: `${memberName} ne ${monthKey} ki qist jama kar di`, date: new Date().toLocaleString() });
  }
  save();
}

function getPaidCount(memberName){
  if(!calendar[memberName]) return 0;
  return Object.values(calendar[memberName]).filter(v => v === "paid").length;
}

// ===== 7. DRAW =====
function doDraw(monthKey){
  if(members.length === 0){ alert("Pehle member add karen"); return; }
  // Jo pehle jeet chuke hain unko dobara nahi nikalna
  let alreadyWon = drawBoxes.map(b => b.winner);
  let eligible = members.filter(m => !alreadyWon.includes(m.name));
  if(eligible.length === 0){ alert("Sab ki committee nikal chuki hai!"); return; }
  let winner = eligible[Math.floor(Math.random() * eligible.length)];
  let draw = { winner: winner.name, month: monthKey || `Month-${drawBoxes.length + 1}`, date: new Date().toLocaleString() };
  drawBoxes.push(draw);
  history.push({ type: "draw", text: `${draw.month} ka Draw - Winner: ${winner.name}`, date: draw.date });
  save();
  alert(`🎉 Mubarak ho! ${winner.name} ki Committee nikal gayi! (${draw.month})`);
}

// ===== 8. WITHDRAW - LOCK SYSTEM =====
function canWithdraw(member){
  if(!member) return false;
  let totalMonths = getTotalMonths();
  // Shart 1: Iski committee nikli ho
  let isDrawWon = drawBoxes.some(b => b.winner === member.name);
  // Shart 2: Iski collection poori ho - Jitne member utni qistain
  let paidCount = getPaidCount(member.name);
  let isCollectionDone = paidCount >= totalMonths && totalMonths > 0;
  return isDrawWon && isCollectionDone;
}

function getWithdrawStatus(member){
  if(!member) return "";
  let totalMonths = getTotalMonths();
  let paidCount = getPaidCount(member.name);
  let isDrawWon = drawBoxes.some(b => b.winner === member.name);
  if(!isDrawWon){
    return `⏳ Abhi aapki committee nahi nikli. Withdraw ka option baad me aayega. (Paid: ${paidCount}/${totalMonths})`;
  }
  if(paidCount < totalMonths){
    return `⏳ Aapki committee nikal gayi hai, Collection poori hote hi Withdraw khul jayega. (Paid: ${paidCount}/${totalMonths})`;
  }
  return `✅ Mubarak ho! Aap Withdraw kar sakte hain. (Paid: ${paidCount}/${totalMonths})`;
}

function requestWithdraw(memberName){
  let member = members.find(m => m.name === memberName);
  if(!member) return;
  if(!canWithdraw(member)){
    alert(getWithdrawStatus(member));
    return;
  }
  if(!confirm(memberName + " ko Withdraw dena hai?")) return;
  history.push({ type: "withdraw", text: `${memberName} ne Withdraw liya`, date: new Date().toLocaleString() });
  save();
  alert(`💰 ${memberName} ka Withdraw ho gaya!`);
}

// Member wali screen me Withdraw button dikhana/chupana
function renderMemberView(){
  let member = members.find(m => m.name === currentUser);
  if(!member) return;
  let withdrawBtn = document.getElementById('withdrawBtn');
  if(withdrawBtn){
    if(canWithdraw(member)){
      withdrawBtn.style.display = 'block';
      withdrawBtn.innerText = '💰 Withdraw - Apni Committee Nikalo';
      withdrawBtn.disabled = false;
    } else {
      withdrawBtn.style.display = 'none';
    }
  }
  let statusText = document.getElementById('memberStatus');
  if(statusText){
    statusText.innerText = getWithdrawStatus(member);
  }
  let infoText = document.getElementById('committeeInfo');
  if(infoText){
    infoText.innerText = getCommitteeInfo();
  }
}

// ===== 9. RENDER - SCREEN UPDATE =====
function render(){
  // Committee Info har jagah update karo
  let infos = document.querySelectorAll('.committee-info, #committeeInfo');
  infos.forEach(el => el.innerText = getCommitteeInfo());

  // Members list
  let listEl = document.getElementById('membersList');
  if(listEl){
    if(members.length === 0){
      listEl.innerHTML = `<div style="text-align:center;padding:20px;color:#888">Koi member nahi hai.<br>Admin se naya member Add karwayen.</div>`;
    } else {
      listEl.innerHTML = members.map(m => {
        let paid = getPaidCount(m.name);
        let total = getTotalMonths();
        let won = drawBoxes.some(b => b.winner === m.name);
        let canW = canWithdraw(m);
        return `
        <div style="border:1px solid #ddd;padding:12px;border-radius:12px;margin-bottom:10px;background:#fff">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div><b>${m.name}</b><br><small>${m.phone || ""} | Paid: ${paid}/${total} ${won ? "🎉 Draw Jeeta" : ""}</small></div>
            ${isAdmin ? `<button onclick="deleteMember('${m.name}')" style="background:#ff4444;color:#fff;border:none;padding:6px 10px;border-radius:8px">🗑️</button>` : ""}
          </div>
          <div style="margin-top:8px;font-size:13px;color:${canW ? "green" : "#888"}">${canW ? "✅ Withdraw Available" : getWithdrawStatus(m)}</div>
          ${isAdmin ? `<button onclick="requestWithdraw('${m.name}')" ${canW ? "" : "disabled style='opacity:0.4'"} style="margin-top:8px;padding:8px 12px;background:#0A7A3A;color:#fff;border:none;border-radius:8px">💰 Withdraw</button>` : ""}
          ${!isAdmin && currentUser === m.name ? `<button id="withdrawBtn" onclick="requestWithdraw('${m.name}')" style="display:${canW ? "block" : "none"};margin-top:8px;padding:10px;background:#0A7A3A;color:#fff;border:none;border-radius:8px;width:100%">💰 Withdraw</button><p id="memberStatus" style="font-size:13px">${getWithdrawStatus(m)}</p>` : ""}
        </div>`;
      }).join('');
    }
  }

  // Draw list
  let drawEl = document.getElementById('drawList');
  if(drawEl){
    drawEl.innerHTML = drawBoxes.length === 0 ? "Abhi koi Draw nahi hua" : drawBoxes.map(d => `🎉 ${d.month} - <b>${d.winner}</b> - ${d.date}`).join('<br>');
  }

  // History
  let histEl = document.getElementById('historyList');
  if(histEl){
    histEl.innerHTML = history.slice(-20).reverse().map(h => `• ${h.text} - ${h.date}`).join('<br>');
  }

  if(currentUser && !isAdmin) renderMemberView();
}

// Pehli dafa render karo
document.addEventListener('DOMContentLoaded', render);
render();

// ===== 10. EXPORT FOR HTML BUTTONS =====
window.addMember = addMember;
window.deleteMember = deleteMember;
window.togglePaid = togglePaid;
window.doDraw = doDraw;
window.loginAdmin = loginAdmin;
window.loginMember = loginMember;
window.logout = logout;
window.requestWithdraw = requestWithdraw;
window.clearAllData = clearAllData;
window.getTotalMonths = getTotalMonths;
window.getCommitteeInfo = getCommitteeInfo;
window.canWithdraw = canWithdraw;
