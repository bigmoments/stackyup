# StackYup — Design System & Page Specification

> Scope: Homepage + Single Article Page  
> Style: clean editorial tech blog, modern, SEO-friendly, content-first  
> Primary accent: green  
> Goal: make StackYup feel like a credible publication rather than a generic SaaS landing page.

---

# 1. Global Design Direction

## Brand Feel

StackYup should feel:

- Editorial and trustworthy
- Modern but not overly “SaaS”
- Minimal without excessive empty space
- Content-first
- Easy to scan
- Comfortable for long-form reading
- Strong enough visually to support AI tools, SaaS, productivity, freelancer, comparison, and review content

Avoid:

- Excessive gradients
- Glassmorphism
- Oversized cards everywhere
- Heavy shadows
- Excessive pill/badge usage
- Decorative UI that competes with article content
- “AI slop” illustrations
- Large unused whitespace
- Turning every section into a boxed card

---

# 2. Global Layout

## Desktop Container

```css
--page-max-width: 1440px;
--content-max-width: 1200px;
--article-max-width: 820px;
--page-padding: 24px;
```

Main content should normally sit inside:

```css
width: min(1200px, calc(100% - 48px));
margin-inline: auto;
```

Article reading column:

```css
max-width: 820px;
```

## Breakpoints

```text
Desktop Large : >= 1280px
Desktop       : 1024–1279px
Tablet        : 768–1023px
Mobile        : < 768px
```

---

# 3. Color System

## Base

```text
Background          #FFFFFF
Secondary Background #F8FAF9
Primary Text        #101313
Secondary Text      #667085
Muted Text          #8A9099
Border              #E8ECE9
```

## Brand Green

```text
Primary Green       #078A4B
Dark Green          #066A3D
Soft Green          #EAF8F0
Very Soft Green     #F4FBF7
```

Green should be used mainly for:

- Active navigation
- Links
- Selected category
- Small icons
- Section accent
- CTA
- Important callout elements

Do not make large portions of the interface bright green.

---

# 4. Typography

Use a clean sans-serif family for the UI and article body.

Recommended:

```text
Inter
Geist
Manrope
DM Sans
```

Stack:

```css
font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

## Scale

```text
Hero H1 / Article H1
Desktop: 48–56px
Mobile: 36–40px
Weight: 700–750
Line-height: 1.05–1.12

Section H2
28–32px
Weight: 700

Article H2
28–32px
Weight: 700
Line-height: 1.2

Article H3
22–24px
Weight: 650–700

Card title
18–21px
Weight: 650–700

Body
16–18px
Line-height: 1.65–1.75

Metadata
13–14px
```

Long article text should never feel compressed.

---

# 5. Global Header

Desktop header:

```text
[StackYup.] [For you] [AI Tools] [Comparisons] [Freelancers]
           [Reviews] [Tech] [Productivity]

                         [ Search articles, tools, or topics... ] [theme]
```

## Rules

- Height: approximately 64px
- White background
- 1px bottom border
- Sticky header is allowed
- Logo stays visually dominant but compact
- Current navigation item uses green underline
- Search field positioned on right
- Avoid a second navigation bar below the header

## Mobile

```text
[StackYup.]             [Search] [Menu]
```

Navigation opens as drawer/dropdown.

---

# 6. Homepage

## Purpose

The homepage must immediately answer:

1. What is StackYup?
2. What topics does it cover?
3. Who is it useful for?
4. What should the visitor read next?

---

## 6.1 Homepage Structure

```text
HEADER

HERO
├── label
├── H1
├── description
├── CTA
└── editorial image

FEATURED ARTICLE

LATEST ARTICLES
├── article card
├── article card
├── article card
└── article card

SIDEBAR
├── Newsletter
├── Recommended Topics
├── Popular Articles
└── About Author / Publisher

FOOTER
```

Desktop may use:

```text
MAIN CONTENT 74–76%
SIDEBAR     24–26%
```

---

# 7. Homepage Hero

Recommended content:

```text
Latest Insights

Discover the Best
AI Tools for Freelancers
and Modern Creators

In-depth reviews, comparisons, and practical guides
to help you work smarter, faster, and grow your
freelance career.

[ Browse All Articles → ]
```

## Layout

Desktop:

```text
┌──────────────────────────────────────────────┐
│ TEXT                        EDITORIAL IMAGE  │
│                                              │
│ H1                                           │
│ Description                                  │
│ CTA                         floating labels  │
└──────────────────────────────────────────────┘
```

Suggested height:

```text
360–420px
```

Hero should not consume the entire first viewport.

## SEO Rule

H1 must be real HTML text.

Never bake the H1 into the hero image.

Exactly one H1 should exist on the homepage.

---

# 8. Featured Article

Immediately below hero.

```text
Featured Article                              View all →

┌───────────────┬────────────────────────────────────┐
│               │ Author • Date • Featured          │
│    IMAGE      │                                    │
│               │ ARTICLE TITLE                      │
│               │ Short excerpt...                   │
│               │                                    │
│               │ [AI Tools] [Productivity] [...]    │
└───────────────┴────────────────────────────────────┘
```

Desktop image:

```text
35–40% width
```

Content:

```text
60–65%
```

Do not over-style the featured article.

The title is the visual priority.

---

# 9. Latest Articles

Desktop:

```text
4-column grid
```

Medium:

```text
2-column grid
```

Mobile:

```text
1-column
```

Article card anatomy:

```text
IMAGE

Author • Date

ARTICLE TITLE

Short excerpt of approximately
2–3 lines.

[Topic] [Topic]

Views / Comments                       →
```

## Card Rules

- Border: 1px subtle gray
- Radius: 10–14px
- Shadow: none or extremely subtle
- Image aspect ratio: approximately 16:9
- Do not make cards excessively tall
- Title should normally be limited to ~3 lines
- Excerpt 2–3 lines

---

# 10. Homepage Sidebar

Desktop sidebar contains four modules.

## Newsletter

```text
Stay Updated

Get the latest reviews, tools and productivity
tips straight to your inbox.

[ Enter your email             ]

[ Subscribe ]
```

Soft green background is allowed.

---

## Recommended Topics

Example:

```text
AI Tools
Comparisons
Freelancers
Reviews
ChatGPT
Productivity
SaaS
Automation
Content Creation
Remote Work
Tech
Guides
```

Topic pills should remain subtle.

---

## Popular Articles

Use an ordered list:

```text
1  Thumbnail  Article title
              Date • Views

2  Thumbnail  Article title
              Date • Views
```

This is preferable to a large card grid in the sidebar.

---

# 11. Single Article Page

## Core Principle

The single page is a **reading interface**, not a landing page.

Do not place unnecessary UI beside every paragraph.

Primary article content should visually dominate the page.

---

# 12. Article Page Structure

Recommended structure:

```text
HEADER

BREADCRUMB

CATEGORY / TAGS

H1

DECK / ARTICLE DESCRIPTION

AUTHOR + DATE + READING TIME + ENGAGEMENT

HERO IMAGE
IMAGE CAPTION

KEY TAKEAWAYS

TABLE OF CONTENTS

ARTICLE INTRODUCTION

H2 SECTION
CONTENT
OPTIONAL MEDIA
OPTIONAL CALLOUT

H2 SECTION
...

CONCLUSION

AUTHOR BOX

RELATED ARTICLES

NEWSLETTER

FOOTER
```

For this design, the Table of Contents is placed **inside the article flow**, not in the desktop sidebar.

---

# 13. Article Header

Example:

```text
Home › AI Tools › 7 Best AI Tools for Freelancers in 2026

[AI Tools] [Productivity] [Freelancers] [Automation]

7 Best AI Tools for Freelancers
in 2026

An in-depth breakdown of the 7 essential AI tools every
solo freelancer and consultant needs to automate
non-billable hours in 2026.

[A] Adit • Follow             Oct 1, 2026
Founder & Tech Researcher     2 min read

                             👁 55   ◯ 3   ♧
```

## Rules

Article H1:

```text
max-width: 800–900px
```

Deck:

```text
max-width: 760px
font-size: 19–21px
```

Metadata should be compact and visually secondary.

---

# 14. Hero Image

Recommended:

```text
aspect-ratio: 16 / 9
border-radius: 10–12px
```

Use full width of the article reading container.

Below image:

```text
A modern workspace with laptop, coffee, and clean coding setup
```

Caption:

```text
12–13px
center
muted
italic optional
```

SEO:

- meaningful `alt`
- explicit width/height
- responsive `srcset`
- WebP/AVIF where possible
- do not lazy-load the article LCP image

---

# 15. Key Takeaways

Placed after hero image.

Example:

```text
💡 Key Takeaways

✓ 7 AI tools that actually help freelancers work smarter
✓ Real use cases, strengths, and limitations
✓ Tips to integrate them into your workflow
✓ A practical comparison to help you choose the right tools
```

Style:

```text
background: very soft green
border: subtle green
radius: 10–12px
padding: 20–24px
```

This is a summary, not an advertisement.

---

# 16. Table of Contents

For StackYup, use an **inline Table of Contents** after Key Takeaways.

Desktop:

```text
┌────────────────────────────────────────────────────┐
│ ☷ Table of Contents                    Collapse ^ │
├──────────────────────────┬─────────────────────────┤
│ 1 ChatGPT                │ 5 Make.com              │
│ 2 Perplexity             │ 6 Pricing & Value       │
│ 3 Descript               │ 7 Final Verdict         │
│ 4 Notion AI              │                         │
└──────────────────────────┴─────────────────────────┘
```

Mobile:

```text
Table of Contents
[ Expand ↓ ]
```

or expanded one-column list.

## SEO / HTML

Use:

```html
<nav aria-label="Table of contents">
  <ol>
    <li><a href="#chatgpt">ChatGPT – The All-Round Assistant</a></li>
    <li><a href="#perplexity">Perplexity – Research...</a></li>
  </ol>
</nav>
```

Corresponding section:

```html
<h2 id="chatgpt">
  1. ChatGPT – The All-Round Assistant
</h2>
```

Use actual anchor links.

Do not implement ToC as JavaScript-only text.

---

# 17. Article Body

Ideal body width:

```text
720–820px
```

Paragraph:

```text
16–18px
line-height: 1.7
```

Paragraph spacing:

```text
margin-bottom: 18–24px
```

Avoid:

- text width > 900px
- tiny 14px article text
- excessive centered text
- putting every paragraph in a card

---

# 18. H2 Section Style

Example:

```text
│ 1. ChatGPT – The All-Round Assistant
```

Use a small green vertical accent before major H2 headings.

Example CSS direction:

```css
.article h2 {
  position: relative;
}

.article h2::before {
  content: "";
  width: 4px;
  border-radius: 999px;
  background: var(--green);
}
```

Do not use the accent on every H3.

---

# 19. Tool / Product Section

For tool review articles:

```text
1. ChatGPT – The All-Round Assistant

Intro paragraph...

┌──────────────────────┬─────────────────────────────┐
│                      │ Key Benefits                │
│      TOOL IMAGE      │ ✓ benefit                  │
│                      │ ✓ benefit                  │
│                      │ ✓ benefit                  │
│                      │                             │
│                      │ Best Use Cases              │
│                      │ [Writing] [Research] [...]  │
└──────────────────────┴─────────────────────────────┘
```

Do not force this layout on normal editorial articles.

It is a reusable content block for:

- AI tool reviews
- software comparisons
- product roundups
- SaaS lists

---

# 20. Pro Tip / Editorial Callout

Example:

```text
💡 Pro Tip

Use custom instructions and saved prompts to get more
consistent and relevant results for your freelance workflow.
```

Keep callouts visually calm.

Possible variants:

```text
Pro Tip       green
Important     amber
Warning       red
Note          neutral
```

Do not use more than necessary.

---

# 21. Article Ending

Recommended sequence:

```text
Final Verdict / Conclusion

Author Box

Related Articles

Newsletter CTA
```

Do not abruptly end after the final paragraph.

---

# 22. Related Articles

Desktop:

```text
3 cards
```

Mobile:

```text
horizontal scroll OR vertical cards
```

Prioritize semantically related content.

Example:

```text
ChatGPT vs Claude vs Gemini
10 Productivity Tools for Freelancers
Best AI Tools for Content Creators
```

This supports internal linking.

---

# 23. Footer

Keep footer simple.

Recommended:

```text
StackYup.

AI Tools
Comparisons
Freelancers
Reviews
Tech
Productivity

About
Editorial Policy
Contact
Privacy
Terms

© StackYup.
```

Optional newsletter may appear above footer.

---

# 24. Homepage SEO

Suggested title:

```text
StackYup — AI Tools, Reviews & Productivity Guides for Freelancers
```

Suggested description:

```text
Discover practical AI tool reviews, comparisons, automation tips,
and productivity guides for freelancers, creators, and independent
professionals.
```

Homepage schema where accurate:

```text
WebSite
Organization or Person
SearchAction
```

---

# 25. Article SEO

Example title:

```text
7 Best AI Tools for Freelancers in 2026 | StackYup
```

Description:

```text
Discover 7 practical AI tools freelancers can use for research,
writing, automation, content creation, and productivity in 2026.
```

Article schema:

```text
Article / BlogPosting
```

Recommended properties:

```text
headline
description
image
author
datePublished
dateModified
publisher
mainEntityOfPage
```

Breadcrumb schema:

```text
BreadcrumbList
```

---

# 26. Heading Hierarchy

Homepage:

```text
H1 Homepage positioning
  H2 Featured Article
  H2 Latest Articles
    H3 Article title
    H3 Article title
```

Single article:

```text
H1 Article title

H2 Main section
  H3 Subsection
  H3 Subsection

H2 Main section
```

Never use headings only to make text visually large.

---

# 27. Internal Linking

Every article should naturally link to:

- Relevant category
- Relevant topic pages
- Related articles
- Comparison content
- Supporting guides

Use descriptive anchor text.

Good:

```text
our comparison of ChatGPT and Claude
```

Avoid:

```text
click here
read more
this article
```

when more descriptive wording is possible.

---

# 28. Image SEO

Every content image should have:

```text
alt
width
height
srcset
sizes
```

Recommended formats:

```text
AVIF
WebP
```

Article card images:

```text
loading="lazy"
```

Hero/LCP image:

```text
loading="eager"
fetchpriority="high"
```

only when it is actually the LCP element.

---

# 29. Performance

Target:

```text
LCP < 2.5s
CLS < 0.1
INP < 200ms
```

Guidelines:

- Server-render article content
- Avoid client-only article feeds
- Limit third-party scripts
- Optimize images
- Reserve image dimensions
- Avoid loading large icon libraries
- Prefer SVG icons
- Lazy-load below-the-fold media
- Avoid unnecessary animation

---

# 30. Accessibility

Required:

- semantic `header`
- `nav`
- `main`
- `article`
- `aside` where appropriate
- `footer`
- visible focus state
- keyboard navigation
- sufficient contrast
- accessible search label
- accessible mobile menu
- icon-only buttons with `aria-label`
- descriptive image alt
- buttons for actions
- anchors for navigation

---

# 31. Mobile Homepage

Order:

```text
Header
Hero
Featured Article
Latest Articles
Popular Articles
Recommended Topics
Newsletter
Footer
```

Hero becomes one column.

Sidebar modules become normal sections.

---

# 32. Mobile Article

Order:

```text
Header
Breadcrumb
Tags
H1
Description
Author / metadata
Hero
Key Takeaways
Collapsible Table of Contents
Article body
Author box
Related articles
Newsletter
Footer
```

Recommended horizontal padding:

```text
16–20px
```

Article H1:

```text
36–40px
```

Body:

```text
17px
```

---

# 33. Component Radius

Use consistent radius tokens.

```text
Small      6px
Default   10px
Large     14px
Pill      999px
```

Do not randomly mix many radius values.

---

# 34. Spacing System

Recommended 4px base scale:

```text
4
8
12
16
20
24
32
40
48
64
80
```

Major section gap:

```text
48–64px
```

Card padding:

```text
18–24px
```

Article section gap:

```text
40–52px
```

---

# 35. Icons

Use one consistent icon family.

Recommended:

```text
Lucide
Phosphor
Heroicons
```

Default:

```text
stroke width: ~1.75–2
size: 16–20px
```

Do not mix filled, outlined, 3D, emoji, and unrelated icon styles in the same UI.

---

# 36. Implementation Priority

## Phase 1

Build:

1. Global header
2. Homepage hero
3. Featured article
4. Latest article cards
5. Homepage sidebar
6. Article header
7. Hero image
8. Key Takeaways
9. Inline ToC
10. Article typography

## Phase 2

Add:

1. Popular articles
2. Related articles
3. Author profile
4. Newsletter
5. Dynamic ToC
6. Active section tracking
7. Search
8. Dark mode if desired

---

# 37. Final Design Principle

StackYup should feel like:

> **a modern independent technology publication focused on useful AI tools and practical workflows.**

The design should support the content rather than compete with it.

Homepage = **discovery interface**

Single article = **reading interface**

SEO, readability, internal linking, performance, and content hierarchy take priority over decorative UI.
