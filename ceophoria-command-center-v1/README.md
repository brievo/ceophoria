# CEOPHORIA Command Center

MVP frontend React + Vite + Supabase untuk pengelolaan operasional konser.

## Fitur V1
- Login/logout melalui Supabase Auth.
- Dashboard ringkasan tugas dan kesiapan divisi.
- Task list: buat tugas, ubah status, progres, prioritas, deadline, PIC.
- Divisi dan aktivitas terbaru.
- Daily briefing.
- Issue & risk log.
- Tampilan responsif untuk desktop dan ponsel.

## Persiapan lokal
1. Install Node.js versi LTS.
2. Ekstrak folder proyek.
3. Jalankan `npm install`.
4. Salin `.env.example` menjadi `.env`.
5. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY`.
6. Jalankan `npm run dev`.

## Deploy ke Netlify
1. Upload source project ke repository GitHub.
2. Di Netlify pilih **Add new site → Import an existing project**.
3. Hubungkan repository GitHub.
4. Build command: `npm run build`.
5. Publish directory: `dist`.
6. Tambahkan environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
7. Deploy.

`netlify.toml` sudah berisi konfigurasi build dan SPA redirect.

## Catatan keamanan
- Hanya gunakan Supabase Publishable Key di frontend.
- Jangan pernah memasukkan `sb_secret_...`, service role key, atau database password ke frontend/Netlify environment variable yang terekspos ke browser.
- Akses data tetap harus dikendalikan oleh RLS Supabase.
- Sebelum dipakai operasional, uji login dan pembatasan akses dengan akun Super Admin dan akun koordinator.
- User yang dapat membaca `profiles` saat ini dapat melihat profil seluruh pengguna; jangan menyimpan data sensitif pada tabel ini.

## Asumsi skema
Proyek ini menggunakan tabel yang sudah dibuat di Supabase:
`profiles`, `divisions`, `tasks`, `task_supporting_divisions`, `activity_logs`, `daily_briefings`, `issues`, `milestones`.

Tabel dan kolom mengikuti SQL Foundation yang telah dijalankan pada proses setup CEOPHORIA.