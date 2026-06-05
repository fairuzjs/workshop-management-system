# Workshop Management System 🛠️🚘

Aplikasi berbasis web yang komprehensif untuk mengelola operasional bengkel secara menyeluruh. Sistem ini mencakup manajemen inventaris (*spare parts*), Work Order (WO), pencatatan transaksi kasir (*direct sale* & *work order service*), sistem komisi mekanik, pelaporan keuangan (*profit & loss*, pengeluaran, payroll), serta portal pelacakan status perbaikan kendaraan oleh pelanggan secara *real-time*.

---

## 📌 Daftar Isi
1. [Fitur Utama](#-fitur-utama)
2. [Arsitektur & Alur Bisnis (Flowchart)](#-arsitektur--alur-bisnis-flowchart)
3. [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
4. [Matriks Peran & Hak Akses (RBAC)](#-matriks-peran--hak-akses-rbac)
5. [Instalasi & Pengaturan Lokal](#-instalasi--pengaturan-lokal)
6. [Skrip Utilitas Database (Prisma)](#-skrip-utilitas-database-prisma)
7. [Fitur Keamanan & Integritas Data](#-fitur-keamanan--integritas-data)

---

## 🚀 Fitur Utama

- **Dashboard Real-time**: Grafik analitik keuangan bulanan (pendapatan, HPP/COGS, pengeluaran, laba kotor, & laba bersih) dengan breakdown pengeluaran dan status WO aktif.
- **Manajemen Work Order (Perintah Kerja)**: Pencatatan perbaikan kendaraan mulai dari status `PENDING`, `IN_PROGRESS` (dikerjakan mekanik), `COMPLETED` (selesai diperbaiki), hingga `PAID` (lunas dibayar).
- **Potong Stok Otomatis**: Saat Work Order dinyatakan selesai (`COMPLETED`), sistem secara otomatis memotong stok barang di gudang.
- **Sistem Komisi Mekanik**: Pembagian komisi jasa perbaikan secara adil jika satu tugas jasa dikerjakan oleh beberapa mekanik sekaligus (*split commission*).
- **Direct Sale (Penjualan Langsung)**: Kasir dapat melayani penjualan suku cadang secara langsung kepada pelanggan tanpa harus melalui pembuatan Work Order perbaikan.
- **Financial & Monthly Closing**: Penguncian data transaksi keuangan bulanan. Setelah closing dilakukan, semua data pengeluaran (*expense*), transaksi kasir, payroll, dan pendapatan tidak dapat diedit atau dihapus oleh Admin biasa untuk menjaga keaslian laporan.
- **Public Vehicle Tracking**: Halaman khusus untuk pelanggan guna memantau progres perbaikan kendaraannya secara aman menggunakan kode token unik dan validasi nomor telepon.

---

## 📊 Arsitektur & Alur Bisnis (Flowchart)

Sistem ini memiliki alur operasional dan finansial terintegrasi seperti yang digambarkan pada diagram alur di bawah ini:

```mermaid
flowchart TD
    %% Style Definitions
    classDef superadmin fill:#ffccd5,stroke:#ff4d6d,stroke-width:2px;
    classDef admin fill:#ffe5ec,stroke:#ff758f,stroke-width:2px;
    classDef cashier fill:#e2ece9,stroke:#2a9d8f,stroke-width:2px;
    classDef mechanic fill:#e8f0fe,stroke:#1a73e8,stroke-width:2px;
    classDef portal fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px;

    %% Nodes & Flow
    subgraph Registrasi & Work Order
        A[Pelanggan Datang] --> B[Registrasi Kendaraan & Pelanggan]:::admin
        B --> C[Pembuatan Work Order baru - Status: PENDING]:::admin
    end

    subgraph Pengerjaan & Komisi
        C --> D[Assign Mekanik & Masukkan Sparepart]:::admin
        D -->|Status: IN_PROGRESS| E[Mekanik Melakukan Perbaikan]:::mechanic
        E -->|Status: COMPLETED| F[Potong Stok Suku Cadang & Hitung Komisi Mekanik]:::mechanic
    end

    subgraph Kasir & Transaksi
        F --> G[Kasir Memeriksa Invoice & Melakukan Pembayaran]:::cashier
        H[Penjualan Langsung / Direct Sale Sparepart]:::cashier --> G
        G -->|Status: PAID| I[Buat Transaksi Keuangan & Simpan Riwayat Kas]:::cashier
    end

    subgraph Pelacakan Publik
        C -.-> P[Kirim Token Pelacakan via WA/Nota]
        P -.-> Q[Pelanggan Akses Portal Tracking]:::portal
        Q -->|Input Token & Verifikasi HP| R[Cek Progres Kendaraan Real-time]:::portal
    end

    subgraph Finansial & Laporan
        I --> S[Dashboard Analitik & Laporan Laba/Rugi]:::superadmin
        S --> T[Sistem Penggajian / Payroll Bulanan]:::superadmin
        S --> U[Monthly Closing / Penutupan Buku Bulanan]:::superadmin
        U -->|Kunci Data Transaksi & Expense| V[Data Terkunci: Read-Only]:::admin
    end
```

---

## 🛠️ Teknologi yang Digunakan

*   **Framework Utama**: [Next.js 15](https://nextjs.org/) (menggunakan App Router & TypeScript)
*   **Database ORM**: [Prisma ORM](https://www.prisma.io/)
*   **Database**: PostgreSQL
*   **Autentikasi**: [NextAuth.js](https://next-auth.js.org/)
*   **Validasi Data**: [Zod Schema Validation](https://zod.dev/)
*   **Keamanan Rute**: Middleware Kustom berbasis Next.js Proxy (`proxy.ts`)
*   **Desain & UI**: TailwindCSS, Lucide Icons, dan Shadcn/UI-based components.

---

## 👥 Matriks Peran & Hak Akses (RBAC)

Aplikasi ini menerapkan pembagian hak akses (*Role-Based Access Control*) yang ketat:

| Fitur / Modul | SUPERADMIN | ADMIN | CASHIER | Keterangan / Proteksi Keamanan |
| :--- | :---: | :---: | :---: | :--- |
| **Dashboard Utama** | **Ya** | **Ya** | **Ya** | Tampilan data analitik & grafik performa bengkel |
| **Manajemen User / Karyawan** | **Ya** | Tidak | Tidak | Mengelola hak akses akun, status `isActive`, & roles |
| **Manajemen Suplier & Pelanggan** | **Ya** | **Ya** | Tidak | Pendaftaran data kontak & suplier suku cadang |
| **Manajemen Kendaraan (Pelat Nomor)**| **Ya** | **Ya** | Tidak | Pelat nomor divalidasi unik (*case-insensitive*) |
| **Transaksi & Work Order** | **Ya** | **Ya** | **Ya** | Hanya Kasir/Admin/Superadmin yang bisa memproses |
| **Detail Gaji / Komisi Individu** | **Ya** | Tidak | Tidak | Admin biasa hanya melihat total agregat gaji bulanan |
| **Monthly Closing (Tutup Buku)** | **Ya** | **Ya** | Tidak | Mengunci edit/hapus transaksi bulan terpilih |
| **Koreksi Data Terkunci (Closing)**| **Ya** | Tidak | Tidak | Superadmin dapat membuka kunci (re-open) jika dibutuhkan |

---

## 💻 Instalasi & Pengaturan Lokal

Ikuti langkah-langkah di bawah ini untuk menjalankan project di komputer lokal Anda:

### 1. Prasyarat (*Prerequisites*)
Pastikan Anda sudah menginstal:
*   [Node.js](https://nodejs.org/) (versi LTS terbaru rekomendasikan v18 atau v20)
*   [PostgreSQL Database](https://www.postgresql.org/) yang sudah berjalan aktif.

### 2. Kloning Project & Pasang Dependensi
```bash
git clone https://github.com/fairuzjs/workshop-management-system.git
cd workshop-management-system
npm install
```

### 3. Konfigurasi Environment (`.env`)
Buat file bernama `.env` di direktori root project, lalu isi variabel-variabel berikut sesuai dengan kredensial PostgreSQL Anda:
```env
# Koneksi Database PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/workshop_management_db?schema=public"

# Konfigurasi NextAuth (Keamanan Sesi)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="buat-kunci-rahasia-random-anda-di-sini-minimal-32-karakter"
```

### 4. Migrasi Database & Seeding Data
Jalankan migrasi database menggunakan Prisma untuk menyusun tabel dan memasukkan data awal (*seed* seperti akun superadmin default):
```bash
# Generate Prisma Client
npx prisma generate

# Jalankan Migrasi database
npx prisma migrate dev

# Lakukan Seeding data dasar
npx prisma db seed
```

*Akun Superadmin default yang dibuat setelah seeding:*
*   **Email**: `superadmin@workshop.com`
*   **Password**: `password123`

### 5. Jalankan Development Server
```bash
npm run dev
```
Buka browser Anda dan akses halaman di `http://localhost:3000`.

---

## 🗃️ Skrip Utilitas Database (Prisma)

Project ini dilengkapi dengan skrip utility di bawah folder [prisma/scripts/](file:///d:/Project/workshop-management/prisma/scripts) untuk membantu tugas administrasi basis data secara mandiri:

*   **`check-duplicate-plates.ts`**: Mendeteksi jika ada pelat nomor kendaraan yang ganda sebelum mengaktifkan constraint unik.
*   **`clean-duplicate-inventory.ts`**: Membersihkan dan menggabungkan item suku cadang dengan nama yang sama untuk merapikan database inventaris.
*   **`clean-duplicate-employees.ts`**: Menghapus data duplikat karyawan untuk menghindari kesalahan sistem payroll.
*   **`clear-dummy.ts`**: Membersihkan data dummy/transaksi uji coba dari database secara cepat saat akan meluncurkan versi produksi.

Jalankan skrip menggunakan `npx ts-node`:
```bash
npx ts-node prisma/scripts/check-duplicate-plates.ts
```

---

## 🛡️ Fitur Keamanan & Integritas Data

Sistem ini didesain dengan beberapa lapisan pengaman tingkat lanjut untuk mencegah kebocoran data dan manipulasi laporan:

1.  **Proxy Middleware (`proxy.ts`)**: Mencegah akses langsung ke halaman internal bengkel sebelum user berhasil masuk (*authenticated*). User yang tidak aktif (`isActive: false`) akan otomatis tertendang keluar dan tidak dapat login kembali.
2.  **Rate Limiting di Tracking Route**: Membatasi percobaan pelacakan status WO maksimum **5 request per menit** per IP address untuk mencegah serangan brute force token tracking.
3.  **Sensor Nomor Telepon (Phone Masking)**: Admin biasa tidak dapat melihat nomor telepon pelanggan secara utuh pada layar untuk menjaga privasi (*Customer Data Protection*).
4.  **Zod API Validation**: Semua *payload API request* (seperti pembuatan supplier, customer, & transaksi) wajib melewati validasi skema tipe data Zod di sisi backend sebelum diproses oleh database PostgreSQL.
5.  **Monthly Closing Lock Engine**: Sistem secara dinamis memblokir permintaan `PUT` dan `DELETE` transaksi atau expense jika tanggal dokumen berada pada bulan yang statusnya sudah dinyatakan ditutup (*closed*).
