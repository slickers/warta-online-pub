# Warta Online Gereja

Aplikasi web sederhana untuk menampilkan warta gereja, tata ibadah, dan pengumuman secara online menggunakan javascript dengan format penulisan markdown.

## Daftar Isi
- [Pendahuluan](#pendahuluan)
- [Struktur Folder](#struktur-folder)
- [Cara Penggunaan](#cara-penggunaan)
- [Membuat Warta Baru](#membuat-warta-baru)
- [Menjalankan di Komputer Lokal](#menjalankan-di-komputer-lokal)
- [Deploy ke Vercel](#deploy-ke-vercel)
- [Kustomisasi](#kustomisasi)
- [Lisensi](#lisensi)

## Pendahuluan

Warta Online Gereja adalah aplikasi web sederhana yang memungkinkan gereja mempublikasikan warta mingguan, tata ibadah, dan pengumuman gereja secara online. Aplikasi ini menggunakan format markdown yang mudah diedit dan tidak memerlukan database. Cocok untuk gereja dengan sumber daya teknis terbatas.

Fitur utama:
- Tampilan warta gereja yang responsif dan mudah dibaca
- Format teks dan lirik nyanyian dengan tombol tampil/sembunyikan
- Daftar warta otomatis tersusun berdasarkan tanggal
- Mudah diupdate tanpa perlu keahlian teknis yang tinggi

Demo aplikasi dapat dilihat di [tautan berikut ini](https://gkpibdl.mctm.web.id/).

## Struktur Folder

```
warta-online-pub/
├── css/                 # File CSS untuk tampilan website
├── js/                  # File JavaScript untuk fungsi website
│   └── app.js           # Kode utama aplikasi
├── markdown/            # Folder berisi file warta dalam format markdown
│   └── 20250518.md      # Contoh file warta (dalam format YYYYMMDD.md)
├── scripts/             # Script pendukung
│   └── update-markdown-list.js  # Script untuk memperbarui daftar warta
├── index.html           # Halaman utama website
├── markdown-list.json   # Daftar file warta yang tersedia
└── readme.md            # Dokumentasi (file ini)
```

## Cara Penggunaan

### Membuat Warta Baru

1. **Buat file markdown baru** dengan format nama `YYYYMMDD.md` (tahun, bulan, tanggal) di folder `markdown/`. Misalnya: `20250525.md` untuk warta tanggal 25 Mei 2025.

2. **Salin template** dari file `20250518.md` yang sudah ada dan modifikasi sesuai kebutuhan.

3. **Isi bagian-bagian warta** dengan informasi yang sesuai:
   - Tema ibadah
   - Tata ibadah dan nyanyian
   - Pelayan ibadah
   - Statistik kehadiran
   - Pengumuman-pengumuman
   - Keuangan

4. **Update daftar warta** dengan menjalankan script `update-markdown-list.js`:
   ```
   node scripts/update-markdown-list.js
   ```
   Script ini akan memperbarui file `markdown-list.json` dengan daftar terbaru warta yang tersedia.

### Format Penulisan

File markdown mendukung format berikut:

- Gunakan `#` untuk judul utama, `##` untuk sub-judul, `###` untuk sub-sub-judul
- Gunakan blok kode (diapit dengan ``` di awal dan akhir) untuk lirik nyanyian atau ayat Alkitab, yang akan ditampilkan dengan tombol tampil/sembunyikan
- Gunakan tabel dengan format markdown standar untuk statistik, daftar jemaat, dan keuangan

### Menjalankan di Komputer Lokal

Untuk melihat hasilnya sebelum dipublikasikan:

1. **Gunakan server web sederhana**. Jika Anda memiliki Node.js, bisa menggunakan:
   ```
   npx serve
   ```
   atau jika menggunakan Python:
   ```
   python -m http.server
   ```

2. **Buka browser** dan akses `http://localhost:5000` (untuk `serve`) atau `http://localhost:8000` (untuk Python).

## Deploy ke Vercel

Vercel adalah layanan hosting gratis yang cocok untuk website statis seperti ini:

1. **Buat akun di [Vercel](https://vercel.com)** jika belum memiliki.

2. **Upload project ke GitHub**:
   - Buat repository baru di GitHub
   - Upload project ke repository tersebut
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/username/warta-online-pub.git
   git push -u origin main
   ```

3. **Deploy di Vercel**:
   - Login ke akun Vercel
   - Klik "New Project"
   - Pilih repository GitHub yang telah dibuat
   - Klik "Deploy"
   - Setelah proses deploy selesai, website akan tersedia di URL yang disediakan Vercel

4. **Setiap kali update**:
   - Edit file warta atau tambah warta baru
   - Jalankan script update daftar warta
   - Push ke GitHub
   ```
   git add .
   git commit -m "Update warta tanggal xxx"
   git push
   ```
   - Vercel akan otomatis memperbarui website Anda

## Kustomisasi

### Mengubah Nama Gereja dan Tampilan

1. Edit file `index.html` untuk mengubah nama gereja dan informasi umum
2. Edit file CSS di folder `css/` untuk mengubah warna, font, dan tampilan lainnya

### Mengubah Template Warta

Sesuaikan file template warta sesuai kebutuhan gereja Anda, dengan mengubah:
- Bagian-bagian tata ibadah
- Format pengumuman
- Struktur laporan keuangan

## Lisensi

Dibuat oleh Martin Manullang. Bebas digunakan dan dimodifikasi untuk keperluan gereja.
