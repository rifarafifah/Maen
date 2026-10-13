MAAEEENN. 💗 | ONLINE ADMIN + GITHUB PAGES

VERSI INI BUKAN CUMA LOCAL BROWSER.
Admin bisa login dari link website yang sama dengan pengunjung, dan upload/edit langsung online.
Pengunjung bisa lihat isi situs dan komentar anonim tanpa login.

LANGKAH 1 — SUPABASE (gratis untuk percobaan, ada batas pemakaian)
1. Buka https://supabase.com/ -> buat project.
2. Buka SQL Editor -> New query -> copy seluruh isi supabase_setup.sql -> RUN.
3. Buka Authentication -> Users -> Add user -> Create new user.
   Pakai email dan password yang HANYA kamu tahu. Tandai email confirmed jika opsi ada.
4. Salin UUID user yang baru dibuat (Auth -> Users).
5. SQL Editor -> New query -> jalankan:
     insert into public.admin_users (user_id) values ('UUID_ASLI_AKUN_KAMU');
   Ganti UUID_ASLI_AKUN_KAMU dengan UUID asli. Jangan masukkan tanda petik ganda.
6. Buka Project Settings -> API (atau Connect -> API keys): salin Project URL dan
   PUBLISHABLE/ANON KEY (bukan secret/service_role).
7. Di script.js, paling atas, isi SUPABASE_URL dan SUPABASE_ANON_KEY sesuai nilai itu.
   Publishable/anon key MEMANG aman untuk frontend, asal RLS di SQL sudah aktif.

LANGKAH 2 — PUBLISH GITHUB PAGES
1. Buat repository GitHub, upload SELURUH isi folder maaeeenn_online_admin
   (index.html, script.js, style.css dll langsung di ROOT repo).
2. Settings -> Pages -> Deploy from a branch -> main -> /(root) -> Save.
3. Setelah Pages aktif, buka alamat https://username.github.io/nama-repo/.
4. Di website yang sama, scroll ke bagian paling bawah -> "Login pengelola".
5. Login pakai email & password dari langkah 1.
6. Di halaman utama: tambah episode. Di detail episode: upload foto,
   edit judul/tanggal/cerita, upload lagu atau tempel URL, edit caption foto.
7. Klik Logout agar tampilan kembali seperti pengunjung.

YANG PERLU DIINGAT
- Pengunjung TANPA LOGIN tidak bisa edit episode, foto atau musik karena aturan RLS di server.
- Semua perubahan admin tersimpan di Supabase, tidak perlu push ulang ke GitHub setiap edit.
- Edit dari perangkat lain dapat terlihat pengunjung setelah refresh (situs juga poll tiap 30 detik).
- Foto dan file musik tersedia PUBLIK bagi siapapun yang punya alamat file. Jangan unggah yang rahasia.
- Upload gambar: JPEG/PNG/WEBP/GIF, maksimal 10 MB masing-masing.
  Musik: MP3/OGG/WAV maksimal 20 MB. Gunakan musik yang kamu punya izin bagikan.
- Backup JSON hanya untuk metadata episode/URL, bukan menyimpan file media; backup
  file media juga di Supabase Storage secara terpisah bila diperlukan.
- 3 episode contoh hanya tampilan awal. Saat admin pertama kali menyimpan, database
  online berisi episode-episode contoh itu. Kamu boleh edit/hapus yang tidak dipakai.
- Data foto yang pernah diupload ke browser lokal pada versi sebelumnya TIDAK
  otomatis ikut dipindahkan. Upload ulang dari perangkat admin.
- Komentar anonim dapat dimanfaatkan spammer. Pertimbangkan CAPTCHA / moderasi.
- Pengunjung di halaman yang sama hanya bisa berkomentar dan memberi reaksi.
- Jika GitHub repo bersifat publik, SEMUA file kode dan SQL dapat dibaca siapapun.
  Jangan pernah taruh password admin atau service_role/secret key di file repo.
- Pengaturan Supabase agar login password bekerja: Authentication -> Providers -> Email.
- Jika ingin ganti admin, buat user baru dan tambah UUID-nya ke admin_users via SQL.

MASALAH UMUM
'Konfigurasikan Supabase dulu' -> cek URL/key di script.js.
'Login gagal' -> cek email/password akun Supabase Auth dan email confirmed.
'Akun belum diizinkan' -> pastikan UUID user sudah masuk tabel admin_users.
'Upload gagal (403)' -> pastikan SQL Storage Policies sudah RUN dan bucket ada.
'Foto tidak muncul' -> cek akses bucket public dan ekstensi file.
'Komentar tidak masuk' -> pastikan tabel comments dan kebijakan SQL terpasang.
