/*
  MAAEEENN. — ADMIN ONLINE. Perubahan konten dibuat lewat website setelah login.
  Isi SUPABASE_URL dan SUPABASE_ANON_KEY di bawah untuk data online.
  Jangan pernah memasukkan secret/service_role key atau password admin ke file publik.
*/

const SUPABASE_URL = "PASTE_SUPABASE_PROJECT_URL_HERE";
const SUPABASE_ANON_KEY = "PASTE_SUPABASE_ANON_OR_PUBLISHABLE_KEY_HERE";

// TAMBAH / EDIT EPISODE DI SINI. Setiap episode punya foto dan lagu sendiri.
// Contoh: file: "photos/pantai/foto-1.jpg" berarti foto disimpan di folder photos/pantai/.
const ALBUMS = [
  {
    id: "jalan-sore", title: "JALAN SORE (KATANYA)", date: "EPISODE 01 • 12 JULI 2026",
    description: "Niatnya cuma keluar sebentar, ujung-ujungnya pulang bawa 200 foto.",
    label: "the spontaneous one", color: "pink", cover: "photos/jalan-sore/foto-1.jpg",
    song: "photos/jalan-sore/soundtrack.mp3", songCaption: "Soundtrack resmi jalan tanpa tujuan.",
    photos: [
      {file:"photos/jalan-sore/foto-1.jpg",caption:"bukti kita pernah keluar rumah",tag:"IMG_001",date:"START"},
      {file:"photos/jalan-sore/foto-2.jpg",caption:"katanya cuma sebentar",tag:"IMG_002",date:"CHAOS"},
      {file:"photos/jalan-sore/foto-3.jpg",caption:"pulangnya malah kemaleman",tag:"IMG_003",date:"ENDING"}
    ]
  },
  {
    id: "kuliner-random", title: "MISI CARI MAKAN", date: "EPISODE 02 • 03 AGUSTUS 2026",
    description: "Rapat penting: mau makan apa? Keputusan diambil setelah 67 menit.",
    label: "food first, logic later", color: "yellow", cover: "photos/kuliner-random/foto-1.jpg",
    song: "photos/kuliner-random/soundtrack.mp3", songCaption: "Biar makan makin dramatis.",
    photos: [
      {file:"photos/kuliner-random/foto-1.jpg",caption:"pilih menu aja debat",tag:"IMG_001",date:"HUNGRY"},
      {file:"photos/kuliner-random/foto-2.jpg",caption:"foto dulu baru boleh makan",tag:"IMG_002",date:"PRIORITY"},
      {file:"photos/kuliner-random/foto-3.jpg",caption:"piring kosong = sukses",tag:"IMG_003",date:"SOLD OUT"}
    ]
  },
  {
    id: "weekend-chaos", title: "WEEKEND CHAOS", date: "EPISODE 03 • 20 SEPTEMBER 2026",
    description: "Tidak ada rundown. Tidak ada arah. Tapi entah kenapa seru banget.",
    label: "zero plans, full memories", color: "blue", cover: "photos/weekend-chaos/foto-1.jpg",
    song: "photos/weekend-chaos/soundtrack.mp3", songCaption: "Lagu untuk kejadian yang nggak direncanain.",
    photos: [
      {file:"photos/weekend-chaos/foto-1.jpg",caption:"mulai dari sini semua kacau",tag:"IMG_001",date:"PROLOG"},
      {file:"photos/weekend-chaos/foto-2.jpg",caption:"ini siapa yang punya ide",tag:"IMG_002",date:"PLOT TWIST"},
      {file:"photos/weekend-chaos/foto-3.jpg",caption:"see u next episode",tag:"IMG_003",date:"CREDITS"}
    ]
  }
];
let activeAlbum = null;
const DEFAULT_ALBUMS = structuredClone(ALBUMS);
let isAdmin = false;
let remoteVersion = null;

const REACTIONS = ["😂", "❤️", "😭", "🫡"];
const hasSupabaseConfig = SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("PASTE_") &&
  SUPABASE_ANON_KEY.length > 20 &&
  !SUPABASE_ANON_KEY.includes("PASTE_");

const db = (hasSupabaseConfig && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const photoGrid = document.getElementById("photo-grid");
const commentForm = document.getElementById("comment-form");
const commentText = document.getElementById("comment-text");
const commentName = document.getElementById("comment-name");
const charCount = document.getElementById("char-count");
const formStatus = document.getElementById("form-status");
const commentsList = document.getElementById("comments-list");
const commentTotal = document.getElementById("comment-total");
const submitButton = document.getElementById("submit-comment");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxCaption = document.getElementById("lightbox-caption");

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[ch]));
}

function renderAlbums() {
  document.getElementById("album-counter").textContent = `${ALBUMS.length} EPISODE`;
  document.getElementById("album-grid").innerHTML = ALBUMS.map((album, index) => `
    <a class="album-card album-${escapeHTML(album.color)}" href="#album/${encodeURIComponent(album.id)}">
      <div class="album-cover">
        <img src="${escapeHTML(album.cover)}" alt="" loading="lazy" onerror="this.style.display='none'">
        <span class="album-cover-fallback">EP. ${String(index+1).padStart(2,"0")} ✹<br><small>YOUR MEMORY HERE</small></span>
        <span class="album-number">FILE / ${String(index+1).padStart(2,"0")}</span>
      </div>
      <div class="album-card-body"><p class="eyebrow">${escapeHTML(album.date)}</p><h3>${escapeHTML(album.title)} ↗</h3>
        <p>${escapeHTML(album.description)}</p><span class="album-card-footer">${album.photos.length} BARANG BUKTI <span>${escapeHTML(album.label)}</span></span></div>
    </a>`).join("");
}

function showRoute() {
  const slug = decodeURIComponent(location.hash.slice(7));
  const chosen = location.hash.startsWith("#album/") ? ALBUMS.find(a => a.id === slug) : null;
  const changed = activeAlbum?.id !== chosen?.id;
  activeAlbum = chosen || null;
  document.getElementById("episodes").hidden = !!chosen;
  document.getElementById("album-detail").hidden = !chosen;
  if (chosen) {
    const i = ALBUMS.indexOf(chosen);
    fillEpisodeEditor(chosen);
    document.getElementById("album-position").textContent = `EP ${i+1} / ${ALBUMS.length}`;
    document.getElementById("album-date").textContent = chosen.date;
    document.getElementById("album-title").textContent = chosen.title;
    document.getElementById("album-description").textContent = chosen.description;
    document.getElementById("folder-name").textContent = chosen.id;
    document.getElementById("song-caption").textContent = chosen.songCaption;
    document.getElementById("song-instruction").textContent = chosen.song ? "Putar lagu episode ini 🎵" : "Belum ada lagu untuk episode ini.";
    const audio = document.getElementById("soundtrack");
    audio.pause(); if (chosen.song) { audio.src = chosen.song; audio.load(); } else { audio.removeAttribute("src"); audio.load(); }
    document.getElementById("album-next").innerHTML = ALBUMS.length > 1 ? `<a href="#album/${encodeURIComponent(ALBUMS[(i+1)%ALBUMS.length].id)}" class="button button-pink">EPISODE SELANJUTNYA →</a>` : "";
    renderPhotos();
    loadReactions();
  }
  if (changed) window.scrollTo({top:0,behavior:"instant"});
}

function renderPhotos() {
  if (!activeAlbum) return;
  const photos = activeAlbum.photos;
  document.getElementById("photo-counter").textContent = `${photos.length} BUKTI`;
  photoGrid.innerHTML = photos.map((photo, index) => `
    <article class="photo-card" data-photo-index="${index}">
      <button class="photo-image-button" type="button" aria-label="Perbesar foto ${index + 1}">
        <img class="photo-image" src="${escapeHTML(photo.file)}" alt="${escapeHTML(photo.caption)}"
          loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <span class="photo-placeholder" style="display:none">TARUH FOTO DI SINI ✹<br><small>${escapeHTML(photo.file)}</small></span>
      </button>
      <p class="photo-caption">${escapeHTML(photo.caption)}</p>
      <div class="photo-meta"><span>${escapeHTML(photo.tag)}</span><span>${escapeHTML(photo.date)}</span></div>
      <div class="admin-photo-actions" ${!isAdmin ? "hidden" : ""}><button class="delete-photo" type="button" data-delete="${index}">✕ HAPUS FOTO</button><button class="delete-photo edit-caption" type="button" data-caption="${index}">✎ EDIT CAPTION</button></div>
      <div class="reaction-row" aria-label="Reaksi foto ${index + 1}">
        ${REACTIONS.map(emoji => `<button class="reaction-button" type="button" data-emoji="${emoji}" data-index="${index}" aria-label="Beri reaksi ${emoji}">${emoji} <span data-count="${index}-${emoji}">0</span></button>`).join("")}
      </div>
    </article>
  `).join("");

  photoGrid.querySelectorAll(".photo-image-button").forEach((button, index) => {
    button.addEventListener("click", () => {
      const photo = photos[index];
      const img = button.querySelector("img");
      if (img && img.naturalWidth > 0) {
        lightboxImage.src = photo.file;
        lightboxImage.alt = photo.caption;
        lightboxCaption.textContent = photo.caption;
        lightbox.showModal();
      }
    });
  });
  photoGrid.querySelectorAll(".delete-photo").forEach(button => {
    button.addEventListener("click", () => deleteUploadedPhoto(activeAlbum.id, Number(button.dataset.delete)));
  });
  photoGrid.querySelectorAll(".edit-caption").forEach(button => {
    button.addEventListener("click", () => editPhotoCaption(Number(button.dataset.caption)));
  });
  photoGrid.querySelectorAll(".reaction-button").forEach(button => {
    button.addEventListener("click", () => addReaction(Number(button.dataset.index), button.dataset.emoji, button));
  });
}

document.getElementById("close-lightbox").addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", event => {
  if (event.target === lightbox) lightbox.close();
});
commentText.addEventListener("input", () => {
  charCount.textContent = `${commentText.value.length}/500`;
});

async function loadReactions() {
  if (!db || !activeAlbum) return;
  const albumId = activeAlbum.id;
  const { data, error } = await db.from("reactions").select("photo_index, emoji").eq("album_id", albumId);
  if (error) {
    console.warn("Reactions belum bisa dimuat:", error.message);
    return;
  }
  const counts = {};
  data.forEach(row => {
    const key = `${row.photo_index}-${row.emoji}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  if (activeAlbum?.id !== albumId) return;
  Object.entries(counts).forEach(([key, count]) => {
    const target = document.querySelector(`[data-count="${key}"]`);
    if (target) target.textContent = count;
  });
}

async function addReaction(photoIndex, emoji, button) {
  if (!db) {
    setStatus("Reaksi online belum aktif. Isi konfigurasi Supabase dulu ya.", true);
    return;
  }
  const albumId = activeAlbum?.id;
  if (!albumId) return;
  const browserKey = `maaeeenn-reacted-${albumId}-${photoIndex}-${emoji}`;
  if (localStorage.getItem(browserKey)) {
    setStatus("Kamu sudah kasih reaksi ini dari browser ini 💌", true);
    return;
  }
  button.disabled = true;
  const { error } = await db.from("reactions").insert({ album_id: albumId, photo_index: photoIndex, emoji });
  button.disabled = false;
  if (error) {
    setStatus("Reaksi belum terkirim. Coba lagi sebentar ya.", true);
    console.error(error);
    return;
  }
  localStorage.setItem(browserKey, "1");
  const countEl = button.querySelector("span");
  countEl.textContent = String(Number(countEl.textContent) + 1);
}

function setStatus(message, isError = false) {
  formStatus.textContent = message;
  formStatus.style.color = isError ? "#a12245" : "#226b37";
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "baru saja";
  return date.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function renderComments(rows) {
  commentTotal.textContent = `${rows.length} pesan`;
  if (!rows.length) {
    commentsList.innerHTML = '<p class="empty-state">Belum ada yang yapping. Jadilah legenda pertama.</p>';
    return;
  }
  commentsList.innerHTML = rows.map(row => `
    <article class="comment-bubble">
      <div class="comment-head">
        <strong>${escapeHTML(row.nickname || "anonymous legend")}</strong>
        <span>${escapeHTML(formatDate(row.created_at))}</span>
      </div>
      <p class="comment-body">${escapeHTML(row.message)}</p>
    </article>
  `).join("");
}

async function loadComments() {
  if (!db) {
    commentsList.innerHTML = '<p class="empty-state">Mode preview: sambungkan Supabase untuk mengaktifkan komentar yang tersimpan online.</p>';
    return;
  }
  const { data, error } = await db.from("comments")
    .select("id, nickname, message, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    commentsList.innerHTML = '<p class="empty-state">Komentar belum bisa dimuat. Periksa konfigurasi dan kebijakan database Supabase.</p>';
    console.error(error);
    return;
  }
  renderComments(data || []);
}

commentForm.addEventListener("submit", async event => {
  event.preventDefault();
  const message = commentText.value.trim();
  const nickname = commentName.value.trim().slice(0, 24);
  if (!message) {
    setStatus("Pesannya masih kosong 👀", true);
    return;
  }
  if (message.length > 500) {
    setStatus("Pesan maksimal 500 karakter ya.", true);
    return;
  }
  if (!db) {
    setStatus("Komentar online belum aktif. Hubungkan Supabase dulu ya.", true);
    return;
  }
  submitButton.disabled = true;
  submitButton.textContent = "NGIRIM...";
  setStatus("");
  const { error } = await db.from("comments").insert({
    nickname: nickname || "anonymous legend",
    message
  });
  submitButton.disabled = false;
  submitButton.textContent = "KIRIM KE VOID ↗";
  if (error) {
    setStatus("Yah, gagal terkirim. Coba lagi nanti ya.", true);
    console.error(error);
    return;
  }
  commentText.value = "";
  charCount.textContent = "0/500";
  setStatus("Pesan berhasil masuk ke void. Makasih udah yapping 💌");
  await loadComments();
});

// Data online: dipakai bersama semua pengunjung. Browser tidak lagi menjadi tempat penyimpanan utama.
const BUCKET = 'maaeeenn-media';
const manager = document.getElementById('manager');
const uploadZone = document.getElementById('upload-zone');
const editor = document.getElementById('album-editor');
const loginStatus = document.getElementById('login-status');
const managerStatus = document.getElementById('manager-status');
function notice(id,text) {document.getElementById(id).textContent=text;}
function setAdmin(enabled){
  isAdmin=!!enabled;
  manager.hidden=!isAdmin;
  document.getElementById('admin-session').hidden=!isAdmin;
  document.getElementById('login-details').hidden=isAdmin;
  uploadZone.hidden=!isAdmin;
  editor.hidden=!isAdmin || !activeAlbum;
  if(activeAlbum) renderPhotos();
}
function fillEpisodeEditor(a){
  editor.hidden=!isAdmin || !a;
  if(!a)return;
  for(const [key,value] of Object.entries({title:a.title,date:a.date,description:a.description,songCaption:a.songCaption,songUrl:a.song})){
    document.getElementById('edit-'+key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())).value=value||'';
  }
}
function safeMediaUrl(url){
  if (!url) return '';
  try { const u=new URL(url,location.href); return ['http:','https:'].includes(u.protocol)?u.href:''; }
  catch{return '';}
}
async function loadOnline(){
  if(!db) {managerStatus.textContent='Website belum disambungkan ke Supabase. Ikuti PANDUAN_SETUP.txt.';renderAlbums();showRoute();return;}
  const {data,error}=await db.from('site_content').select('albums, updated_at').eq('id',1).maybeSingle();
  if(error){console.error(error); managerStatus.textContent='Gagal memuat data online: '+error.message;return;}
  if(data?.albums && Array.isArray(data.albums)) {
    if(remoteVersion === data.updated_at) return;
    ALBUMS.splice(0,ALBUMS.length,...data.albums);
    remoteVersion=data.updated_at;
  }
  renderAlbums();showRoute();
}
async function saveOnline(){
  if(!isAdmin || !db)throw Error('Hanya admin yang boleh menyimpan.');
  const albums=structuredClone(ALBUMS);
  let query;
  if(remoteVersion){
    query=db.from('site_content').update({albums}).eq('id',1).eq('updated_at',remoteVersion).select('updated_at').maybeSingle();
  } else {
    query=db.from('site_content').insert({id:1,albums}).select('updated_at').single();
  }
  const {data,error}=await query;
  if(error)throw error;
  if(!data) {await loadOnline();throw Error('Ada perubahan dari perangkat lain. Data terbaru sudah dimuat, silakan ulangi editnya.');}
  remoteVersion=data.updated_at;
  renderAlbums();showRoute();
}
async function verifyAdmin(){
  if(!db)return setAdmin(false);
  const {data:{user}}=await db.auth.getUser();
  if(!user)return setAdmin(false);
  const {data,error}=await db.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
  setAdmin(!!data && !error);
}
document.getElementById('login-form').addEventListener('submit',async e=>{
  e.preventDefault();if(!db){loginStatus.textContent='Konfigurasikan Supabase dulu.';return;}
  loginStatus.textContent='Memeriksa login...';
  const {error}=await db.auth.signInWithPassword({email:document.getElementById('admin-email').value.trim(),password:document.getElementById('admin-password').value});
  document.getElementById('admin-password').value='';
  if(error){loginStatus.textContent='Login gagal. Periksa email/password.';return;}
  await verifyAdmin();
  if(!isAdmin){await db.auth.signOut();loginStatus.textContent='Akun ini belum diizinkan sebagai admin.';return;}
  document.getElementById('login-details').open=false;
  loginStatus.textContent='Berhasil masuk! Sekarang kamu bisa edit semua episode 💗';
});
document.getElementById('logout-btn').addEventListener('click',async()=>{await db?.auth.signOut();setAdmin(false);loginStatus.textContent='Sudah logout.';});
// Foto biasa dikompres di browser SEBELUM dikirim ke Supabase.
// GIF dibiarkan asli agar animasinya tidak hilang.
async function compressPhoto(file){
  const types=['image/jpeg','image/png','image/webp','image/gif'];
  if(!types.includes(file.type))throw Error('Format foto harus JPG, PNG, WebP, atau GIF. HEIC perlu diubah ke JPG dulu.');
  if(file.type==='image/gif'){
    if(file.size>10*1024*1024)throw Error('GIF animasi maksimal 10 MB (tidak dikompres agar tetap bergerak).');
    return file;
  }
  // Foto kecil tidak perlu diproses ulang.
  if(file.size<=900*1024)return file;
  let bitmap=null, tempUrl=null, image=null;
  try{
    if(typeof createImageBitmap==='function'){
      bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
      image=bitmap;
    }else{
      tempUrl=URL.createObjectURL(file);
      image=await new Promise((resolve,reject)=>{
        const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('Foto tidak bisa dibaca oleh browser.'));img.src=tempUrl;
      });
    }
    const width=image.width||image.naturalWidth, height=image.height||image.naturalHeight;
    if(!width||!height)throw Error('Dimensi foto tidak valid.');
    let longest=2560;
    let best=null;
    const target=2*1024*1024;
    for(let round=0;round<5;round++){
      const scale=Math.min(1,longest/Math.max(width,height));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(width*scale));
      canvas.height=Math.max(1,Math.round(height*scale));
      const ctx=canvas.getContext('2d');
      if(!ctx)throw Error('Browser tidak mendukung pemrosesan foto.');
      ctx.drawImage(image,0,0,canvas.width,canvas.height);
      for(const q of [0.82,0.68,0.52]){
        const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',q));
        if(!blob || blob.type!=='image/webp')continue;
        if(!best || blob.size<best.size)best=blob;
        if(blob.size<=target)break;
      }
      if(best && best.size<=target)break;
      longest=Math.round(longest*0.75);
    }
    if(!best)throw Error('Kompresi WebP tidak didukung browser ini. Coba Chrome atau Edge terbaru.');
    // Jangan unggah file lebih besar dibanding foto asal.
    if(best.size>=file.size && file.size<=10*1024*1024)return file;
    return new File([best],file.name.replace(/\.[^.]+$/,'')+'.webp',{type:'image/webp',lastModified:Date.now()});
  }finally{
    if(bitmap)bitmap.close();
    if(tempUrl)URL.revokeObjectURL(tempUrl);
  }
}
async function uploadAsset(file,kind,episodeId){
  if(!isAdmin)throw Error('Login admin dulu.');
  const allowed=kind==='image'?['image/jpeg','image/png','image/webp','image/gif']:['audio/mpeg','audio/ogg','audio/wav','audio/x-wav'];
  if(!allowed.includes(file.type))throw Error('Tipe file tidak didukung.');
  const limit=kind==='image'?10*1024*1024:20*1024*1024;
  if(file.size>limit)throw Error(`File masih terlalu besar setelah diproses (maks ${kind==='image'?'10':'20'} MB).`);
  const ext=kind==='image'?({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'}[file.type]):({'audio/mpeg':'mp3','audio/ogg':'ogg','audio/wav':'wav','audio/x-wav':'wav'}[file.type]);
  const path=`${kind}/${episodeId}/${crypto.randomUUID()}.${ext}`;
  const {error}=await db.storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false});
  if(error)throw error;
  return {url:db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,path};
}
async function removeAsset(path){if(path) {const {error}=await db.storage.from(BUCKET).remove([path]);if(error)console.warn(error);}}
function mediaPath(url){
  try {const marker=`/storage/v1/object/public/${BUCKET}/`;let p=new URL(url).pathname;return p.includes(marker)?decodeURIComponent(p.split(marker)[1]):null;}
  catch{return null;}
}
document.getElementById('upload-input').addEventListener('change',async e=>{
  const files=Array.from(e.target.files||[]),album=activeAlbum;e.target.value='';
  if(!isAdmin||!album||!files.length)return;
  notice('upload-status','Menyiapkan kompresi foto sebelum upload...');
  let done=0;
  for(const file of files){
    try {
      notice('upload-status',`Mengompres & mengupload foto ${done+1} dari ${files.length}...`);
      const compressed=await compressPhoto(file);
      const uploaded=await uploadAsset(compressed,'image',album.id);
      album.photos.push({file:uploaded.url,caption:file.name.replace(/\.[^.]+$/,'').slice(0,100),tag:`IMG_${String(album.photos.length+1).padStart(3,'0')}`,date:'NEW'});
      album.cover=album.photos[0]?.file||'';
      await saveOnline();done++;
    }catch(err){console.error(err);notice('upload-status',`Berhasil ${done}, foto berikutnya gagal: ${err.message}`);return;}
  }
  notice('upload-status',`✓ ${done} foto tersimpan ONLINE dan langsung bisa dilihat semua orang!`);
});
async function deleteUploadedPhoto(albumId,index){
  if(!isAdmin || !confirm('Hapus foto ini dari episode?'))return;
  const a=ALBUMS.find(a=>a.id===albumId);if(!a?.photos[index])return;
  const old=a.photos.splice(index,1)[0];a.cover=a.photos[0]?.file||'';
  try{await saveOnline();await removeAsset(mediaPath(old.file));notice('upload-status','Foto berhasil dihapus.');}
  catch(e){a.photos.splice(index,0,old);notice('upload-status','Gagal menghapus: '+e.message);}
}
async function editPhotoCaption(index){
  if(!isAdmin||!activeAlbum?.photos[index])return;
  const p=activeAlbum.photos[index];const answer=prompt('Caption baru untuk foto ini:',p.caption);
  if(answer===null)return;const old=p.caption;p.caption=answer.trim().slice(0,250);
  try{await saveOnline();}catch(e){p.caption=old;alert('Gagal menyimpan: '+e.message);}
}
document.getElementById('new-episode-form').addEventListener('submit',async e=>{
  e.preventDefault();if(!isAdmin)return;
  const title=document.getElementById('new-title').value.trim(),date=document.getElementById('new-date').value,description=document.getElementById('new-description').value.trim();
  if(!title||!date)return;
  const id='episode-'+crypto.randomUUID();
  ALBUMS.push({id,title:title.toUpperCase(),date:`EPISODE ${String(ALBUMS.length+1).padStart(2,'0')} • ${new Date(date+'T12:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}).toUpperCase()}`,description,label:'new memory unlocked',color:['pink','yellow','blue'][ALBUMS.length%3],cover:'',song:'',songCaption:'',photos:[]});
  try{await saveOnline();e.target.reset();location.hash='#album/'+id;notice('manager-status','✓ Episode berhasil dibuat online.');}
  catch(err){ALBUMS.pop();notice('manager-status','Gagal: '+err.message);}
});
document.getElementById('edit-episode-form').addEventListener('submit',async e=>{
  e.preventDefault();if(!isAdmin||!activeAlbum)return;
  const a=activeAlbum,old=structuredClone(a);
  a.title=document.getElementById('edit-title').value.trim().slice(0,70);
  a.date=document.getElementById('edit-date').value.trim().slice(0,100);
  a.description=document.getElementById('edit-description').value.trim().slice(0,300);
  a.songCaption=document.getElementById('edit-song-caption').value.trim().slice(0,180);
  const url=document.getElementById('edit-song-url').value.trim();
  if(url&&!safeMediaUrl(url)){notice('edit-status','URL musik harus https:// atau http://.');return;}
  a.song=url;
  notice('edit-status','Menyimpan perubahan...');
  try{
    const file=document.getElementById('song-input').files[0];
    if(file){a.song=(await uploadAsset(file,'audio',a.id)).url;document.getElementById('song-input').value='';}
    await saveOnline();notice('edit-status','✓ Perubahan sudah online!');
  }catch(err){Object.assign(a,old);notice('edit-status','Gagal: '+err.message);}
});
document.getElementById('delete-episode').addEventListener('click',async()=>{
  if(!isAdmin||!activeAlbum||!confirm(`Yakin hapus episode "${activeAlbum.title}"?`))return;
  const index=ALBUMS.indexOf(activeAlbum),old=ALBUMS.splice(index,1)[0];
  try{await saveOnline();location.hash='#episodes';}
  catch(err){ALBUMS.splice(index,0,old);alert('Gagal: '+err.message);}
});
document.getElementById('backup-btn').addEventListener('click',()=>{
  if(!isAdmin)return;
  const blob=new Blob([JSON.stringify({format:'maaeeenn-online-v1',albums:ALBUMS},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='maaeeenn-data-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
  notice('manager-status','Backup metadata terunduh. Foto & musik berada di Supabase Storage (tidak termasuk dalam JSON).');
});
window.addEventListener('hashchange',showRoute);
loadOnline();loadComments();
if(db){
  verifyAdmin();
  db.auth.onAuthStateChange(()=>{setTimeout(verifyAdmin,0);});
  setInterval(()=>{loadComments();loadReactions();loadOnline();},30000);
}
