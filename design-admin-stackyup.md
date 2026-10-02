# StackYup Admin Dashboard --- Design, Functions & Features

## 1. Tujuan

StackYup Admin adalah CMS dan workspace editorial untuk mengelola
seluruh operasi situs: menulis, mengoptimasi SEO, menerbitkan, memonitor
performa, mengelola audience, dan monetisasi.

Alur utama: `WRITE → OPTIMIZE → PUBLISH → DISTRIBUTE → MONITOR → UPDATE`

Dashboard harus cepat menjawab: - Apa yang perlu ditangani hari ini? -
Konten mana yang perform? - Artikel mana yang perlu diterbitkan atau
diperbarui? - Apakah ada masalah SEO? - Bagaimana performa komentar,
newsletter, iklan, dan affiliate?

## 2. Layout Global

Desktop menggunakan sidebar kiri tetap + topbar + workspace.

``` text
┌───────────────┬──────────────────────────────────────────┐
│ StackYup.     │ TOPBAR                                   │
│               ├──────────────────────────────────────────┤
│ SIDEBAR       │ MAIN WORKSPACE                           │
│ 220–240px     │                                          │
└───────────────┴──────────────────────────────────────────┘
```

Token: - Sidebar: 232px - Topbar: 64px - Background: #F7F9F8 - Surface:
#FFFFFF - Text: #101313 - Secondary: #667085 - Border: #E6EBE8 - Green:
#079653 - Soft green: #EAF8F0 - Radius card: 10--12px - Shadow: sangat
minimal

Admin dibuat lebih padat daripada website publik.

## 3. Topbar

Struktur:
`☰  [Search posts, pages, categories... Ctrl K]  [View Site ↗]  🔔  [A] Adit ▾`

Fungsi: - Global search: posts, pages, categories, tags, media, users. -
Shortcut Ctrl/Cmd+K. - View Site membuka website publik. -
Notifications: komentar baru, scheduled post gagal, broken link, masalah
SEO, backup gagal. - User menu: Profile, Account Settings, View Site,
Logout.

## 4. Sidebar Navigasi

``` text
Dashboard

CONTENT
  Posts
  Categories
  Tags
  Media
  Pages
  Comments

APPEARANCE
  Site Settings
  Navigation
  Theme

AUDIENCE
  Newsletter
  Subscribers
  Analytics

MONETIZATION
  Advertisements
  Affiliate Links

SEO
  SEO Overview
  Sitemap
  Redirects
  Broken Links

SYSTEM
  Users
  Settings
  Backups
```

Hindari membuat halaman terpisah untuk setting kecil yang sebenarnya
bisa digabung.

## 5. Dashboard Home

Header: `Welcome back, Adit! 👋`
`Here's what's happening with StackYup today.`

Kanan: date-range selector.

Dashboard adalah control center, bukan sekadar halaman statistik.

### KPI

Empat KPI utama: - Page Views - Published Posts - Comments - Newsletter
Subscribers

Setiap card berisi current value, perubahan vs periode sebelumnya,
sparkline kecil, dan dapat diklik ke laporan detail.

### Traffic Overview

Grafik besar berisi: - Page Views - Unique Visitors - Average Engagement
Time

Fitur: - date range - toggle metric - tooltip nilai harian - link ke
Analytics

### Quick Actions

-   **+ Create New Post** sebagai CTA utama
-   Write with AI (hanya jika benar-benar tersedia)
-   Upload Media
-   Manage Categories
-   View Site

### Recent Posts

Kolom:
`Checkbox | Thumbnail + Title | Status | Category | Date | Views | Comments | Actions`

Status: `Published / Draft / Scheduled / Review / Archived`

Row actions: `Edit / Preview / Duplicate / Unpublish / Trash`

Bulk: `Publish / Change Category / Add Tag / Archive / Delete`

### Drafts

Menampilkan draft terbaru dan waktu terakhir diedit. Actions: Continue
Editing, Preview, Duplicate, Delete.

### Latest Comments

Menampilkan author, excerpt, artikel, waktu, status. Actions: Approve,
Reply, Spam, Trash, View Article.

### Needs Attention

Muncul hanya bila ada pekerjaan: - komentar pending - artikel scheduled
hari ini - broken links - high-traffic article yang sudah lama tidak
diperbarui

## 6. Posts Management

Route: `/admin/posts`

Header: `Posts  [ + New Post ]`

Filter: `All | Published | Drafts | Scheduled | Review | Archived`

Tambahan: - Search - Category - Author - Date - Bulk Actions

Table:
`Title | Author | Category | Status | SEO | Updated | Published | Views | Actions`

SEO indicator menggunakan status seperti `Good / Needs Work / Missing`,
bukan skor arbitrer.

## 7. Post Editor

Layar terpenting dalam admin.

``` text
┌─────────────────────────────────┬──────────────────────┐
│ EDITOR                          │ POST SETTINGS        │
│ Title                           │ Status               │
│ Slug                            │ Publish Date         │
│ Excerpt                         │ Category             │
│ Content                         │ Tags                 │
│                                 │ Featured Image       │
│                                 │ Author               │
│                                 │ Preview / Publish    │
└─────────────────────────────────┴──────────────────────┘
```

Field inti: - Title - Slug - Excerpt / Deck - Content - Featured Image -
Image Alt - Category - Tags - Author - Status - Publish Date

Advanced: - Canonical URL - Custom OG image - Noindex -
Affiliate/Sponsored disclosure - Featured Story - Trending

## 8. Content Blocks

Core: - Paragraph - H2/H3 - Image - Gallery - List - Quote - Table -
Button - Embed - Code - Divider

StackYup-specific: - Key Takeaways - Pro Tip - Pros & Cons - Tool Card -
Pricing Table - Comparison Table - FAQ - Affiliate CTA - Advertisement
Placeholder - Related Articles

Block harus dirender konsisten dengan desain artikel publik.

## 9. Table of Contents Otomatis

ToC dibuat dari H2, dengan H3 opsional.

Admin menampilkan preview: `1. ChatGPT` `2. Perplexity` `3. Descript`

Anchor ID dibuat otomatis tetapi bisa diedit. Jangan membuat ToC manual
terpisah dari heading artikel.

## 10. SEO Panel

Post editor memiliki Search Preview serta: - SEO Title - Meta
Description - Canonical URL - Index/Noindex - Follow/Nofollow

Validasi actionable: - missing meta description - missing image alt -
duplicate slug/title - broken internal links - missing canonical -
heading hierarchy problem

Hindari skor SEO semu jika tidak ada metodologi jelas.

## 11. Social Preview

Preview kartu sosial: - OG Title - OG Description - OG Image

Default mengikuti field SEO/artikel kecuali di-override.

## 12. Categories

Fitur: - Create/Edit/Delete - Slug - Description - Category image - SEO
title - Meta description - Parent category

Table: `Name | Slug | Article Count | Updated`

Peringatkan sebelum menghapus kategori yang masih dipakai artikel.

## 13. Tags

Fitur: - Create - Rename - Merge - Delete

Sediakan **Merge duplicate tags** untuk mencegah thin archive pages.

## 14. Media Library

Grid/list view.

Fitur: - Upload - Search/filter - Copy URL - Edit alt - Edit caption -
Replace - Delete

Detail:
`Filename | Dimensions | File size | Format | Alt | Caption | Uploaded by | Used in X posts`

Opsional: WebP/AVIF generation dan compression.

## 15. Pages

Kelola static pages: - About - Contact - Privacy - Terms - Editorial
Policy - Affiliate Disclosure

Gunakan editor yang sama, tetapi sembunyikan article-specific settings
yang tidak relevan.

## 16. Comments

Tabs: `All | Pending | Approved | Spam | Trash`

Actions: `Approve | Reply | Edit | Spam | Trash | View Article`

Filter berdasarkan article, date, status.

## 17. Site Settings

Kelompok: - General - Homepage - Publishing - Branding - Social -
Integrations

General: Site Name, URL, Description, Language, Timezone, Date Format.

Homepage: Top Stories source, jumlah Latest Articles, featured
categories, Most Read period.

Branding: Logo, Favicon, Default OG image, Brand color.

## 18. Navigation

Visual menu manager: `≡ For You` `≡ AI Tools` `≡ Comparisons`
`≡ Freelancers` `≡ Reviews` `≡ Tech` `≡ Productivity`

Fitur: drag reorder, add category/page/custom link, nesting, remove.

Kelola Header dan Footer secara terpisah.

## 19. Theme

Batasi agar editor tidak merusak design system.

Boleh mengatur: - Logo - Accent color - Default light/dark - Article
width preset - Sidebar ads on/off

Tidak perlu full page builder kecuali benar-benar dibutuhkan.

## 20. Newsletter & Subscribers

Dashboard: - total subscribers - new this month - unsubscribed

Subscriber manager: Search, Export, Import, Status, Source, Signup Date.

Jika pengiriman email menggunakan provider eksternal, cukup tampilkan
status integrasi.

## 21. Analytics

Tabs: `Overview | Content | Acquisition | Engagement | Search`

Overview: Page Views, Visitors, Sessions, Engagement, Top Content,
Traffic Sources, Devices, Countries.

Content:
`Article | Views | Visitors | Avg Engagement | Comments | Newsletter Conversions | Affiliate Clicks`

Acquisition: Organic Search, Direct, Referral, Social, Email.

## 22. Advertisements

Route: `/admin/advertisements`

Placements: - Article Sidebar Top - Article Sidebar Sticky - Article
In-Content - Article Bottom - Homepage Sidebar - Category Sidebar

Setiap placement: - Enabled - Provider - Ad Unit ID/code -
Desktop/mobile - Reserved size - Start/end date

Sediakan visual placement preview.

Public site harus reserve ukuran slot sebelum ad load untuk menghindari
CLS.

## 23. Affiliate Links

Central link manager:
`Tool/Brand | Destination | Affiliate URL | Disclosure | Clicks | Status | Last Checked`

Manfaat: - update URL global - broken-link detection - click tracking -
reusable insertion di editor

## 24. SEO Overview

Dashboard: - Missing Meta Descriptions - Broken Internal Links - Missing
Alt Text - Duplicate Titles - Noindex Warnings

Kelompok:
`Indexing | Metadata | Internal Links | Images | Structured Data | Redirects | Sitemap`

Fokus pada issue yang bisa ditindaklanjuti.

## 25. Sitemap

Fitur: - Status - Regenerate - Include/exclude content type - Last
generated - URL count

Groups: Posts, Pages, Categories, Authors.

## 26. Redirects

Table: `FROM | TO | TYPE`

Fitur: Create, Edit, Delete, Import, Detect redirect chains.

Saat slug published article berubah, tampilkan:
`Create 301 redirect from old URL?` Default: enabled.

## 27. Broken Links

Table: `Broken URL | Found On | Link Type | Status | Last Checked`

Actions: Edit Article, Replace URL, Remove Link, Recheck.

## 28. Users & Roles

Roles: - Administrator - Editor - Author

Administrator: full access.

Editor: content, media, categories/tags, comments, SEO content fields,
analytics read.

Author: create/edit own posts, upload media, submit for review.

## 29. Editorial Workflow

Status:
`Draft → In Review → Scheduled → Published → Needs Update → Archived`

Dashboard harus menampilkan: - waiting for review - scheduled - stale
high-traffic content - abandoned drafts

## 30. Content Freshness

Simpan: - Published Date - Last Modified - Last Reviewed - Next Review
Date

Widget: `CONTENT TO UPDATE`

Sangat penting untuk StackYup karena artikel AI/tools cepat usang.

## 31. Backups

Tampilkan: Last Backup, Status, Database Size, Media Size.

Actions bila didukung: Create Backup, Download, Restore, Retention.

Restore wajib confirmation.

## 32. System Settings

-   Caching
-   Image Optimization
-   Analytics Integration
-   Email Provider
-   Comment Settings
-   API/Integrations
-   Maintenance Mode

Secret/API key harus masked.

## 33. Autosave & Revisions

Editor autosave dengan indikator: `Saved 12 seconds ago`

Revision history: - timestamp - editor - Preview - Compare - Restore

## 34. Publishing Controls

Panel: `Status | Visibility | Publish Time | Author`

Buttons: `Save Draft | Preview | Publish`

Scheduling: date, time, timezone.

Setelah publish: `View Article | Copy URL | Share`

## 35. Responsive Admin

Desktop adalah pengalaman utama.

Tablet: - collapsible sidebar - workspace melebar - tables scroll hanya
bila perlu

Mobile: - hamburger - search - quick actions - stacked KPI - simplified
tables

Complex article editing tetap dioptimalkan untuk desktop.

## 36. Accessibility & Safety

-   keyboard navigation
-   visible focus
-   semantic forms
-   input labels
-   aria-label icon buttons
-   adequate contrast
-   accessible dialogs
-   status tidak hanya dibedakan dengan warna

Confirmation wajib untuk: Delete Post/Media/Category/User, Restore
Backup, Bulk Delete, perubahan URL published tanpa redirect.

## 37. Prioritas Implementasi

### MVP

Dashboard, Posts, Post Editor, Categories, Tags, Media, Pages, Comments,
Site Settings, Navigation, SEO fields, Users.

### Phase 2

Analytics, Newsletter, Advertisements, Affiliate Links, Redirects,
Sitemap, Broken Links, Content Freshness, Revisions.

### Optional

AI writing, internal-link suggestions, advanced recommendations,
affiliate reporting, advanced editorial workflow.

## 38. Prinsip Akhir

StackYup Admin harus terasa sebagai **editorial workspace**, bukan
generic analytics dashboard.

Prioritas:
`CONTENT → EDITORIAL WORKFLOW → SEO → AUDIENCE → MONETIZATION → SYSTEM`

Dashboard harus memprioritaskan informasi yang menghasilkan tindakan,
bukan vanity metrics.
