const $ = (s) => document.querySelector(s);
const state = {
  assets: JSON.parse(localStorage.getItem("andri_assets") || "[]"),
  notes: localStorage.getItem("andri_notes") || "",
  mailbox: JSON.parse(localStorage.getItem("andri_mailbox") || "null")
};

function saveState() {
  localStorage.setItem("andri_assets", JSON.stringify(state.assets));
  localStorage.setItem("andri_notes", state.notes);
  if (state.mailbox) localStorage.setItem("andri_mailbox", JSON.stringify(state.mailbox));
  else localStorage.removeItem("andri_mailbox");
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c])); }
function formatBytes(n) { if(n<1024)return n+" B"; if(n<1024**2)return (n/1024).toFixed(1)+" KB"; return (n/1024**2).toFixed(1)+" MB"; }
function tick(){const d=new Date();$("#clock").textContent=[d.getHours(),d.getMinutes(),d.getSeconds()].map(x=>String(x).padStart(2,"0")).join(".");}
setInterval(tick,1000);tick();

function renderGallery(){
  const q=($("#searchInput").value||"").toLowerCase();
  const list=state.assets.filter(a=>(a.name+" "+a.type).toLowerCase().includes(q));
  $("#gallery").innerHTML=list.length?list.map(a=>`<article class="asset"><div class="asset-preview">${a.type==="Foto"?`<img src="${a.data}" alt="${escapeHtml(a.name)}">`:a.type==="Video"?`<video src="${a.data}" controls></video>`:a.type==="Musik"?"🎵":"📄"}</div><div class="asset-info"><strong title="${escapeHtml(a.name)}">${escapeHtml(a.name)}</strong><small>${a.type} • ${formatBytes(a.size)}</small><br><button class="delete" data-delete="${a.id}">Hapus</button></div></article>`).join(""):`<div class="empty">Belum ada arsip.</div>`;
  document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>{state.assets=state.assets.filter(a=>a.id!==b.dataset.delete);saveState();renderGallery();});
}
document.querySelectorAll('input[type="file"]').forEach(input=>input.addEventListener("change",e=>{
  const file=e.target.files[0];if(!file)return;
  if(file.size>12*1024*1024){alert("File maksimal 12 MB.");return;}
  const reader=new FileReader();reader.onload=()=>{state.assets.unshift({id:crypto.randomUUID(),name:file.name,type:input.dataset.type,size:file.size,data:reader.result});saveState();renderGallery();input.value="";};reader.readAsDataURL(file);
}));
$("#searchInput").addEventListener("input",renderGallery);
$("#notes").value=state.notes;
$("#saveNoteBtn").onclick=()=>{state.notes=$("#notes").value;saveState();alert("Catatan disimpan.");};
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));t.classList.add("active");$("#archivePanel").classList.toggle("hidden",t.dataset.tab!=="archive");$("#notesPanel").classList.toggle("hidden",t.dataset.tab!=="notes");});

function renderMailbox(){
  if(state.mailbox){$("#mailAddress").value=state.mailbox.address;$("#mailStatus").textContent="● ACTIVE";$("#mailInfo").textContent="Mailbox dibuat "+new Date(state.mailbox.createdAt).toLocaleString("id-ID");}
  else{$("#mailAddress").value="";$("#mailStatus").textContent="● OFFLINE";$("#mailInfo").textContent="Belum ada mailbox.";}
}
async function createMailbox(){
  $("#newMailBtn").disabled=true;$("#newMailBtn").textContent="Membuat...";
  try{const r=await fetch("/api/mail-create",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});const data=await r.json();if(!r.ok||!data.ok)throw new Error(data.error||"API MailTemp gagal");state.mailbox=data;saveState();renderMailbox();await refreshInbox();}
  catch(e){alert(e.message);}
  finally{$("#newMailBtn").disabled=false;$("#newMailBtn").textContent="Buat Email";}
}
async function refreshInbox(){
  if(!state.mailbox){alert("Buat email terlebih dahulu.");return;}
  $("#mailInfo").textContent="Memuat inbox...";
  try{const r=await fetch("/api/mail-inbox",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:state.mailbox.token})});const data=await r.json();if(!r.ok||!data.ok)throw new Error(data.error||"Gagal mengambil inbox");$("#mailStatus").textContent="● ACTIVE";$("#inbox").innerHTML=data.messages.length?data.messages.map(m=>`<button class="mail-item" data-mail="${m.id}"><div><strong>${escapeHtml(m.subject)}</strong><p>${escapeHtml(m.from)} • ${new Date(m.createdAt).toLocaleString("id-ID")}</p><p>${escapeHtml(m.intro)}</p></div><span>›</span></button>`).join(""):`<div class="empty">Inbox kosong. Kirim email ke alamat di atas, lalu tekan Refresh Inbox.</div>`;$("#mailInfo").textContent=data.messages.length+" pesan ditemukan";document.querySelectorAll("[data-mail]").forEach(b=>b.onclick=()=>openMail(b.dataset.mail));}
  catch(e){$("#mailStatus").textContent="● EXPIRED";$("#mailInfo").textContent=e.message;alert(e.message);}
}
async function openMail(id){
  try{const r=await fetch("/api/mail-message",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:state.mailbox.token,id})});const m=await r.json();if(!r.ok||!m.ok)throw new Error(m.error||"Gagal membuka pesan");$("#modalSubject").textContent=m.subject;$("#modalMeta").textContent="Dari: "+m.from+" • "+new Date(m.createdAt).toLocaleString("id-ID");$("#modalBody").textContent=m.text||stripHtml(m.html)||"(Pesan kosong)";$("#modal").classList.remove("hidden");}catch(e){alert(e.message);}
}
function stripHtml(s){const d=document.createElement("div");d.innerHTML=s||"";return d.textContent||"";}
$("#newMailBtn").onclick=createMailbox;
$("#refreshMailBtn").onclick=refreshInbox;
$("#copyMailBtn").onclick=()=>{if(!state.mailbox)return alert("Belum ada alamat email.");if(navigator.clipboard)navigator.clipboard.writeText(state.mailbox.address).then(()=>alert("Alamat disalin."));else alert(state.mailbox.address);};
$("#closeModal").onclick=()=>$("#modal").classList.add("hidden");
$("#modal").onclick=e=>{if(e.target.id==="modal")$("#modal").classList.add("hidden");};
$("#logoutBtn").onclick=()=>{if(confirm("Hapus mailbox dan data sesi lokal?")){state.mailbox=null;saveState();renderMailbox();$("#inbox").innerHTML='<div class="empty">Belum ada mailbox.</div>';}}; 
renderGallery();renderMailbox();if(state.mailbox)refreshInbox();