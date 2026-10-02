# StackYup --- Single Article Layout Specification

**Reference:** supplied three-column article mockup\
**Target:** reproduce the reference as closely as possible on desktop
while remaining responsive\
**Page type:** long-form article / review / comparison / roundup\
**Visual direction:** clean editorial publication, white canvas, green
accent, subtle borders, minimal shadows

------------------------------------------------------------------------

## 1. Non-Negotiable Layout

The desktop page uses **three columns** below the global header:

``` text
┌──────────────────────────────────────────────────────────────────────────┐
│ GLOBAL HEADER                                                            │
├────────────────┬────────────────────────────────────┬────────────────────┤
│ LEFT SIDEBAR   │ MAIN ARTICLE                       │ RIGHT SIDEBAR      │
│ 260–285px      │ 650–720px                          │ 285–320px          │
│                │                                    │                    │
│ TOC            │ Breadcrumb                         │ Advertisement      │
│ Quick Jump     │ Tags                               │ Recommended        │
│ Related        │ H1 + deck                          │ Newsletter         │
│                │ Author/meta                        │                    │
│                │ Hero image                         │                    │
│                │ Key Takeaways                      │                    │
│                │ Article body                       │                    │
└────────────────┴────────────────────────────────────┴────────────────────┘
```

Use a centered page shell:

``` css
.article-shell {
  width: min(1420px, calc(100% - 48px));
  margin-inline: auto;
  display: grid;
  grid-template-columns: 270px minmax(0, 700px) 310px;
  gap: 36px;
  align-items: start;
}
```

If the viewport cannot support this exact width, reduce gaps before
shrinking the reading column.

**Priority order:** 1. Preserve readable main article width. 2. Reduce
gaps. 3. Slightly reduce sidebars. 4. Collapse left sidebar at tablet
width. 5. Never squeeze the article into a narrow column just to keep
both sidebars.

------------------------------------------------------------------------

# 2. Global Tokens

## Colors

``` css
:root {
  --bg: #ffffff;
  --surface: #ffffff;
  --surface-soft: #f8faf9;
  --surface-green: #f1fbf6;

  --text: #101313;
  --text-secondary: #667085;
  --text-muted: #8a9099;

  --border: #e6ebe8;
  --border-strong: #dce3df;

  --green: #079653;
  --green-dark: #057842;
  --green-soft: #e9f8f0;
  --green-ultra-soft: #f4fbf7;

  --yellow: #f6b800;
}
```

## Radius

``` css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;
--radius-pill: 999px;
```

## Shadow

The reference is border-driven, not shadow-driven.

``` css
--shadow-card: 0 1px 2px rgba(16, 24, 20, .025);
```

Do **not** use strong SaaS-style floating shadows.

------------------------------------------------------------------------

# 3. Typography

Recommended font:

``` css
font-family: Inter, Geist, system-ui, -apple-system, BlinkMacSystemFont,
             "Segoe UI", sans-serif;
```

## Article typography

``` css
.article-title {
  font-size: clamp(40px, 3.1vw, 54px);
  line-height: 1.04;
  letter-spacing: -0.035em;
  font-weight: 750;
}

.article-deck {
  font-size: 19px;
  line-height: 1.5;
  color: var(--text-secondary);
}

.article-body {
  font-size: 17px;
  line-height: 1.68;
  color: #596579;
}

.article-body h2 {
  font-size: 29px;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--text);
  font-weight: 750;
}
```

The main article body must remain comfortable for long reading. Do not
use 14--15px body text.

------------------------------------------------------------------------

# 4. Global Header

Reference structure:

``` text
StackYup.     For you  AI Tools  Comparisons  Freelancers  Reviews  Tech  Productivity

                                               [ Search articles... ]  ☼  RSS
```

## Dimensions

``` text
height: 64px
background: white
bottom border: 1px solid #E6EBE8
```

Container:

``` css
.header-inner {
  width: min(1420px, calc(100% - 48px));
  margin-inline: auto;
}
```

Logo:

``` text
~30–32px
font-weight: 750–800
black
green period
```

Navigation:

``` text
14–15px
medium weight
32–36px horizontal spacing
```

Search:

``` text
width: 280–320px
height: 38–40px
soft gray background
pill-ish 9–12px radius
```

Keep header visually quiet.

------------------------------------------------------------------------

# 5. Left Sidebar

The left sidebar exists to help the user **navigate the article**.

It must not compete with the article.

Recommended:

``` css
.left-sidebar {
  position: sticky;
  top: 88px;
  max-height: calc(100vh - 110px);
  overflow-y: auto;
}
```

The entire left area can be one bordered panel or visually grouped
sections with dividers.

Reference card:

``` css
border: 1px solid var(--border);
border-radius: 12px;
background: #fff;
padding: 18px 18px 20px;
```

------------------------------------------------------------------------

# 6. Table of Contents

Header:

``` text
☷  Table of Contents                              ^
```

Typography:

``` text
16–17px
font-weight: 700
```

Each item:

``` text
number + title
13.5–14.5px
line-height: 1.45
```

Vertical spacing:

``` text
10–14px between entries
```

## Active item

Reference active state:

``` text
green vertical line on extreme left
very pale green row background
green number
green title
```

Example:

``` css
.toc-item.active {
  color: var(--green-dark);
  background: var(--green-ultra-soft);
  font-weight: 600;
}

.toc-item.active::before {
  content: "";
  position: absolute;
  left: -19px;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--green);
}
```

The active state should update through IntersectionObserver as the
reader moves through sections.

Each TOC link must be a real anchor:

``` html
<a href="#chatgpt">ChatGPT – The All-Round Assistant</a>
```

and target:

``` html
<h2 id="chatgpt">1. ChatGPT – The All-Round Assistant</h2>
```

------------------------------------------------------------------------

# 7. Quick Jump / "On This Page"

After the main TOC:

``` text
────────────────────

On This Page

▣ Key Takeaways
◷ Best Use Cases
$ Pricing
▾ Pros & Cons
⌁ Alternatives
```

Use this only if these blocks actually exist in the article.

Purpose:

-   TOC = major article sections/tools.
-   Quick Jump = recurring editorial components.

Do not duplicate identical links from TOC.

Style:

``` text
icon: 17px muted navy/gray
label: 14px
row height: 34–38px
```

------------------------------------------------------------------------

# 8. Left Related Articles

Place below another divider.

Header:

``` text
▣ Related Articles                         View all →
```

Show maximum **3 articles**.

Each item:

``` text
[80×58 thumbnail] CATEGORY
                  Short article title...
                  Sep 28, 2026
```

Rules:

-   compact
-   no card inside card
-   title 13--14px / semibold
-   category uppercase 10--11px green
-   metadata 11--12px muted
-   thumbnail radius 6--8px

The left sidebar must still feel primarily navigational.

------------------------------------------------------------------------

# 9. Main Article Header

Main column begins with breadcrumb:

``` text
⌂  ›  AI Tools  ›  7 Best AI Tools for Freelancers in 2026
```

Style:

``` text
12–13px
muted gray
green link hover
```

Spacing after breadcrumb:

``` text
20–24px
```

------------------------------------------------------------------------

# 10. Category Pills

Directly above H1:

``` text
[ AI Tools ] [ Freelancers ] [ Reviews ]
```

Primary category:

``` text
green background
white text
```

Secondary:

``` text
#F2F4F5 background
gray text
```

Dimensions:

``` text
height: 30–32px
padding-inline: 14px
font-size: 12–13px
radius: 999px
```

Do not show more than 3--4 pills above the title.

------------------------------------------------------------------------

# 11. Article H1

Reference:

``` text
7 Best AI Tools for Freelancers
in 2026
```

The line break should happen naturally based on width.

Desktop main column:

``` text
650–720px
```

H1:

``` text
48–54px on large desktop
40–46px around 1280px viewport
font-weight 750
black
tight tracking
```

Spacing:

``` text
tags → H1: 18px
H1 → deck: 14–18px
```

------------------------------------------------------------------------

# 12. Article Deck

Example:

``` text
An in-depth breakdown of the 7 essential AI tools every solo freelancer and
consultant needs to automate non-billable hours in 2026, with real use cases
and practical tips.
```

Width:

``` text
100% main column
```

Use:

``` text
18–20px
#667085
line-height 1.48–1.55
```

Do not bold keywords here.

------------------------------------------------------------------------

# 13. Author & Metadata Row

Reference layout:

``` text
[A] Adit • Follow                    📅 Oct 1, 2026  ◷ 3 min read  ◉55  ◯3  ♧  share
    Founder & Tech Researcher
```

Use a flex row with author left and article metadata right.

Avatar:

``` text
44×44px
black circle
white A
```

Author:

``` text
name: 14px / 650
role: 12px muted
Follow: green
```

Metadata:

``` text
12–13px
muted gray
icons 15–17px
gap 14–18px
```

On narrower widths, metadata may wrap below author.

------------------------------------------------------------------------

# 14. Hero Image

Hero follows metadata with approximately:

``` text
24px top spacing
```

Image:

``` css
width: 100%;
aspect-ratio: 16 / 9;
object-fit: cover;
border-radius: 10px;
display: block;
```

Do not use an exaggerated card wrapper around it.

Caption:

``` text
A modern workspace with essential AI tools for freelancers in 2026
```

Style:

``` text
12px
italic
center
#8A9099
margin-top: 8px
```

------------------------------------------------------------------------

# 15. Key Takeaways

Place immediately below the hero/caption.

Reference:

``` text
┌───────────────────────────────────────────┐
│ 💡  Key Takeaways                        │
│                                           │
│     ✓ 7 AI tools that actually...        │
│     ✓ Real use cases...                  │
│     ✓ Tips to integrate...               │
│     ✓ A practical comparison...          │
└───────────────────────────────────────────┘
```

Dimensions:

``` text
padding: 20–24px
margin-top: 24px
border-radius: 10–12px
```

Colors:

``` text
background: #F1FBF6
border: #D8F0E3
```

Title:

``` text
17px / 700
dark green
```

Icon badge:

``` text
36–40px square
soft green
```

List:

``` text
14–15px
line-height 1.65
green check icons
```

------------------------------------------------------------------------

# 16. Intro Paragraph

After Key Takeaways:

``` text
margin-top: 24–28px
```

Body:

``` text
17px
line-height 1.65–1.75
color #596579
```

Avoid card backgrounds for normal prose.

------------------------------------------------------------------------

# 17. Article H2

Reference:

``` text
│ 1. ChatGPT – The All-Round Assistant
```

Use a thin green vertical marker.

``` css
.article-section-title {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.article-section-title::before {
  content: "";
  width: 4px;
  min-height: 32px;
  border-radius: 999px;
  background: var(--green);
}
```

Add a subtle top divider before major sections when appropriate.

------------------------------------------------------------------------

# 18. Right Sidebar

Right sidebar exists for **monetization and discovery**, not article
navigation.

Desktop:

``` css
.right-sidebar {
  position: relative;
}
```

Individual modules may become sticky, but do not make the entire long
rail sticky.

Recommended order:

``` text
1. Advertisement
2. Recommended / Related Reading
3. Newsletter
4. Optional second ad farther down
```

------------------------------------------------------------------------

# 19. Advertisement Module

Reference top card:

``` text
ADVERTISEMENT

┌──────────────────────────────┐
│                              │
│        AD CREATIVE           │
│        ~300 × 250            │
│                              │
└──────────────────────────────┘
```

Outer container:

``` text
border: 1px solid #E6EBE8
border-radius: 12px
padding: 14px
```

Advertisement label:

``` text
10px
uppercase
letter-spacing: .08em
center
muted gray
margin-bottom: 10px
```

Reserve the ad dimensions before loading the network ad to avoid CLS.

Do not disguise ads as editorial cards.

------------------------------------------------------------------------

# 20. Recommended for You

Reference:

``` text
★ Recommended for You

[thumb] COMPARISONS
        ChatGPT vs Claude vs Gemini:
        Which One Should Freelancers Use?
        Sep 28, 2026 • 120 views

[thumb] PRODUCTIVITY
        How to Automate Repetitive Tasks...
        Sep 15, 2026 • 87 views
```

Card:

``` text
border 1px
radius 12px
padding 16–18px
```

Header:

``` text
yellow outlined/star icon
17px / 700
```

Article item:

``` text
thumbnail: 92×66px
gap: 12px
```

Category:

``` text
10–11px uppercase
green
600–700 weight
```

Title:

``` text
13.5–14.5px
font-weight: 650
line-height: 1.35
```

Metadata:

``` text
11–12px muted
```

Show 3--4 items maximum.

If there is no personalization engine, label this section **Related
Reading** instead of implying personalization.

------------------------------------------------------------------------

# 21. Newsletter Module

Reference:

``` text
✉ Get the Latest Insights

Join 5,000+ freelancers and creators who get
weekly reviews, comparisons, and tips.

[ Your email address ] [ Subscribe ]

No spam. Unsubscribe anytime.
```

Use pale green background:

``` text
#F5FCF8
```

Container:

``` text
border 1px solid #DDECE4
radius 12px
padding 18px
```

Heading:

``` text
17px / 700
```

Description:

``` text
13–14px
line-height 1.5
```

Input/button on desktop may share one row.

Input:

``` text
height 42px
border #E1E6E3
radius 7–8px
```

Button:

``` text
height 42px
green
white
font-weight 650
```

Only use "5,000+" if it is a real figure.

------------------------------------------------------------------------

# 22. Author Profile Placement

Do **not** place a large author card in either top sidebar.

The article header already contains compact author information.

Place the expanded author biography after the article body:

``` text
ABOUT THE AUTHOR

[A] Adit
Founder & Tech Researcher

Short bio...
[Follow]
```

This frees the sidebars for more useful reading/discovery functions.

------------------------------------------------------------------------

# 23. Article Ending

After the conclusion:

``` text
Article conclusion

Share controls

Author box

Related Articles
3 cards

Newsletter CTA

Optional advertisement

Footer
```

Do not abruptly stop after the last H2.

------------------------------------------------------------------------

# 24. Desktop Spacing

Recommended vertical rhythm:

``` text
breadcrumb → tags       18px
tags → H1               18px
H1 → deck               14px
deck → metadata         22px
metadata → hero         24px
hero → caption           8px
caption → takeaway      24px
takeaway → paragraph    26px
paragraph → H2          34–42px
H2 → paragraph          10–14px
section → section       42–52px
```

Column gaps:

``` text
left ↔ article: 34–38px
article ↔ right: 34–38px
```

------------------------------------------------------------------------

# 25. Responsive Behavior

## \>= 1280px

Use full three-column layout:

``` text
Left / Article / Right
```

## 1024--1279px

Collapse the left sidebar.

Layout:

``` text
Article / Right Sidebar
```

Move TOC into the article after Key Takeaways as a collapsible block.

Suggested grid:

``` css
grid-template-columns: minmax(0, 720px) 290px;
```

## 768--1023px

Single article column is preferred.

Right-sidebar recommendation/newsletter modules move after article
content.

Ads may use responsive in-content positions if supported.

## \< 768px

Order:

``` text
Header
Breadcrumb
Tags
H1
Deck
Author
Metadata
Hero
Caption
Key Takeaways
Collapsible TOC
Article body
Related Reading
Newsletter
Ad
Author box
Footer
```

Mobile padding:

``` text
16–20px
```

Mobile H1:

``` text
34–40px
```

Mobile body:

``` text
17px
```

------------------------------------------------------------------------

# 26. Mobile TOC

Desktop left TOC becomes:

``` text
┌──────────────────────────────┐
│ ☷ Table of Contents      ↓  │
└──────────────────────────────┘
```

Expanded:

``` text
1. ChatGPT
2. Perplexity
3. Descript
...
```

Place after Key Takeaways.

Do not duplicate two crawlable TOCs unnecessarily. Reuse the same
data/component and render appropriately per breakpoint.

------------------------------------------------------------------------

# 27. Semantic HTML

Recommended page structure:

``` html
<header>...</header>

<main class="article-shell">

  <aside class="left-sidebar">
    <nav aria-label="Table of contents">...</nav>
  </aside>

  <article>
    <nav aria-label="Breadcrumb">...</nav>

    <header>
      <div class="categories">...</div>
      <h1>...</h1>
      <p class="article-deck">...</p>
      <div class="article-meta">...</div>
    </header>

    <figure>...</figure>

    <section class="key-takeaways">...</section>

    <div class="article-body">
      ...
    </div>
  </article>

  <aside class="right-sidebar">
    ...
  </aside>

</main>

<footer>...</footer>
```

------------------------------------------------------------------------

# 28. SEO Requirements

Article page must include:

-   exactly one H1
-   logical H2/H3 hierarchy
-   crawlable breadcrumb links
-   canonical URL
-   meta title
-   meta description
-   Open Graph tags
-   Twitter/X card metadata
-   `BlogPosting` or `Article` structured data
-   `BreadcrumbList` structured data
-   author data
-   `datePublished`
-   `dateModified`
-   meaningful image alt text
-   internal links in Related Reading
-   real anchor links in TOC

Do not create heading elements purely for visual styling.

------------------------------------------------------------------------

# 29. Performance Requirements

Hero image:

``` text
WebP/AVIF
responsive srcset
explicit width/height
do not lazy-load if it is LCP
```

Below-fold images:

``` text
loading="lazy"
```

Ads:

-   reserve slot dimensions
-   load asynchronously
-   avoid unexpected content shifts
-   do not block initial article rendering

Target:

``` text
LCP < 2.5s
CLS < 0.1
INP < 200ms
```

------------------------------------------------------------------------

# 30. Visual Fidelity Checklist

Before considering the implementation complete, verify:

-   [ ] Header height and spacing match the reference.
-   [ ] Page is centered and does not feel stretched.
-   [ ] Three desktop columns are clearly visible.
-   [ ] Main article remains the dominant visual column.
-   [ ] Left sidebar is narrower than the article.
-   [ ] Right sidebar is approximately 300px.
-   [ ] TOC active row uses pale green + left green indicator.
-   [ ] H1 is large, tight, and black.
-   [ ] Deck is visibly lighter than H1.
-   [ ] Author and metadata sit on one compact row on wide screens.
-   [ ] Hero image fills article width.
-   [ ] Caption is small, centered, and muted.
-   [ ] Key Takeaways uses pale green rather than saturated green.
-   [ ] Article paragraphs are 17--18px and comfortable.
-   [ ] H2 uses a thin green vertical accent.
-   [ ] Ad is clearly labeled "ADVERTISEMENT".
-   [ ] Recommended items are compact media rows, not large cards.
-   [ ] Newsletter uses a subtle green surface.
-   [ ] Borders are light and shadows nearly invisible.
-   [ ] There are no unnecessary gradients.
-   [ ] There are no oversized rounded SaaS cards.
-   [ ] Left sidebar collapses before the article becomes too narrow.
-   [ ] Mobile TOC appears inside the article flow.
-   [ ] Expanded author information appears after the article, not in
    the top sidebar.

------------------------------------------------------------------------

# 31. Final Implementation Rule

When reproducing the reference, prioritize this hierarchy:

``` text
READABILITY
    ↓
ARTICLE NAVIGATION
    ↓
EDITORIAL DISCOVERY
    ↓
MONETIZATION
    ↓
DECORATION
```

The layout should feel like a **modern editorial technology
publication**, not an admin dashboard or SaaS landing page.

The center column is always the primary experience.

**Left = navigate the current article.**\
**Center = read the article.**\
**Right = ads, related discovery, newsletter.**
