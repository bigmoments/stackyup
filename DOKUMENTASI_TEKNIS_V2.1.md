# StackYup CMS — Dokumentasi Teknis Sistem & API Reference v2.1

> **Versi Dokumen:** 2.1 (Enterprise Technical Specification)  
> **Status:** Production Ready  
> **Target Pengguna:** Software Engineers, Backend Developers, DevOps, Integrator AI Agent  
> **Teknologi Utama:** Next.js 15 (App Router), TypeScript, Drizzle ORM, PostgreSQL (Neon Serverless), TailwindCSS, TipTap WYSIWYG, Model Context Protocol (MCP)

---

## Daftar Isi
1. [Gambaran Arsitektur & Prinsip Desain](#1-gambaran-arsitektur--prinsip-desain)
2. [Alur Kerja Sistem (System Workflow & Data Lifecycle)](#2-alur-kerja-sistem-system-workflow--data-lifecycle)
3. [Mekanisme Khusus & Engine Inti](#3-mekanisme-khusus--engine-inti)
   - [3.1 Dynamic 3-Tier Author Resolution](#31-dynamic-3-tier-author-resolution)
   - [3.2 Shortcode Engine & FTC/AdSense Auto-Disclosure](#32-shortcode-engine--ftcadsense-auto-disclosure)
   - [3.3 Pipeline Sanitasi HTML & Format Konten](#33-pipeline-sanitasi-html--format-konten)
   - [3.4 Sistem Keamanan, Idempotensi & Rate Limiting](#34-sistem-keamanan-idempotensi--rate-limiting)
   - [3.5 Media Processing & Storage Pipeline](#35-media-processing--storage-pipeline)
   - [3.6 SEO, Schema JSON-LD & SSG/ISR Caching](#36-seo-schema-json-ld--ssgisr-caching)
4. [Skema Database & Relasi (Drizzle ORM)](#4-skema-database--relasi-drizzle-orm)
5. [Spesifikasi API Reference v2.1 (`/api/v1`)](#5-spesifikasi-api-reference-v21-apiv1)
   - [5.1 Standar Protokol & Format Respon](#51-standar-protokol--format-respon)
   - [5.2 Public Settings (`GET /api/v1/settings`)](#52-public-settings-get-apiv1settings)
   - [5.3 Affiliate Partners Discovery (`GET /api/v1/affiliates`)](#53-affiliate-partners-discovery-get-apiv1affiliates)
   - [5.4 Media Upload & List (`POST / GET /api/v1/media`)](#54-media-upload--list-post--get-apiv1media)
   - [5.5 Ingesti Artikel (`POST /api/v1/posts`)](#55-ingesti-artikel-post-apiv1posts)
   - [5.6 Verifikasi Artikel (`GET /api/v1/posts/:id_or_slug`)](#56-verifikasi-artikel-get-apiv1postsid_or_slug)
   - [5.7 Pembaruan & Publikasi Artikel (`PATCH /api/v1/posts/:id`)](#57-pembaruan--publikasi-artikel-patch-apiv1postsid)
   - [5.8 Hapus Artikel (`DELETE /api/v1/posts/:id`)](#58-hapus-artikel-delete-apiv1postsid)
   - [5.9 Halaman Statis (`GET / POST / PATCH /api/v1/pages`)](#59-halaman-statis-get--post--patch-apiv1pages)
   - [5.10 Machine Discovery: OpenAPI & MCP Tools](#510-machine-discovery-openapi--mcp-tools)
6. [API Internal Admin (`/api/admin/*`)](#6-api-internal-admin-apiadmin)
7. [Matriks Kode Error & Strategi Pemulihan](#7-matriks-kode-error--strategi-pemulihan)
8. [Setup Lingkungan & Panduan Menjalankan Project](#8-setup-lingkungan--panduan-menjalankan-project)

---

## 1. Gambaran Arsitektur & Prinsip Desain

StackYup CMS dibangun sebagai mesin publikasi hibrida (Hybrid Headless CMS):
1. **Frontend Publik Berkecepatan Tinggi**: Menggunakan Next.js 15 App Router dengan Server Components, Static Site Generation (SSG), dan Incremental Static Regeneration (ISR) untuk mencapai nilai Core Web Vitals optimal (LCP < 1.2s, CLS = 0).
2. **Dashboard Administrasi Lengkap**: Antarmuka berbasis React Client Components di `/admin` dengan autentikasi berbasis session cookie aman, enkripsi bcrypt, dan dashboard analitik interaktif.
3. **Publishing Engine Otomatis**: Menyediakan API RESTful v1 (`/api/v1`) dan bridge Model Context Protocol (MCP) untuk automasi agen AI (Muse, Hermes, OpenClaw, AutoGen, CrewAI, LangChain) tanpa perlu interaksi grafis (headless publishing).

### Diagram Topologi Sistem

```mermaid
graph TD
    subgraph Klien & Integrasi
        Browser[Pembaca Web / Pengunjung]
        AdminUI[Admin Dashboard /admin]
        AIAgent[AI Agents / Muse / MCP Bridge]
    end

    subgraph Gerbang Layanan Next.js
        Middleware[Next.js Middleware: Auth & Rate Limiter]
        PubRouter[Public App Router: /[slug], /page/[slug]]
        AdminRouter[Admin App Router: /admin/*]
        APIRouter[REST API Router: /api/v1/* & /api/admin/*]
    end

    subgraph Engine Inti & Utilitas
        Sanitizer[HTML Sanitizer Allowlist Engine]
        ShortcodeEng[Shortcode Parser: affiliate & img]
        AuthorResolver[3-Tier Dynamic Author Resolver]
        IdempotencyEng[Idempotency Key Vault]
        SEOEngine[Metadata & JSON-LD Generator]
    end

    subgraph Penyimpanan & Persistensi
        Postgres[(Neon Serverless PostgreSQL / Drizzle ORM)]
        Storage[(Media Storage: Local Disk / Cloudinary)]
    end

    Browser -->|HTTP GET| PubRouter
    AdminUI -->|Session Cookie| Middleware
    Middleware --> AdminRouter
    AdminRouter --> APIRouter
    AIAgent -->|Bearer API Key| Middleware
    Middleware --> APIRouter

    APIRouter --> IdempotencyEng
    APIRouter --> Sanitizer
    APIRouter --> AuthorResolver
    APIRouter --> Postgres
    APIRouter --> Storage

    PubRouter --> Postgres
    PubRouter --> ShortcodeEng
    PubRouter --> AuthorResolver
    PubRouter --> SEOEngine
```

---

## 2. Alur Kerja Sistem (System Workflow & Data Lifecycle)

### Siklus Hidup Artikel (Post Lifecycle)
Setiap artikel dalam sistem melewati transisi status berikut:
- **`draft`**: Artikel telah di-ingest, di-sanitasi, dan tersimpan di database. Artikel memiliki URL preview admin tetapi **tidak dapat diakses oleh publik** (mengembalikan HTTP 404 pada route umum).
- **`scheduled`**: Artikel disiapkan untuk tayang pada masa mendatang. Memiliki atribut `published_at` terisi dengan timestamp masa depan.
- **`published`**: Artikel aktif dan di-index oleh search engine. Next.js melakukan caching SSG/ISR dan menyertakan URL artikel ke dalam XML Sitemap (`/sitemap.xml`) serta RSS Feed (`/rss.xml`).

### Diagram Urutan Ingesti & Publikasi Otonom

```mermaid
sequenceDiagram
    autonumber
    actor Agent as AI Agent (Muse / Hermes)
    participant API as StackYup API v1 (/api/v1)
    participant Sec as Auth & Idempotency Vault
    participant Pipe as Sanitizer & Shortcode Pipeline
    participant DB as Neon PostgreSQL (Drizzle)
    participant Web as Public Web Engine

    Agent->>API: 1. GET /api/v1/affiliates (Temukan Partner Aktif)
    API-->>Agent: Daftar partner aktif (ID shortcode & default anchor)

    Agent->>API: 2. POST /api/v1/media (Upload gambar WebP)
    API->>DB: Catat metadata media (width, height, alt)
    API-->>Agent: Return media_id & cdn_url

    Agent->>API: 3. POST /api/v1/posts (Header: Idempotency-Key)
    API->>Sec: Verifikasi Bearer Key & cek duplikasi idempotensi
    API->>Pipe: Sanitasi tag HTML kotor (hapus div, inline style, js)
    API->>DB: Simpan post (status: draft, author_name: null)
    API-->>Agent: Return ID artikel (p_xxx) & preview link

    Agent->>API: 4. GET /api/v1/posts/:slug_or_id (Verifikasi format)
    API-->>Agent: JSON detail artikel dengan snake_case

    Agent->>API: 5. PATCH /api/v1/posts/:id (Promosi ke status published)
    API->>DB: Update status: published, published_at: now()
    API-->>Agent: Artikel live 200 OK

    Web->>DB: Query artikel saat pembaca membuka /{slug}
    Web->>Pipe: Ekspansi shortcode [affiliate] & [img]
    Web->>Web: Pasang FTC Disclosure Box & JSON-LD
    Web-->>Agent: Halaman ter-render sempurna
```

---

## 3. Mekanisme Khusus & Engine Inti

### 3.1 Dynamic 3-Tier Author Resolution

Untuk mencegah kerapuhan sistem akibat nama penulis yang di-hardcode di kode, skrip AI, atau prompt spesifikasi, StackYup CMS menerapkan resolusi identitas penulis 3-lapis secara dinamis:

```text
[Lapis 1: Request Override]
  Apakah payload request eksplisit menyertakan "author_name"?
     ├── YA  ─► Gunakan nilai tersebut (Mis. guest post "Dr. Sarah Connor")
     └── TIDAK (null / omitted)
           ▼
[Lapis 2: Site Settings (Database)]
  Apakah tabel site_settings memiliki kunci "default_author_name"?
     ├── YA  ─► Gunakan nilai tersebut (Mis. "Adit")
     └── TIDAK (kosong / belum diset)
           ▼
[Lapis 3: Server Fallback]
  Fallback bawaan: "Editorial Team"
```

#### Aturan untuk Pengembang & AI Agent:
1. Kolom database `posts.author_name` bersifat **nullable** (`varchar(100)`).
2. Nilai `null` di database secara tegas berarti: *"Gunakan persona penulis default dari pengaturan situs"*.
3. **AI Agent dilarang mengirim field `author_name` secara default.** Payload agent membiarkan field ini kosong agar pemilik situs dapat mengubah nama pena blog kapan saja dari Dashboard Admin tanpa harus mengubah skrip atau instruksi agen AI.
4. Pada layer frontend (`src/app/[slug]/page.tsx`), nama penulis di-resolve secara dinamis baik untuk tampilan visual maupun Structured Data Schema (`JSON-LD Article`):
   ```typescript
   const resolvedAuthor = post.authorName || siteSettings.default_author_name || "Editorial Team";
   ```

---

### 3.2 Shortcode Engine & FTC/AdSense Auto-Disclosure

Sistem melarang keras penulisan link afiliasi mentah (`<a href="https://vendor.com/?ref=...">`) di dalam konten artikel. Sebagai gantinya, digunakan sistem **Shortcode Terkelola**.

#### 1. Shortcode Afiliasi (`[affiliate]`)
Format yang didukung:
- **Anchor Teks Default**: `[affiliate id="runpod"]`  
  *Output HTML saat render:*  
  `<a href="/api/affiliates/redirect/runpod" target="_blank" rel="sponsored nofollow" class="affiliate-link">RunPod</a>`
- **Anchor Teks Kustom**: `[affiliate id="runpod" text="Sewa GPU Cloud RunPod"]`  
  *Output HTML saat render:*  
  `<a href="/api/affiliates/redirect/runpod" target="_blank" rel="sponsored nofollow" class="affiliate-link">Sewa GPU Cloud RunPod</a>`

#### 2. Shortcode Gambar Sekunder Inline (`[img]`)
Untuk gambar ilustrasi/diagram di dalam tubuh artikel:
- Format: `[img id="m_01j9abc..." alt="Diagram arsitektur microservices" caption="Benchmark throughput 50k RPS"]`
- Output yang di-generate:
  ```html
  <figure class="my-8">
    <img src="/uploads/m_01j9abc.webp" alt="Diagram arsitektur microservices" loading="lazy" width="1600" height="900" class="rounded-xl border" />
    <figcaption class="text-center text-xs text-gray-500 mt-2">Benchmark throughput 50k RPS</figcaption>
  </figure>
  ```

#### 3. Otomatisasi Kepatuhan FTC & Regulasi AdSense
- **Larangan Menulis Disclaimer Manual**: Penulis dan AI Agent **DILARANG KERAS** mengetik teks pernyataan komisi manual (seperti *"Disclosure: Article ini mengandung link afiliasi..."*).
- **Auto-Injection Banner**: Saat engine render mendeteksi keberadaan shortcode `[affiliate]` di dalam artikel, kotak keterbukaan `AffiliateDisclosureBox` otomatis disuntikkan **di bagian atas artikel** (tepat di atas badan artikel dan sebelum tautan afiliasi pertama ditemukan oleh pembaca). Hal ini menjamin prinsip *clear and conspicuous* sesuai standar FTC 16 CFR § 255.5 dan AdSense policy, sekaligus mencegah bug tampilan duplikasi (double disclosure).

---

### 3.3 Pipeline Sanitasi HTML & Format Konten

Untuk menjamin keamanan dari serangan Cross-Site Scripting (XSS) dan menjaga kebersihan DOM layout, konten artikel melewati pipeline pemrosesan berurutan:

```mermaid
graph LR
    Raw[Raw HTML Ingestion] --> Sanitizer[1. Allowlist HTML Sanitizer]
    Sanitizer --> DBStore[(Simpan ke Database)]
    DBStore --> Expander[2. Shortcode Parser: affiliate & img]
    Expander --> AdsInjector[3. Automated Ad Slot Injection]
    AdsInjector --> FinalRender[Final Safe HTML Render]
```

> [!IMPORTANT]
> **Aturan Urutan Pipeline:**
> **HTML Sanitizer dijalankan PERTAMA KALI**, kemudian **Shortcode Expansion dijalankan KEDUA**. Dengan cara ini, shortcode tidak akan rusak atau terhapus oleh sanitizer saat penyimpanan, dan link yang dihasilkan oleh shortcode dijamin aman.

#### Tag HTML yang Diizinkan (Allowlist):
- **Teks & Paragraf**: `p`, `h2`, `h3`, `strong`, `em`, `blockquote`
- **Daftar**: `ul`, `ol`, `li`
- **Tabel Data**: `table`, `thead`, `tbody`, `tr`, `th`, `td`
- **Kode Program**: `pre`, `code` (Atribut yang diizinkan hanya: `class="language-{lang}"`)
- **Tautan & Media**: `a` (dengan atribut `href`, `title`, `target`, `rel`), `img` (dengan atribut `src`, `alt`, `width`, `height`, `loading`)

#### Aturan Mutlak Format:
1. **Dilarang menggunakan tag `<div>`** di dalam konten artikel.
2. **Dilarang menggunakan inline styles** (`style="..."`).
3. **Dilarang menggunakan custom CSS class** (kecuali kelas bahasa sintaks `class="language-*"` khusus pada tag `<code>`).

---

### 3.4 Sistem Keamanan, Idempotensi & Rate Limiting

#### 1. Autentikasi API Key Berbasis Hash SHA-256
- Kunci API diterbitkan dengan format acak berpanjang 40 karakter diawali prefix `sy_live_` atau `sy_test_`.
- Plaintext API key hanya diperlihatkan **satu kali** kepada pengguna di dashboard saat pembuatan.
- Database hanya menyimpan nilai hash kriptografis `key_hash = SHA256(apiKey)` dan `key_prefix`. Verifikasi autentikasi dilakukan dengan membandingkan hash SHA-256 dari header request secara konstan (*constant-time lookup*).

#### 2. Header Idempotensi (`Idempotency-Key`)
- Untuk mencegah pengiriman ganda pada operasi `POST /api/v1/posts` akibat koneksi timeout atau retry otomatis pada AI agent, klien dapat mengirimkan header `Idempotency-Key: <UUID>`.
- Jika request dengan key yang sama diterima dalam rentang waktu berlaku, server mengembalikan respon tersimpan sebelumnya dari tabel `idempotency_keys` tanpa membuat record duplikat baru.

#### 3. Token-Bucket Rate Limiter
- Setiap API Key dibatasi kuota **60 request/menit**.
- Jika batas kuota terlampaui, server mengembalikan respon HTTP:
  ```http
  HTTP/1.1 429 Too Many Requests
  Content-Type: application/json
  Retry-After: 30

  {
    "success": false,
    "error": {
      "code": "RATE_LIMITED",
      "message": "Rate limit exceeded. Please wait 30 seconds."
    }
  }
  ```

---

### 3.5 Media Processing & Storage Pipeline

- **Format Input**: Mendukung `image/jpeg`, `image/png`, `image/webp`. Ukuran maksimal per file adalah **5 MB**.
- **Kompresi & Metadata**: Gambar dikonversi atau dioptimasi menjadi format WebP terkompresi. Sistem otomatis membaca dimensi intrinsik (`width` dan `height`) dan ukuran byte untuk mencegah pergeseran tata letak kumulatif (*Cumulative Layout Shift / CLS*).
- **Driver Penyimpanan**:
  - *Local Disk Driver*: Menyimpan berkas di folder `/public/uploads/` dengan penamaan file berbasis NanoID unik (`m_xxxxxxxx.webp`).
  - *Cloudinary Driver (Opsional)*: Mengunggah berkas langsung ke bucket Cloudinary jika variabel `CLOUDINARY_URL` terkonfigurasi.

---

### 3.6 SEO, Schema JSON-LD & SSG/ISR Caching

Setiap artikel yang dipublikasikan secara otomatis memproduksi komponen optimasi mesin pencari:
1. **Meta Tags Lengkap**: `<title>`, `<meta name="description">` (optimal 130–160 karakter), `canonical`, `OpenGraph (og:title, og:image, og:type=article)`, dan `Twitter Cards (summary_large_image)`.
2. **Schema.org Structured Data (JSON-LD)**:
   - `@type: Article`: Menyertakan `headline`, `image`, `datePublished`, `dateModified`, dan objek `author` (yang di-resolve dari 3-Tier Resolution).
   - `@type: FAQPage`: Otomatis dibuat jika artikel menyertakan data pasangan tanya-jawab pada kolom `faq_json`.
   - `@type: BreadcrumbList`: Navigasi hierarkis Google SERP.
3. **Peta Situs Dinamis**:
   - `GET /sitemap.xml`: XML sitemap terkompresi memuat seluruh artikel dan halaman statis dengan status `published`.
   - `GET /rss.xml`: RSS feed 2.0 untuk agregator berita dan newsletter engine.

---

## 4. Skema Database & Relasi (Drizzle ORM)

Implementasi skema basis data didefinisikan menggunakan Drizzle ORM di `src/db/schema.ts`.

### Diagram Entitas Relasi (ERD)

```mermaid
erDiagram
    POSTS ||--o{ REVISIONS : has
    POSTS ||--o{ COMMENTS : receives
    PAGES ||--o{ REVISIONS : has
    
    POSTS {
        varchar id PK
        varchar title
        varchar slug UK
        text content_html
        varchar excerpt
        varchar meta_description
        text featured_image_url
        varchar featured_image_alt
        jsonb tags
        jsonb faq_json
        integer claps
        varchar author_name "Nullable - 3-tier resolution"
        varchar status "draft, scheduled, published"
        timestamp published_at
        timestamp created_at
        timestamp updated_at
    }

    PAGES {
        varchar id PK
        varchar title
        varchar slug UK
        text content_html
        varchar meta_description
        varchar status
        timestamp created_at
        timestamp updated_at
    }

    MEDIA {
        varchar id PK
        varchar filename
        text url
        varchar alt
        integer width
        integer height
        integer size_bytes
        varchar mime_type
        timestamp created_at
    }

    API_KEYS {
        varchar id PK
        varchar name
        varchar key_hash UK
        varchar key_prefix
        boolean is_active
        timestamp last_used_at
        timestamp created_at
    }

    SITE_SETTINGS {
        varchar key PK
        text value
        timestamp updated_at
    }

    AD_PLACEMENTS {
        varchar id PK
        varchar slot_key UK
        varchar title
        boolean is_enabled
        varchar provider
        varchar ad_client
        varchar ad_slot
        text custom_html
        timestamp updated_at
    }

    REDIRECTS {
        varchar id PK
        varchar from_path UK
        varchar to_path
        integer status_code
        timestamp created_at
    }

    COMMENTS {
        varchar id PK
        varchar post_id
        varchar post_title
        varchar author_name
        varchar author_email
        text content
        varchar status
        timestamp created_at
    }
```

---

## 5. Spesifikasi API Reference v2.1 (`/api/v1`)

### 5.1 Standar Protokol & Format Respon

- **Base URL**:
  - Development: `http://localhost:3000/api/v1`
  - Production: `https://stackyup.com/api/v1`
- **Header Wajib**:
  - Autentikasi: `Authorization: Bearer <API_KEY>` (atau `x-api-key: <API_KEY>`)
  - Format Konten: `Content-Type: application/json`
- **Konvensi Naming**: Seluruh field request payload dan response serialisasi menggunakan format **`snake_case`**.

#### Struktur Standar Respon Sukses:
```json
{
  "success": true,
  "data": { ... }
}
```

#### Struktur Standar Respon Error:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human readable error description",
    "details": null
  }
}
```

---

### 5.2 Public Settings (`GET /api/v1/settings`)
Endpoint publik untuk mengecek konfigurasi situs dan nama persona penulis terpusat.

- **Method**: `GET`
- **Autentikasi**: Tidak diperlukan (Publik)
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "data": {
      "site_name": "StackYup",
      "site_tagline": "Modern AI & Tech Tools for Freelancers",
      "site_url": "https://stackyup.com",
      "default_author_name": "Adit",
      "brand_color": "#079653",
      "posts_per_page": 10
    }
  }
  ```

---

### 5.3 Affiliate Partners Discovery (`GET /api/v1/affiliates`)
Digunakan oleh penulis dan AI Agent sebelum merancang konten artikel untuk menemukan daftar partner komersial aktif beserta ID shortcode resminya.

- **Method**: `GET`
- **Autentikasi**: `Bearer <API_KEY>`
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "data": {
      "affiliates": [
        {
          "id": "runpod",
          "brand": "RunPod",
          "category": "Cloud GPU",
          "default_anchor": "RunPod",
          "shortcode_example": "[affiliate id=\"runpod\"]",
          "affiliate_url": "https://runpod.io?ref=stackyup",
          "disclosure": "Sponsored partner link"
        },
        {
          "id": "cursor",
          "brand": "Cursor IDE",
          "category": "Developer Tool",
          "default_anchor": "Cursor",
          "shortcode_example": "[affiliate id=\"cursor\"]",
          "affiliate_url": "https://cursor.com/ref=stackyup",
          "disclosure": "Partner link"
        }
      ]
    }
  }
  ```

---

### 5.4 Media Upload & List (`POST / GET /api/v1/media`)

#### A. Mengunggah Gambar (`POST /api/v1/media`)
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `file` (File biner): File gambar JPG, PNG, atau WebP (maksimal 5 MB).
  - `alt` (Text, Wajib): Deskripsi gambar dalam Bahasa Inggris untuk SEO Google Images.
- **Contoh Request cURL**:
  ```bash
  curl -X POST "https://stackyup.com/api/v1/media" \
    -H "Authorization: Bearer $CMS_API_KEY" \
    -F "file=@/path/to/diagram.webp" \
    -F "alt=Latency comparison benchmark across 5 LLM inference engines"
  ```
- **Response 201 Created**:
  ```json
  {
    "success": true,
    "data": {
      "id": "m_01j9a4b8c12",
      "filename": "m_01j9a4b8c12.webp",
      "url": "https://stackyup.com/uploads/m_01j9a4b8c12.webp",
      "alt": "Latency comparison benchmark across 5 LLM inference engines",
      "width": 1600,
      "height": 900,
      "size_bytes": 142050,
      "shortcode": "[img id=\"m_01j9a4b8c12\" alt=\"Latency comparison benchmark across 5 LLM inference engines\"]"
    }
  }
  ```

#### B. Mengambil Daftar Media Galeri (`GET /api/v1/media`)
- **Query Parameters**:
  - `limit` (integer, default: 20, max: 100)
  - `offset` (integer, default: 0)
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "m_01j9a4b8c12",
          "url": "https://stackyup.com/uploads/m_01j9a4b8c12.webp",
          "alt": "Latency comparison benchmark",
          "width": 1600,
          "height": 900,
          "created_at": "2026-10-02T08:00:00Z"
        }
      ],
      "total": 45
    }
  }
  ```

---

### 5.5 Ingesti Artikel (`POST /api/v1/posts`)

Endpoint utama untuk mendaftarkan draf atau menjadwalkan artikel baru.

- **Method**: `POST`
- **Headers**:
  - `Authorization: Bearer <API_KEY>`
  - `Content-Type: application/json`
  - `Idempotency-Key: <UUID>` *(Sangat disarankan)*
- **Body JSON Schema**:
  ```json
  {
    "title": "Top 5 Serverless GPU Platforms for LLM Fine-Tuning in 2026",
    "slug": "top-serverless-gpu-platforms-llm-2026",
    "content_html": "<p>Fine-tuning open-weights models requires dedicated compute...</p><h2>Cost per GPU Hour</h2><p>Here is how platforms stack up when running Llama 3 70B:</p>[affiliate id=\"runpod\" text=\"Check RunPod GPU pricing\"]",
    "excerpt": "A hands-on cost and latency benchmark comparing RunPod, Together AI, and Lambda Labs for LLM fine-tuning.",
    "meta_description": "Compare top serverless GPU platforms for LLM fine-tuning in 2026. Real latency benchmarks, pricing per GPU hour, and cold-start performance.",
    "featured_image_url": "https://stackyup.com/uploads/m_01j9a4b8c12.webp",
    "featured_image_alt": "Serverless GPU platform benchmark comparison 2026",
    "tags": ["AI Tools", "GPU Cloud", "Machine Learning"],
    "faq": [
      {
        "question": "Which serverless GPU provider offers the lowest cold start?",
        "answer": "In our empirical testing across 500 cold starts, RunPod instances spun up in under 8.4 seconds."
      }
    ],
    "status": "draft",
    "published_at": null
  }
  ```

> [!NOTE]
> Perhatikan bahwa field `author_name` **tidak disertakan** di atas. Server secara otomatis akan mengasosiasikan artikel ini dengan `default_author_name` pada Site Settings saat dirender.

- **Response 201 Created**:
  ```json
  {
    "success": true,
    "data": {
      "id": "p_01j9x7k2m99",
      "title": "Top 5 Serverless GPU Platforms for LLM Fine-Tuning in 2026",
      "slug": "top-serverless-gpu-platforms-llm-2026",
      "url": "https://stackyup.com/top-serverless-gpu-platforms-llm-2026",
      "preview_url": "https://stackyup.com/admin/posts/p_01j9x7k2m99",
      "status": "draft",
      "resolved_author": "Adit",
      "created_at": "2026-10-02T08:15:00Z"
    }
  }
  ```

---

### 5.6 Verifikasi Artikel (`GET /api/v1/posts/:id_or_slug`)

Mengambil data lengkap artikel untuk verifikasi kebenaran formatting HTML dan skema FAQ sebelum dipromosikan ke status publikasi.

- **Method**: `GET`
- **URL Param**: `id_or_slug` (contoh: `p_01j9x7k2m99` atau `top-serverless-gpu-platforms-llm-2026`)
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "data": {
      "id": "p_01j9x7k2m99",
      "title": "Top 5 Serverless GPU Platforms for LLM Fine-Tuning in 2026",
      "slug": "top-serverless-gpu-platforms-llm-2026",
      "content_html": "<p>Fine-tuning open-weights models...</p>",
      "excerpt": "A hands-on cost and latency benchmark...",
      "meta_description": "Compare top serverless GPU platforms...",
      "featured_image_url": "https://stackyup.com/uploads/m_01j9a4b8c12.webp",
      "featured_image_alt": "Serverless GPU platform benchmark comparison 2026",
      "tags": ["AI Tools", "GPU Cloud", "Machine Learning"],
      "faq": [
        {
          "question": "Which serverless GPU provider offers the lowest cold start?",
          "answer": "In our empirical testing across 500 cold starts, RunPod instances spun up in under 8.4 seconds."
        }
      ],
      "claps": 0,
      "author_name": null,
      "resolved_author": "Adit",
      "status": "draft",
      "published_at": null,
      "created_at": "2026-10-02T08:15:00Z",
      "updated_at": "2026-10-02T08:15:00Z"
    }
  }
  ```

---

### 5.7 Pembaruan & Publikasi Artikel (`PATCH /api/v1/posts/:id`)

Digunakan untuk mengubah konten atau mengubah status draft menjadi `published`.

- **Method**: `PATCH`
- **URL Param**: `id` (ID artikel berformat `p_...`)
- **Body JSON (Mempublikasikan Artikel)**:
  ```json
  {
    "status": "published"
  }
  ```
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "data": {
      "id": "p_01j9x7k2m99",
      "slug": "top-serverless-gpu-platforms-llm-2026",
      "status": "published",
      "published_at": "2026-10-02T08:20:00Z",
      "url": "https://stackyup.com/top-serverless-gpu-platforms-llm-2026"
    }
  }
  ```

---

### 5.8 Hapus Artikel (`DELETE /api/v1/posts/:id`)
- **Method**: `DELETE`
- **URL Param**: `id` (ID artikel)
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Post p_01j9x7k2m99 deleted successfully",
      "id": "p_01j9x7k2m99"
    }
  }
  ```

---

### 5.9 Halaman Statis (`GET / POST / PATCH /api/v1/pages`)

Mengelola konten halaman dasar seperti *About Us*, *Privacy Policy*, *Terms of Service*, dan *Disclaimer*.

#### A. Membuat Halaman Baru (`POST /api/v1/pages`)
- **Body JSON**:
  ```json
  {
    "title": "Affiliate & Commercial Disclosure",
    "slug": "disclaimer",
    "content_html": "<p>StackYup is an independent publication dedicated to reviewing software tools...</p>",
    "meta_description": "Official commercial and affiliate disclosure policy for StackYup readers.",
    "status": "published"
  }
  ```
- **Response 201 Created**:
  ```json
  {
    "success": true,
    "data": {
      "id": "page_01j9...",
      "slug": "disclaimer",
      "url": "https://stackyup.com/page/disclaimer",
      "status": "published"
    }
  }
  ```

---

### 5.10 Machine Discovery: OpenAPI & MCP Tools

StackYup CMS menyediakan antarmuka penemuan otomatis untuk agen cerdas:
1. **OpenAPI 3.1 Spec**: `GET /api/v1/openapi.json`  
   Menyediakan skema RESTful OpenAPI 3.1 lengkap untuk generator SDK atau LangChain/CrewAI OpenAPI tools.
2. **Model Context Protocol (MCP)**: `GET /api/v1/mcp`  
   Menyediakan katalog JSON tool schemas untuk protokol Claude Desktop MCP dan Hermes Agent:
   - `stackyup_get_settings`: Membaca identitas situs & default author name.
   - `stackyup_list_affiliates`: Mengambil daftar partner aktif & shortcode ID.
   - `stackyup_upload_media`: Mengunggah gambar lokal ke storage CMS.
   - `stackyup_create_draft`: Membuat draf artikel baru.
   - `stackyup_verify_post`: Mengambil data post untuk verifikasi.
   - `stackyup_publish_post`: Mempromosikan draf menjadi artikel terbit.
3. **Agent Markdown Spec**: `GET /api/v1/agent-spec.md`  
   Menyediakan teks murni panduan sistem langsung ke prompt window LLM.

---

## 6. API Internal Admin (`/api/admin/*`)

Rute-rute di bawah ini digunakan oleh antarmuka Admin Web (`/admin`) dan memerlukan autentikasi **Session Cookie**:

| Endpoint | Method | Fungsi Utama |
|---|---|---|
| `/api/admin/login` | `POST` | Autentikasi email & password admin, menerbitkan secure cookie. |
| `/api/admin/logout` | `POST` | Menghapus session cookie admin. |
| `/api/admin/settings` | `GET`, `POST` | Mengambil dan menyimpan konfigurasi umum situs & default author. |
| `/api/admin/affiliates` | `GET`, `POST`, `DELETE` | CRUD daftar partner komersial & pencatatan counter klik. |
| `/api/admin/advertisements`| `POST` | Mengaktifkan/menonaktifkan slot iklan AdSense dan banner sponsor. |
| `/api/admin/api-keys` | `GET`, `POST`, `DELETE` | Manajemen kunci API pihak ketiga / Muse AI Agent. |
| `/api/admin/categories` | `GET`, `POST`, `DELETE` | CRUD kategori artikel. |
| `/api/admin/tags` | `GET`, `POST`, `DELETE` | CRUD label / tag artikel. |
| `/api/admin/comments` | `GET`, `PATCH`, `DELETE`| Moderasi komentar pembaca (approve, spam, trash). |
| `/api/admin/subscribers` | `GET`, `DELETE` | Manajemen daftar pelanggan newsletter (termasuk export CSV). |
| `/api/admin/newsletter` | `POST` | Menyusun & menyiarkan draf email blast ke pelanggan. |
| `/api/admin/redirects` | `GET`, `POST`, `DELETE` | Konfigurasi pemetaan pengalihan URL 301 / 302. |
| `/api/admin/menus` | `GET`, `POST` | Konfigurasi tautan navigasi header dan footer. |
| `/api/admin/backups` | `GET`, `POST` | Ekspor JSON snapshot database penuh & pemulihan data. |
| `/api/admin/import-blogger`| `POST` | Utilitas migrasi artikel dari file ekspor XML Blogger. |
| `/api/admin/system` | `GET` | Health check koneksi database PostgreSQL dan runtime Vercel. |

---

## 7. Matriks Kode Error & Strategi Pemulihan

| HTTP Status | Error Code | Penyebab Terjadinya | Strategi Remediasi Klien / Developer |
|---|---|---|---|
| `401` | `UNAUTHORIZED` / `INVALID_API_KEY` | Header `Authorization` tidak ada, salah format, atau API Key telah di-revoke. | Periksa konfigurasi API Key di `.env.local` atau generate key baru di dashboard admin. |
| `400` | `VALIDATION_ERROR` | Payload JSON tidak lengkap, format slug tidak valid, atau alt text gambar kosong. | Periksa struktur data payload terhadap schema Zod; pastikan `title` dan `content_html` terisi. |
| `409` | `SLUG_EXISTS` | Slug URL yang dikirim sudah digunakan oleh artikel lain di database. | Ubah slug dengan menambahkan sufiks angka unik (mis. `-2`) atau biarkan slug kosong agar di-generate otomatis oleh server. |
| `413` | `PAYLOAD_TOO_LARGE` | Berkas gambar yang diunggah ke `/api/v1/media` melebihi 5 MB. | Kompres gambar menjadi format WebP dengan kualitas 82% sebelum diunggah. |
| `429` | `RATE_LIMITED` | Klien melebihi kuota 60 request per menit. | Baca nilai header respon `Retry-After`, lakukan penundaan eksekusi (*exponential backoff sleep*), lalu ulangi request. |
| `500` | `INTERNAL_SERVER_ERROR` | Kesalahan query database PostgreSQL atau storage failure. | Periksa koneksi basis data di Neon Console atau log runtime di Vercel Dashboard. |

---

## 8. Setup Lingkungan & Panduan Menjalankan Project

### 1. Kebutuhan Sistem
- **Node.js**: v18.18.0 atau lebih tinggi (disarankan Node.js 20 LTS).
- **Package Manager**: `npm` (atau `pnpm`).
- **Database**: PostgreSQL (direkomendasikan Neon Serverless Postgres gratis).

### 2. Konfigurasi Variabel Lingkungan (`.env.local`)
Buat file `.env.local` pada direktori root project dengan menyalin template berikut:

```env
# Koneksi Database PostgreSQL
DATABASE_URL="postgres://username:password@ep-sample-pooler.us-east-2.aws.neon.tech/stackyup?sslmode=require"

# Kunci API Master untuk Akses Publishing Agent
CMS_API_KEY="sy_live_d8f7e6a1b2c3d4e5f60718293a4b5c6d"

# URL Publik Website
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Kunci Rahasia Session Auth Admin
SESSION_SECRET="rahasia_string_acak_minimal_32_karakter_untuk_cookie_session"

# Storage Driver (Opsional, jika menggunakan Cloudinary)
# CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
```

### 3. Migrasi & Seed Basis Data
Jalankan perintah Drizzle untuk membuat tabel dan data inisialisasi:
```bash
# Push skema tabel ke database PostgreSQL
npm run db:push

# (Opsional) Jalankan seed untuk mengisi akun admin & konfigurasi awal
npm run db:seed
```

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Aplikasi akan aktif di:
- **Halaman Blog Publik**: [http://localhost:3000](http://localhost:3000)
- **Dashboard Admin**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **API Base URL**: [http://localhost:3000/api/v1](http://localhost:3000/api/v1)

### 5. Menjalankan Test Suite AI & Protocol Verification
Untuk memastikan seluruh endpoint REST, protokol MCP, idempotensi, dan resolusi author berfungsi tanpa cela:
```bash
npm run test:ai
```
*(Seluruh 45 skenario pengujian harus berstatus **PASSED**).*

---
*Dokumentasi ini dipelihara secara resmi oleh StackYup Core Engineering Team.*
