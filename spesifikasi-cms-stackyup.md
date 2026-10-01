# Spesifikasi CMS StackYup v1.0

**Tanggal:** 1 Oktober 2026
**Tujuan:** CMS blog ringan, modern, dan gratis di-hosting untuk StackYup (blog review & komparasi AI tools/SaaS, target US/UK), lengkap dengan **Publishing API** agar Muse bisa membuat & menerbitkan artikel langsung ke database tanpa lewat antarmuka web.

---

## 1. Gambaran Umum

- **Nama proyek:** StackYup CMS
- **Fungsi utama:** mengelola artikel, halaman statis, dan media untuk blog StackYup.
- **Prinsip:**
  - Tanpa sewa hosting — manfaatkan free tier (Vercel + Postgres gratis + storage gratis).
  - SEO-first: semua kebutuhan SEO/AIO/AdSense disiapkan sejak awal.
  - API-first untuk publishing: semua yang bisa dilakukan dashboard admin, bisa dilakukan via API oleh Muse.
- **Bahasa konten:** Inggris (artikel). Bahasa UI admin: bebas (Indonesia disarankan agar nyaman).

## 2. Tech Stack Rekomendasi

| Lapisan | Rekomendasi | Alasan |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | SSG/ISR bawaan, SEO-friendly, deploy 1 klik ke Vercel |
| Hosting | Vercel (free tier) | Gratis, HTTPS otomatis, CDN global |
| Database | Postgres gratis (Neon) | Relasional, cocok untuk posts/pages/media |
| Storage gambar | Cloudinary (free tier) | URL publik + optimasi gambar |
| Auth admin | NextAuth.js / custom session | Sederhana, cukup untuk 1 admin |
| Editor | Tiptap / BlockNote (output HTML) | WYSIWYG modern, output HTML bersih |

> Catatan: stack di atas hanya rekomendasi. Jika master lebih nyaman dengan stack lain (mis. Laravel, Express, dsb.), yang wajib sama adalah **kontrak Publishing API di Bagian 6**.

## 3. Model Data

### 3.1 `posts`
| Field | Tipe | Keterangan |
|---|---|---|
| id | uuid / serial | Primary key |
| title | varchar(200) | Judul artikel |
| slug | varchar(220) | Unik, URL-friendly, auto-generate dari judul (bisa diedit) |
| content_html | text | Isi artikel dalam HTML bersih |
| excerpt | varchar(300) | Ringkasan singkat |
| meta_description | varchar(160) | Untuk tag `<meta name="description">` |
| featured_image_url | text | URL gambar utama |
| featured_image_alt | varchar(200) | Alt text (wajib, untuk SEO & aksesibilitas) |
| tags | text[] / relasi | Label/kategori, mis. `AI Tools`, `Comparisons` |
| status | enum | `draft` \| `scheduled` \| `published` |
| published_at | timestamptz | Null bila draft; diisi saat publish/terjadwal |
| faq_json | jsonb | Daftar Q&A untuk schema FAQ (opsional) |
| created_at / updated_at | timestamptz | Audit |

### 3.2 `pages`
Halaman statis: About, Contact, Privacy Policy, Disclaimer.
Field: id, title, slug (unik), content_html, meta_description, status, timestamps.

### 3.3 `media`
Field: id, filename, url, alt, width, height, size_bytes, created_at.

### 3.4 `admins`
Field: id, email (unik), password_hash (bcrypt/argon2), role, created_at.

### 3.5 `revisions` (opsional tapi disarankan)
Snapshot isi setiap kali post/page disimpan: post_id/page_id, content_html, created_at. Untuk rollback.

## 4. Fitur Dashboard Admin

1. **Login admin** — session aman, proteksi brute-force sederhana.
2. **Editor artikel:**
   - Judul + slug otomatis (editable, validasi unik).
   - Editor WYSIWYG → simpan sebagai HTML bersih.
   - Excerpt, meta description (dengan penghitung karakter), featured image (upload + alt wajib), tags.
   - Status: Draft / Terjadwal (datetime picker) / Publish.
   - FAQ builder (tambah pasangan Q&A → tersimpan di `faq_json`).
   - Preview persis tampilan publik.
3. **Halaman statis** — CRUD untuk About, Contact, Privacy Policy, Disclaimer.
4. **Media library** — upload (drag & drop), alt text, hapus, pakai ulang; kompresi otomatis.
5. **Riwayat revisi** — lihat & kembalikan versi lama.
6. **Manajemen API key** — buat, lihat (sekali saja), revoke/regenerate key untuk Muse.

## 5. Fitur Publik & SEO (wajib sejak v1)

- **Static generation (SSG/ISR):** halaman artikel di-generate statis → cepat (Core Web Vitals hijau).
- **Meta tags per artikel:** `<title>`, meta description, canonical, Open Graph, Twitter Card — semua editable dari editor.
- **XML sitemap** (`/sitemap.xml`) & **robots.txt** otomatis dari database.
- **Schema.org JSON-LD:** `Article`, `FAQPage` (dari faq_json), `BreadcrumbList`.
- **RSS feed** (`/rss.xml`).
- **Gambar:** optimasi otomatis (WebP/AVIF, responsive `srcset`, lazy-load), alt text selalu dirender.
- **ads.txt** + slot iklan responsif (persiapan AdSense; slot non-intrusif).
- **Banner persetujuan cookie** (GDPR/CCPA) — karena target US/UK.
- **GA4 + Search Console** — ID dimasukkan via settings, bukan hardcode.
- **URL bersih:** `/{slug}` untuk artikel, `/page/{slug}` untuk halaman statis.
- **Redirect 301:** tabel redirect untuk mapping URL lama Blogger → URL baru saat migrasi.

## 6. Publishing API untuk Muse ⭐

Ini bagian terpenting: API yang memungkinkan Muse membuat artikel & mengupload gambar **langsung ke database** tanpa membuka browser.

### 6.1 Base URL & Auth
- Base URL: `https://<domain-anda>/api/v1`
- Auth: header `Authorization: Bearer <API_KEY>`
- API key: string acak minimal 32 karakter, disimpan di environment variable `CMS_API_KEY` (jangan di-commit ke git).
- Key dibuat & di-revoke dari dashboard admin. Mendukung banyak key (mis. satu khusus untuk Muse).
- Rate limit: 60 request/menit per key (429 bila melebihi).

### 6.2 Upload gambar — `POST /api/v1/media`
- Content-Type: `multipart/form-data`, field `file` (jpg/png/webp, maks 5 MB).
- Field opsional: `alt` (string).
- Response `201`:
```json
{
  "id": "m_01j9...",
  "url": "https://cdn.stackyup.com/media/ai-tools-2026.webp",
  "alt": "Ilustrasi ...",
  "width": 1600,
  "height": 900
}
```

### 6.3 Buat artikel — `POST /api/v1/posts`
- Header: `Authorization: Bearer <API_KEY>`, `Content-Type: application/json`
- Header opsional: `Idempotency-Key: <uuid>` — jika request diulang dengan key sama, server tidak membuat duplikat.
- Body:
```json
{
  "title": "7 Best AI Tools for Freelancers in 2026",
  "slug": "best-ai-tools-freelancers-2026",
  "content_html": "<p>...</p><h2>...</h2>",
  "excerpt": "Ringkasan singkat ...",
  "meta_description": "Deskripsi meta maks 160 karakter ...",
  "featured_image_url": "https://cdn.stackyup.com/media/ai-tools-2026.webp",
  "featured_image_alt": "Ilustrasi ...",
  "tags": ["AI Tools", "Freelancers", "Reviews"],
  "faq": [
    {"question": "...", "answer": "..."}
  ],
  "status": "draft",
  "published_at": null
}
```
- `slug`: boleh dikosongkan → server generate dari judul (pastikan unik, tambah `-2`, `-3` bila perlu).
- `status`: `draft` (default) | `scheduled` (wajib isi `published_at` ISO 8601) | `published`.
- `content_html`: server wajib sanitasi dengan allowlist tag (`p, h2, h3, ul, ol, li, table, thead, tbody, tr, th, td, strong, em, a, img, blockquote, code, pre`) dan atribut aman.
- Response `201`:
```json
{
  "id": "p_01j9...",
  "slug": "best-ai-tools-freelancers-2026",
  "url": "https://stackyup.com/best-ai-tools-freelancers-2026",
  "status": "draft"
}
```

### 6.4 Endpoint lain
| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/v1/posts?status=draft&limit=20` | List artikel (untuk verifikasi Muse) |
| GET | `/api/v1/posts/:id_atau_slug` | Detail satu artikel |
| PATCH | `/api/v1/posts/:id` | Update (field sama seperti POST, parsial) |
| POST | `/api/v1/pages` | Buat halaman statis (field: title, slug, content_html, meta_description, status) |
| PATCH | `/api/v1/pages/:id` | Update halaman statis |
| GET | `/api/v1/media` | List media |

### 6.5 Format error standar
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "slug already exists", "details": {"slug": "best-ai-tools-freelancers-2026"} } }
```
Kode umum: `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `VALIDATION_ERROR` (422), `RATE_LIMITED` (429).

### 6.6 Contoh alur lengkap (curl)

```bash
# 1. Upload ilustrasi
curl -X POST https://stackyup.com/api/v1/media \
  -H "Authorization: Bearer $CMS_API_KEY" \
  -F "file=@ilustrasi.webp" \
  -F "alt=Ilustrasi 7 AI tools terbaik untuk freelancer"

# → dapatkan "url" dari response, mis. https://cdn.stackyup.com/media/ilustrasi.webp

# 2. Buat artikel sebagai draft
curl -X POST https://stackyup.com/api/v1/posts \
  -H "Authorization: Bearer $CMS_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "title": "7 Best AI Tools for Freelancers in 2026",
    "content_html": "<p>Isi artikel...</p>",
    "meta_description": "Deskripsi meta...",
    "featured_image_url": "https://cdn.stackyup.com/media/ilustrasi.webp",
    "featured_image_alt": "Ilustrasi 7 AI tools terbaik untuk freelancer",
    "tags": ["AI Tools", "Freelancers"],
    "status": "draft"
  }'

# 3. Publish setelah dicek
curl -X PATCH https://stackyup.com/api/v1/posts/p_01j9... \
  -H "Authorization: Bearer $CMS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "published"}'
```

### 6.7 Cara Muse memakai API ini (alur kerja)
1. Master memberi tahu Muse bahwa CMS sudah live + API key disimpan via Secure Vault.
2. Muse menulis artikel & men-generate ilustrasi seperti sekarang.
3. Muse upload ilustrasi via `POST /api/v1/media` → dapat URL.
4. Muse buat artikel via `POST /api/v1/posts` dengan `status: "draft"`.
5. Muse verifikasi via `GET /api/v1/posts/:slug`, lalu laporkan URL preview ke master.
6. Setelah master setuju (atau sesuai preferensi auto-publish yang sudah disetujui untuk StackYup), Muse `PATCH` menjadi `published`.
7. Tidak ada browser, tidak ada login web — murni API.

## 7. Keamanan

- API key & kredensial hanya di environment variable / secret manager — **tidak pernah di-commit**.
- Sanitasi semua HTML dari API maupun editor (allowlist, Bagian 6.3).
- Dashboard admin di belakang login; pertimbangkan proteksi path `/admin` (mis. IP allowlist / basic auth tambahan).
- HTTPS only (otomatis di Vercel), security headers (HSTS, X-Content-Type-Options, dsb.).
- Validasi ukuran & tipe file upload; simpan file di luar web root / via storage service.
- Log aktivitas publishing API (siapa/key apa, kapan, post apa).

## 8. Migrasi dari Blogger

1. Export seluruh post & page dari Blogger (via Blogger API / export XML).
2. Script import: mapping field Blogger → model data Bagian 3; slug lama dipertahankan bila memungkinkan.
3. Download & re-upload semua gambar ke storage baru (jangan hotlink ke Blogspot selamanya).
4. Isi tabel redirect 301: URL lama (`*.blogspot.com/...`) → URL baru.
5. Setelah DNS domain .com mengarah ke CMS baru: verifikasi Search Console ulang, submit sitemap baru, pantau 404 selama 2–4 minggu.

## 9. Roadmap Pengerjaan

- **Fase 1 — Fondasi:** setup repo + database + model data + auth admin + Publishing API (auth, posts, pages, media).
- **Fase 2 — Dashboard admin:** editor artikel, halaman statis, media library, revisi, manajemen API key.
- **Fase 3 — Frontend publik:** template baca (minimalis, cepat), SEO tags, sitemap/robots, schema, RSS, ads.txt, cookie banner, GA4.
- **Fase 4 — Go live:** migrasi konten Blogger → CMS, redirect 301, domain .com, daftar ulang Search Console, lanjutkan target 30–50 artikel → AdSense.

---

**Checklist definisi selesai (DoD) v1.0:**
- [ ] Muse bisa membuat draft artikel + upload gambar murni via API (tanpa browser).
- [ ] Artikel terbit lolos validasi: meta tags, sitemap, schema Article/FAQ, gambar terkompresi + alt.
- [ ] Semua halaman lolos Core Web Vitals (mobile).
- [ ] Konten Blogger termigrasi penuh dengan redirect 301 tanpa 404 massal.
