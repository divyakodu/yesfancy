# Yes Fancy — Curated Fancy Gifts, Toys, Games & Novelties

Standalone single-store e-commerce storefront for **Yes Fancy** (`www.yesfancy.in`). Built with **Astro SSR**, **Tailwind CSS**, and backed by dedicated **Supabase Cloud Database & Storage**.

---

## 🏗️ Architecture Overview

- **Framework**: Astro 7.x Server-Side Rendering (`output: 'server'`) with `@astrojs/cloudflare` adapter.
- **Database**: Dedicated Supabase PostgreSQL project (`yesfancy-db` / ref `ebsrmjnegdhpnlbxcxfm`).
- **Storage**: Dedicated Supabase Storage bucket (`product-images`).
- **Routing**: Clean single-store paths (`/`, `/catalog`, `/product/[id]`, `/admin`). Zero multi-tenant query parameters.
- **Hosting**: Cloudflare Pages.

---

## 🚀 Development Quickstart

### Prerequisites
- Node.js >= 20
- npm >= 10

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (.env is preconfigured for yesfancy-db)
cp .env.example .env # if needed

# 3. Run automated quality gate tests
npm test

# 4. Launch local dev server
npm run dev
```

Visit [http://localhost:4321](http://localhost:4321) to view the live storefront.

---

## 🧪 Quality Gate Test Suites

Before any build or deployment, all test gates must pass:

```bash
# Run all quality gates
npm test

# Unit tests only (pricing math, cart calculations)
npm run test:unit

# Integration tests only (database connectivity, schema parity, API contracts)
npm run test:integration
```

---

## 🛠️ Build & Deployment

```bash
# Production build
npm run build

# Deploy to Cloudflare Pages
npm run deploy:pages
```

---

## 📦 Data & Schema Management

- `supabase/schema_yesfancy.sql`: Master PostgreSQL DDL for `products`, `categories`, `orders`, `hero_slides`, and `store_settings`.
- `scripts/03-verify-phase1.ts`: Automated data integrity verification suite.
