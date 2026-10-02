# StackYup CMS 🚀

StackYup CMS adalah platform publishing blog modern, ringan, dan gratis di-hosting (serverless), yang dibangun khusus untuk blog review software, komparasi AI tools, dan panduan produktivitas dengan target pembaca internasional (US/UK).

Platform ini dilengkapi dengan arsitektur **Hybrid Headless CMS**, antarmuka Admin yang intuitif, serta **Publishing API (v2.1) & Model Context Protocol (MCP)** untuk penerbitan artikel secara otomatis oleh AI Agent (seperti Muse, Hermes, OpenClaw).

---

## 📚 Pusat Dokumentasi Resmi

Untuk kemudahan tim dan pengguna, dokumentasi telah dibagi secara terstruktur:

1. **[Dokumentasi Teknis & API Reference v2.1 (Untuk Developer)](DOKUMENTASI_TEKNIS_V2.1.md)**  
   *Panduan mendalam arsitektur sistem:*
   - Alur kerja sistem & data lifecycle (Draft → Scheduled → Published).
   - Dynamic 3-Tier Author Resolution (nama penulis dinamis tanpa hardcode).
   - Shortcode Engine (`[affiliate]` & `[img]`) dan kepatuhan otomatis FTC / Google AdSense.
   - Pipeline sanitasi HTML ketat (allowlist tags, zero inline styles/divs).
   - Keamanan, Idempotensi (`Idempotency-Key`), Token-Bucket Rate Limiter (60 req/menit), dan SHA-256 API Key Hashing.
   - Skema database lengkap (14 tabel Drizzle ORM / Neon PostgreSQL).
   - API Reference v2.1 lengkap (`/api/v1/*` & `/api/admin/*`) beserta skema OpenAPI 3.1 & Model Context Protocol (MCP).

2. **[Panduan Pengguna & Manual Operasional Admin (Untuk Pengguna / Master)](PANDUAN_PENGGUNA.md)**  
   *Panduan lengkap langkah demi langkah untuk setiap fitur di dashboard:*
   - Penjelasan fitur **Affiliate Links**: untuk apa halaman ini, cara menambah link partner, cara pasang shortcode di artikel, pelacakan klik (*Click Tracker*), dan auto-disclosure box.
   - Menulis artikel dengan Block Editor, aturan Alt Text bahasa Inggris, indikator Meta Description (130-160 karakter), dan FAQ builder untuk rich snippets Google.
   - Pengaturan penempatan iklan (*Advertisements*) untuk Google AdSense dan banner sponsor mandiri.
   - Pengaturan situs & **Default Author Name** (nama pena terpusat untuk semua artikel AI).
   - Pengelolaan halaman statis, kategori, tags, galeri media, komentar, pelanggan newsletter, pengalihan URL (Redirects 301/302), menu navigasi, dan backup data.

3. **[AI Agent Integration & Autonomous Protocol Specification (v2.1 Enterprise Spec)](AI_AGENT_INTEGRATION.md)**  
   *Spesifikasi khusus untuk autonomous agents:* Zero-slop prompt persona, runnable Python script (`agent_runner.py`), Claude Desktop MCP configuration, dan OpenClaw orchestration spec.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components, ISR/SSG)
- **Bahasa**: TypeScript
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Drizzle ORM
- **Styling**: TailwindCSS & Typography
- **Editor**: TipTap WYSIWYG
- **Autentikasi**: Custom Secure Session Cookie (Admin) & SHA-256 Bearer Token (Publishing API)
- **Protokol AI**: RESTful API v1, OpenAPI 3.1, Model Context Protocol (MCP)

---

## 🚀 Quick Start (Menjalankan Lokal)

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Konfigurasi Environment:**
   Salin `.env.example` menjadi `.env.local` dan lengkapi koneksi database:
   ```bash
   cp .env.example .env.local
   ```

3. **Migrasi Database:**
   ```bash
   npm run db:push
   ```

4. **Jalankan Development Server:**
   ```bash
   npm run dev
   ```

5. **Akses Aplikasi:**
   - Blog Publik: [http://localhost:3000](http://localhost:3000)
   - Panel Admin: [http://localhost:3000/admin](http://localhost:3000/admin)
   - Publishing API v1: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)

6. **Uji Validasi Protokol AI:**
   ```bash
   npm run test:ai
   ```
