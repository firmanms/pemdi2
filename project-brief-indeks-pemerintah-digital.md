# Project Brief: Aplikasi Evaluasi Indeks Pemerintah Digital

## 1. Ringkasan Proyek (Project Overview)

Aplikasi ini dirancang sebagai platform asesmen mandiri (self-assessment) atau audit untuk mengukur tingkat kematangan Pemerintah Digital di instansi pemerintah. Aplikasi akan menghitung nilai indeks akhir berdasarkan akumulasi nilai 7 Aspek dan 20 Indikator secara real-time.

## 2. Struktur Data Aspek & Indikator

Aplikasi menggunakan basis data terbobot dengan 7 aspek dan 20 indikator sebagaimana dirinci pada tabel sumber (Tata Kelola & Manajemen 10%, Penyelenggara 10%, Data 15%, Keamanan Siber 15%, Teknologi Digital 10%, Keterpaduan Layanan Digital Pemerintah 15%, Kepuasan Pengguna Layanan Digital 25%).

---

## 3. Fitur Utama (Core Features)

### 3.1 Modul Asesmen (Self-Assessment)
- **Penetapan OPD Pengampu per indikator**: sebelum periode dibuka, Admin Pemda menetapkan satu atau lebih OPD sebagai pengampu untuk tiap indikator.
- **Form self-assessment (semua OPD, semua indikator)**: setiap Perangkat Daerah login dan mengisi skor (desimal 1-5) + justifikasi + bukti dukung untuk **seluruh 20 indikator**, merepresentasikan penilaian versi OPD tersebut.
- **Rekap & Konsolidasi (khusus OPD Pengampu)**: untuk indikator yang diampunya, OPD Pengampu dapat melihat **rekap seluruh skor self-assessment** dari semua OPD (rata-rata, sebaran, dan detail per-OPD sebagai referensi), lalu menetapkan **skor final indikator** beserta justifikasi konsolidasi dan bukti dukung final.
- **Draft & Setor**: baik self-assessment biasa maupun skor final dari pengampu disimpan sebagai draft dahulu, lalu di-**"Setor"** (self-assessment disetor ke sistem sebagai kontribusi; skor final indikator disetor ke Admin Pemda untuk direview).
- **Review & Approval**: Admin Pemda meninjau tiap skor final indikator dari OPD Pengampu, dapat menyetujui atau mengembalikan (dengan catatan revisi) ke OPD Pengampu terkait.
- **Multi-periode**: mendukung asesmen berulang per tahun/semester sehingga tren dapat dibandingkan antar periode.

### 3.2 Mesin Perhitungan Indeks (Scoring Engine)

**Skala nilai indikator**: nilai per indikator bersifat **kontinu/desimal** dalam rentang 1,00 - 5,00 (bukan hanya bilangan bulat), karena nilai akhir biasanya merupakan rata-rata dari beberapa sub-pertanyaan/parameter di dalam satu indikator. Nilai ini kemudian dipetakan ke **5 level kematangan** berikut (contoh untuk Indikator 1, dan pola yang sama berlaku untuk seluruh 20 indikator):

| Level | Predikat | Rentang Nilai |
|---|---|---|
| 1 | Kurang / Initiate | 1 ≤ nilai < 1,5 |
| 2 | Cukup / Emerging | 1,5 ≤ nilai < 2,5 |
| 3 | Baik / Developing | 2,5 ≤ nilai < 3,5 |
| 4 | Sangat Baik / Embedded | 3,5 ≤ nilai < 4,5 |
| 5 | Memuaskan / Leading | 4,5 ≤ nilai ≤ 5 |

> **Penting — rentang ini bersifat dinamis, bukan standar tetap/global.** Contoh di atas hanyalah *default/contoh* untuk Indikator 1. Setiap indikator (dari 20 indikator) bisa memiliki batas rentang levelnya **masing-masing**, dan admin dapat **menginput/mengubah batas tersebut secara manual** per indikator melalui halaman Manajemen Referensi (§3.4) — bukan di-hardcode di kode aplikasi. Contoh: Indikator "Tata Kelola Pemerintah Digital" bisa punya rentang 1-1,5 / 1,5-2,5 / dst seperti contoh di atas, sementara Indikator "Interoperabilitas Data" bisa punya batas yang berbeda (mis. 1-1,8 / 1,8-2,7 / dst) sesuai pedoman resmi masing-masing.

- Perhitungan **real-time**: `Nilai Indikator (1-5, desimal) → dikonversi ke skala 100 (nilai/5 × 100) → dikalikan Bobot Indikator (%) → dijumlahkan per Aspek → dijumlahkan menjadi Indeks Akhir`.
- Formula umum:
  - `Nilai Aspek = Σ (Skor Indikator/5 × 100 × Bobot Indikator)`
  - `Indeks Akhir = Σ Nilai Aspek` (karena total bobot aspek = 100%)
- **Predikat Indeks Akhir & per-Aspek** menggunakan tabel level kematangan yang sama di atas, diterapkan pada nilai skala 1-5 (nilai skala 100 dikonversi kembali: `nilai_1_5 = indeks/100 × 5`) — sehingga interpretasi kategori konsisten dari level indikator sampai level indeks akhir.
- Kalkulasi berjalan di **database layer** (Postgres function/view di Supabase) agar konsisten dan tidak bergantung pada logika di client. Tabel rentang level disimpan di tabel `rubrik_level` (lihat skema §5) agar dapat dikonfigurasi tanpa mengubah kode aplikasi.
- Input form asesmen sebaiknya berupa **slider atau input numerik dengan 1-2 desimal** (bukan dropdown 1-5 diskrit), agar mendukung nilai seperti 3,7 sesuai contoh di atas. UI menampilkan predikat secara otomatis begitu nilai diketik/digeser.

### 3.3 Dashboard & Visualisasi
- **Dashboard ringkasan**: nilai indeks akhir, gauge/radar chart per 7 aspek, dan tabel rincian 20 indikator.
- **Radar chart 7 aspek** untuk melihat kekuatan/kelemahan relatif secara visual.
- **Tren antar periode** (line chart) bila instansi telah melakukan asesmen lebih dari satu kali.
- **Perbandingan antar unit/instansi** (untuk role admin/pusat) — opsional bila multi-instansi.
- **Export laporan** ke PDF/Excel (rekap skor, radar chart, dan bukti dukung terlampir).

### 3.4 Manajemen Referensi (Admin)
- CRUD master data: Aspek, Indikator, Bobot, dan level kematangan (rubrik 1-5) per indikator.
- **Editor rentang level per indikator**: form input manual untuk 5 baris (Level 1-5), masing-masing dengan kolom Predikat, Batas Bawah, dan Batas Atas — diisi/diubah bebas oleh admin per indikator, tidak ada nilai baku yang di-hardcode di sistem.
- Validasi otomatis saat menyimpan rentang: batas atas level N harus sama dengan batas bawah level N+1 (tidak ada celah/gap atau tumpang tindih antar level), dan rentang keseluruhan harus menutup 1 s.d. 5.
- Validasi otomatis: total bobot 7 aspek harus 100%, dan total bobot indikator dalam satu aspek harus sama dengan bobot aspeknya.
- Pengaturan periode asesmen (buka/tutup periode, tenggat waktu submit).

### 3.5 Manajemen Pengguna & Peran (RBAC)

Model pengisian bersifat **dua lapis**:

1. **Semua Perangkat Daerah mengisi self-assessment untuk seluruh 20 indikator** — tiap OPD memberi skor & justifikasi versi mereka sendiri di semua indikator (bukan hanya sebagian), karena tiap OPD punya sudut pandang/pengalaman berbeda terhadap kematangan pemerintah digital di daerahnya.
2. **Tiap indikator memiliki satu atau lebih OPD "Pengampu"** (bisa 1, 2, atau lebih — kolaboratif) yang bertanggung jawab **mengonsolidasikan** seluruh skor self-assessment dari semua OPD untuk indikator tersebut menjadi **satu skor final indikator**, lengkap dengan justifikasi & bukti dukung final, lalu **menyetor skor final itu ke Admin Pemda**.

Peran:
- **Super Admin**: kelola seluruh master data (aspek/indikator/bobot/rubrik level), kelola daftar Pemda/instansi, dan kelola akun Admin Pemda.
- **Admin Pemda** (mis. Diskominfo/Bappeda):
  - Membuka periode asesmen, membuat/mengelola akun tiap Perangkat Daerah.
  - **Menetapkan OPD Pengampu per indikator** (many-to-many: satu indikator bisa punya beberapa OPD pengampu; satu OPD bisa jadi pengampu di beberapa indikator sekaligus).
  - Memantau progres pengisian self-assessment seluruh OPD dan progres konsolidasi oleh tiap OPD pengampu.
  - **Menerima setoran skor final per indikator** dari OPD Pengampu, mereview, menyetujui atau mengembalikan untuk revisi.
  - Submit final indeks Pemda setelah seluruh 20 indikator disetujui.
- **Perangkat Daerah (mode reguler)**: login dengan akun OPD-nya → mengisi self-assessment (skor + justifikasi + bukti dukung) untuk **semua 20 indikator** → simpan/kirim sebagai kontribusi (bukan skor final).
- **Perangkat Daerah (mode Pengampu)**: OPD yang sama bisa punya kewenangan tambahan ini pada indikator tertentu — dapat **melihat rekap seluruh skor self-assessment dari semua OPD** untuk indikator yang diampunya, lalu menetapkan **skor final indikator** (bisa manual/musyawarah antar-pengampu, bukan otomatis dirata-rata — lihat catatan di §5) beserta justifikasi konsolidasi, dan **"Setor ke Admin Pemda"**.
- **Viewer** (opsional): mis. pimpinan/kepala daerah, hanya dapat melihat dashboard & laporan hasil akhir.

> Catatan: karena satu OPD bisa berperan ganda (mengisi self-assessment di semua indikator, sekaligus jadi pengampu di indikator tertentu), hak akses "Pengampu" sebaiknya berupa **flag/penugasan tambahan** di atas akun OPD reguler, bukan role terpisah — lihat tabel `indikator_pengampu` di skema §5.

### 3.6 Notifikasi & Riwayat
- Notifikasi in-app/email saat periode asesmen dibuka, mendekati tenggat, atau saat skor diverifikasi.
- Audit log/riwayat perubahan skor (siapa mengubah, kapan, nilai sebelum-sesudah) untuk akuntabilitas.

---

## 4. Arsitektur & Tech Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| Frontend | **Next.js 14+ (App Router)** | Server Components untuk dashboard, Client Components untuk form interaktif |
| Styling/UI | Tailwind CSS + shadcn/ui | Komponen form, tabel, dan chart yang konsisten |
| Visualisasi | Recharts / Chart.js | Radar chart, bar chart, line chart tren |
| Backend/DB | **Supabase (Postgres)** | Database utama, Row Level Security (RLS) untuk multi-tenant/multi-instansi |
| Auth | Supabase Auth | Email/password + opsi SSO (Google Workspace/SAML jika dibutuhkan instansi) |
| Storage | Supabase Storage | Penyimpanan dokumen bukti dukung |
| Realtime | Supabase Realtime | Update progres pengisian asesmen secara live antar asesor |
| API Layer | Next.js Route Handlers / Server Actions | Validasi input & pemanggilan RPC ke Postgres function |
| Deployment | Vercel (frontend) + Supabase Cloud | CI/CD otomatis dari repository Git |
| Report Export | react-pdf atau exceljs | Generate laporan PDF/Excel |

---

## 5. Rancangan Skema Database (Ringkas)

```
instansi (id, nama, kode, tingkat)                      -- Pemda (Provinsi/Kab/Kota)
perangkat_daerah (id, instansi_id, nama, kode, jenis)    -- OPD/Dinas/Badan/Kecamatan di bawah satu Pemda
users (id, auth_id, instansi_id, perangkat_daerah_id, nama, role)  -- role: super_admin | admin_pemda | perangkat_daerah | viewer
periode_asesmen (id, tahun, nama, status, tanggal_mulai, tanggal_selesai)
aspek (id, kode, nama, bobot)                            -- 7 baris, total bobot 100%
indikator (id, aspek_id, kode, nama, bobot)               -- 20 baris
indikator_pengampu (id, periode_id, indikator_id, perangkat_daerah_id)  -- many-to-many: 1 indikator bisa >1 OPD pengampu
rubrik_level (id, indikator_id, level, predikat, batas_bawah, batas_atas, deskripsi)  -- rentang nilai per level, per indikator, diinput manual oleh admin

penilaian_opd (id, periode_id, indikator_id, perangkat_daerah_id, skor, justifikasi, status, disimpan_at)
  -- self-assessment SEMUA OPD untuk SEMUA indikator (many-to-many indikator x OPD)
  -- status: draft | terkirim

penilaian_final (id, periode_id, indikator_id, skor_final, justifikasi_konsolidasi, ditetapkan_oleh_perangkat_daerah_id, ditetapkan_oleh_user_id, status, direview_oleh, direview_at)
  -- SATU baris per indikator per periode = hasil konsolidasi OPD Pengampu, yang disetor & direview Admin Pemda
  -- status: draft | disetor | dikembalikan | disetujui

bukti_dukung (id, penilaian_opd_id NULL, penilaian_final_id NULL, file_url, keterangan)
audit_log (id, ref_table, ref_id, user_id, aksi, nilai_lama, nilai_baru, created_at)
```

- View/Postgres function `hitung_indeks(instansi_id, periode_id)` mengembalikan nilai per indikator, per aspek, dan indeks akhir — **dihitung dari `penilaian_final` yang berstatus `disetujui`** (bukan langsung dari `penilaian_opd`, karena itu baru kontribusi mentah sebelum dikonsolidasi).
- RLS diterapkan berlapis:
  - **Perangkat Daerah (mode reguler)**: hanya bisa lihat/ubah baris miliknya sendiri di `penilaian_opd` (`perangkat_daerah_id` = OPD login), untuk semua indikator.
  - **Perangkat Daerah (mode Pengampu)**: tambahan akses **read** ke seluruh `penilaian_opd` pada indikator yang ia ampu (lihat `indikator_pengampu`), dan akses **write** ke `penilaian_final` pada indikator tersebut.
  - **Admin Pemda**: akses penuh baca/review ke seluruh `penilaian_opd` dan `penilaian_final` dalam `instansi_id`-nya.
  - **Super Admin**: akses penuh.

> **Catatan terbuka**: bagaimana OPD Pengampu menetapkan skor final (rata-rata otomatis dari `penilaian_opd`, atau murni input manual/musyawarah) masih perlu dikonfirmasi — brief ini mengasumsikan **manual/musyawarah dengan rekap rata-rata sebagai referensi**, bukan rata-rata otomatis yang mengunci nilai. Bila ternyata harus otomatis dirata-rata, tabel `penilaian_final` cukup diisi via trigger/fungsi agregasi dan form input skor final dihilangkan.

---

## 6. Alur Pengguna (User Flow) Singkat

1. **Super Admin** menyiapkan master data (aspek, indikator, bobot, rubrik level) dan mendaftarkan Pemda baru beserta akun Admin Pemda-nya.
2. **Admin Pemda** membuka periode asesmen → mendata/memastikan seluruh Perangkat Daerah punya akun → **menetapkan OPD Pengampu untuk tiap indikator** (bisa lebih dari satu OPD per indikator).
3. **Setiap Perangkat Daerah** login → mengisi self-assessment (skor desimal 1-5 + justifikasi + bukti dukung) untuk **seluruh 20 indikator** → simpan draft → kirim.
4. **OPD Pengampu** (untuk indikator yang diampunya) membuka rekap seluruh skor self-assessment dari semua OPD pada indikator itu → berdiskusi/menetapkan **skor final indikator** + justifikasi konsolidasi → **Setor ke Admin Pemda**.
5. **Admin Pemda** memantau dashboard progres (self-assessment per OPD, dan konsolidasi per indikator) → meninjau tiap skor final yang disetor → **Setujui** atau **Kembalikan untuk revisi** ke OPD Pengampu terkait.
6. Setelah seluruh 20 indikator berstatus **Disetujui**, Admin Pemda melakukan **submit final** periode tersebut.
7. Dashboard menampilkan Indeks Akhir Pemda, breakdown 7 aspek, sebaran skor self-assessment antar-OPD (untuk insight internal), dan opsi export laporan.

---

## 7. Non-Functional Requirements

- **Keamanan**: RLS ketat per instansi, enkripsi file bukti dukung, log audit untuk semua perubahan skor (relevan mengingat aplikasi ini sendiri mengukur aspek Keamanan Siber & Pelindungan Data Pribadi).
- **Skalabilitas**: mendukung banyak instansi (multi-tenant) tanpa perubahan skema.
- **Aksesibilitas**: desain responsif (mobile-friendly) untuk pengisian asesmen di lapangan.
- **Auditability**: seluruh riwayat skor dan bukti dukung tersimpan dan dapat ditelusuri.

---

## 8. Timeline Pengembangan (Estimasi)

| Fase | Durasi | Output |
|---|---|---|
| 1. Setup & Skema DB | 1 minggu | Project Supabase + skema tabel, seed data 7 aspek/20 indikator, RLS dasar |
| 2. Auth & Manajemen Pengguna | 1 minggu | Login, role-based access, manajemen instansi/pengguna |
| 3. Modul Asesmen | 2 minggu | Form penilaian, upload bukti dukung, draft/submit |
| 4. Scoring Engine | 1 minggu | Postgres function perhitungan indeks, unit test formula |
| 5. Dashboard & Visualisasi | 2 minggu | Radar chart, tabel rincian, tren antar periode |
| 6. Export Laporan | 1 minggu | Export PDF/Excel |
| 7. QA, UAT, & Deployment | 1-2 minggu | Testing, perbaikan bug, deploy ke Vercel + Supabase Cloud |

**Total estimasi: ± 9-10 minggu** (dapat dipersingkat bila fitur reviewer/notifikasi ditunda ke fase berikutnya).

---

## 9. Deliverables

- Repository kode Next.js + konfigurasi Supabase (migration SQL, seed data 7 aspek & 20 indikator beserta bobotnya).
- Dokumentasi API/Server Actions.
- Panduan pengguna (admin, asesor, reviewer).
- Laporan hasil UAT.

---

## 10. Status Saat Ini (Current Progress)

Hingga saat ini, proyek telah mencapai tahap pengembangan antarmuka (UI) untuk halaman Dashboard ringkasan. Beberapa pencapaian utama meliputi:
- **Konfigurasi UI/UX**: Telah diimplementasikan integrasi Next.js (App Router) dengan Tailwind CSS v4 dan komponen dari Shadcn UI. File `globals.css` telah diatur ulang agar mendukung sistem tema Terang/Gelap (Light/Dark Mode) secara responsif tanpa warna kaku (hardcoded).
- **Komponen Visualisasi Data**: Grafik telah berhasil diintegrasikan menggunakan *library* Recharts.
  - **Gauge Chart**: Untuk menampilkan nilai Indeks Akhir (0-100).
  - **Radar Chart**: Untuk menganalisis Profil 7 Aspek secara visual.
  - **Trend Chart**: Menampilkan tren indeks antar periode.
  - *(Bug Fix)*: Masalah *rendering* Recharts (error width/height -1) akibat efek animasi transisi telah diperbaiki menggunakan pendekatan tinggi piksel absolut pada `ResponsiveContainer`.
- **Fungsi Utilitas**: Logika perhitungan dasar untuk mendapatkan warna (*Gauge Color*), *Status Badge*, dan *Predikat* berdasarkan skor sudah disematkan ke dalam `src/lib/utils.ts`.

*Langkah selanjutnya yang bisa disiapkan: skema SQL migration Supabase untuk tabel di atas, atau prototipe kalkulator penilaian interaktif untuk memvalidasi formula perhitungan indeks.*
