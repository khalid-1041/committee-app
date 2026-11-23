let shop = JSON.parse(localStorage.getItem('kf_shop_only')) || {name:"Meri Dukan", type:"Kiryana Store"};

let stock = JSON.parse(localStorage.getItem('kf_stock_only')) || [
  {name:"Cheeni", buy:170, sell:190, qty:20, unit:"Kg"},
  {name:"Daal", buy:280, sell:320, qty:15, unit:"Kg"},
  {name:"Surf", buy:180, sell:220, qty:10, unit:"Packet"}
];

let customers = JSON.parse(localStorage.getItem('kf_cust_only')) || [
  {name:"Ahmed Bhai", phone:"0300-1111111", address:"Main Bazar", udhaar:0},
  {name:"Usman", phone:"0300-2222222", address:"Street 2", udhaar:0}
];

let sales = JSON.parse(localStorage.getItem('kf_sales_only')) || [];

function save(){
  localStorage.setItem('kf_shop_only', JSON.stringify(shop));
  localStorage.setItem('kf_stock_only', JSON.stringify(stock));
  localStorage.setItem('kf_cust_only', JSON.stringify(customers));
  localStorage.setItem('kf_sales_only', JSON.stringify(sales));
  render();
}

function openModal(id){ document.getElementById(id).style.display='block'; }
function closeModal(id){ document.getElementById(id).style.display='none'; }

function saveShopSettings(){
  shop.name = document.getElementById('shopNameInput').value || shop.name;
  shop.type = document.getElementById('shopTypeInput').value;
  save(); closeModal('settingsModal');
}

function addStock(){
  let n = document.getElementById('sName').value.trim();
  let b = parseInt(document.getElementById('sBuy').value) || 0;
  let s = parseInt(document.getElementById('sSell').value) || 0;
  let q = parseInt(document.getElementById('sQty').value) || 0;
  if(!n){ alert('Naam likho'); return; }
  stock.push({name:n, buy:b, sell:s, qty:q, unit:document.getElementById('sUnit').value});
  save(); closeModal('stockModal');
}

function deleteStock(i){ if(confirm('Delete?')){ stock.splice(i,1); save(); } }

function addCustomer(){
  let n = document.getElementById('cName').value.trim();
  if(!n){ alert('Naam likho'); return; }
  customers.push({name:n, phone:document.getElementById('cPhone').value, address:document.getElementById('cAddress').value, udhaar:0});
  save(); closeModal('customerModal');
}

function payUdhaar(i){
  let amt = parseInt(prompt(customers[i].name + ' ne kitne paise diye? Udhaar: ' + customers[i].udhaar)) || 0;
  if(amt > 0){
    customers[i].udhaar = Math.max(0, customers[i].udhaar - amt);
    save();
    alert('Shukriya! Baqi udhaar: ' + customers[i].udhaar);
  }
}

function deleteCustomer(i){ if(confirm('Delete?')){ customers.splice(i,1); save(); } }

function doSale(){
  let pi = document.getElementById('saleProduct').value;
  if(pi === ''){ alert('Pehle samaam select karo'); return; }
  let p = stock[pi];
  let qty = parseInt(document.getElementById('saleQty').value) || 1;
  if(qty > p.qty){ alert('Stock me sirf ' + p.qty + ' hai!'); return; }
  let type = document.getElementById('saleType').value;
  let ci = document.getElementById('saleCustomer').value;
  let total = p.sell * qty;
  let profit = (p.sell - p.buy) * qty;
  p.qty -= qty;
  if(type === 'Udhaar'){
    if(ci === ''){ alert('Udhaar ke liye customer select karo'); p.qty += qty; return; }
    customers[ci].udhaar += total;
  }
  sales.unshift({item:p.name, qty:qty, total:total, profit:profit, type:type, customer: ci !== '' ? customers[ci].name : 'Cash Customer', date:new Date().toLocaleString()});
  save(); showBill(sales[0]);
}

function showBill(s){
  document.getElementById('receiptBox').innerHTML = '<div style="text-align:center"><h2>🧾 Bill - ' + shop.name + '</h2><p>' + s.item + ' x ' + s.qty + '<br>Total: <b>' + s.total.toLocaleString() + ' PKR</b><br>Profit: ' + s.profit + ' PKR<br>Type: ' + s.type + ' - ' + s.customer + '<br><small>' + s.date + '</small></p><button class="green" onclick="closeModal(\'receiptModal\')">Close</button></div>';
  openModal('receiptModal');
}

function clearSaleHistory(){ if(confirm('Sale history clear?')){ sales = []; save(); } }

function shareApp(){
  window.open('https://wa.me/?text=' + encodeURIComponent('🏪 KF DUKAN PRO APP\nAb copy wala khata khatam!\nStock + Sale + Udhaar + Profit - Sab Mobile Me\nPrice: Sirf 10,000 PKR\nOrder: WhatsApp 03027911041 - Khalid Farooq'));
}

function render(){
  document.getElementById('topShopName').innerText = shop.name;
  document.getElementById('topShopType').innerText = shop.type + ' • KF Dukan Pro';
  let tSale = sales.reduce((a,s)=>a+s.total,0);
  let tProfit = sales.reduce((a,s)=>a+s.profit,0);
  let tUdhaar = customers.reduce((a,c)=>a+c.udhaar,0);
  document.getElementById('todaySale').innerText = tSale.toLocaleString() + ' PKR';
  document.getElementById('todayProfit').innerText = tProfit.toLocaleString() + ' PKR';
  document.getElementById('totalUdhaar').innerText = tUdhaar.toLocaleString() + ' PKR';
  document.getElementById('totalStock').innerText = stock.length;
  document.getElementById('totalCust').innerText = customers.length;

  let sp = document.getElementById('saleProduct'); sp.innerHTML = '';
  stock.forEach((p,i)=>{ let o=document.createElement('option'); o.value=i; o.text=p.name+' - '+p.sell+' PKR ('+p.qty+' '+p.unit+')'; sp.appendChild(o); });

  let sc = document.getElementById('saleCustomer'); sc.innerHTML = '<option value="">Cash Customer</option>';
  customers.forEach((c,i)=>{ let o=document.createElement('option'); o.value=i; o.text=c.name+' - Udhaar: '+c.udhaar; sc.appendChild(o); });

  let sl = document.getElementById('stockList'); sl.innerHTML = '';
  if(stock.length===0) sl.innerHTML='<p>Stock khaali hai.</p>';
  stock.forEach((p,i)=>{
    let d=document.createElement('div'); d.className='item';
    d.innerHTML='<b>'+p.name+'</b> - Kharid: '+p.buy+' | Bechna: '+p.sell+' | Profit: '+(p.sell-p.buy)+'<br>Stock: <b>'+p.qty+' '+p.unit+'</b> '+(p.qty<=2?'<span style="color:red">⚠️ Khatam hone wala!</span>':'')+'<br><button class="btn" onclick="deleteStock('+i+')">🗑 Delete</button>';
    sl.appendChild(d);
  });

  let cl = document.getElementById('customerList'); cl.innerHTML = '';
  customers.forEach((c,i)=>{
    let d=document.createElement('div'); d.className='item';
    d.innerHTML='<b>'+c.name+'</b> - '+c.phone+' - '+c.address+'<br>Udhaar: <b style="color:'+(c.udhaar>0?'red':'green')+'">'+c.udhaar.toLocaleString()+' PKR</b><br><button class="btn" onclick="payUdhaar('+i+')">💰 Paise Milye</button><button class="btn" onclick="window.open(\'https://wa.me/?text=\'+encodeURIComponent(\'Assalam-o-Alaikum '+c.name+', aapka udhaar '+c.udhaar+' PKR baqi hai. - '+shop.name))">WhatsApp Reminder</button><button class="btn" style="color:red;border-color:red" onclick="deleteCustomer('+i+')">🗑</button>';
    cl.appendChild(d);
  });

  let sh = document.getElementById('saleHistory'); sh.innerHTML = '';
  if(sales.length===0) sh.innerHTML='<p>Abhi koi sale nahi.</p>';
  sales.slice(0,20).forEach(s=>{ sh.innerHTML+='<div class="item">🛒 '+s.item+' x '+s.qty+' = '+s.total.toLocaleString()+' PKR | Profit: '+s.profit+' | '+s.type+' - '+s.customer+'<br><small>'+s.date+'</small></div>'; });
}

render();
