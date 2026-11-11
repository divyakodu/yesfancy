# CLAUDE.md — YesFancy Project Guidelines & Architecture

This repository is the standalone, single-store e-commerce codebase for **Yes Fancy** ([www.yesfancy.in](https://www.yesfancy.in)).

---

## 🏗️ 1. Architecture & Tech Stack

- **Framework**: Astro 7.x in Server-Side Rendering (`output: 'server'`) with `@astrojs/cloudflare` adapter.
- **Styling**: Tailwind CSS v4.
- **Database**: Dedicated Supabase PostgreSQL (`yesfancy-db` / ref: `ebsrmjnegdhpnlbxcxfm`).
- **Storage**: Supabase Storage bucket (`product-images`).
- **Hosting / Edge**: Cloudflare Pages.
  - Production project: `yesfancy` (domains: `www.yesfancy.in`, `yesfancy.pages.dev`).
  - Staging project: `yesfancy-staging` (`yesfancy-staging.pages.dev`).
- **Strict Boundary**: This project is 100% decoupled from `oorumart`. **NEVER** edit files in `~/Documents/oorumart` or touch the old production database (`fwrievuhudjkeffmszqf`).

---

## 🔑 2. Environment Variables & Credentials

The `.env` file at the root contains the required credentials for `yesfancy-db`:
```bash
PUBLIC_SUPABASE_URL=https://ebsrmjnegdhpnlbxcxfm.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVic3Jtam5lZ2RocG5sYnhjeGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MTY0MDAsImV4cCI6MjEwNzE5MjQwMH0.zP6UtvlbN3Hx8E2MbMcNk9fx4JUQpdCqrrvigytIN7M
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVic3Jtam5lZ2RocG5sYnhjeGZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTYxNjQwMCwiZXhwIjoyMTA3MTkyNDAwfQ.ZXgJA-bJMrFwQhR-l81fW9bYldzAr7XkgEBhUrm0Evo
```
- Cloudflare Pages secrets are synchronized via `npx wrangler pages secret bulk .env --project-name <project>`.

---

## 🧪 3. Quality Gate Test Suites (Mandatory Before Deploying)

Run the full test suite using Node.js native test runner:
```bash
npm test
```
The test suite consists of **4 Quality Gates** (all must pass 100%):
1. **Gate 1 (`tests/unit/pricing.test.ts`)**: Unit tests for discount math and rounding (`round(mrp * (1 - discount/100))`).
2. **Gate 2 (`tests/integration/store-config.test.ts`)**: Verifies `yesfancy-db` connection, 8 categories, and product integrity (valid price > 0, image, active/draft partitions).
3. **Gate 3 (`tests/integration/api-routes.test.ts`)**: Integration tests for API endpoints (`GET /api/orders`, `POST /api/orders`, `PATCH /api/orders`, `POST /api/products`, `DELETE /api/products`).
4. **Gate 4 (`tests/integration/storefront-ui.test.ts`)**: DOM contract tests verifying header `📦 Track Order` button, `#order-success-modal`, and 5-order capped tracking accordions.

---

## 🚀 4. Build & Deployment Commands

```bash
# 1. Run local development server
npm run dev

# 2. Build production SSR bundle
npm run build

# 3. Deploy to Staging (Test environment)
npx wrangler pages deploy dist --project-name yesfancy-staging --branch main

# 4. Deploy to Production (Live on www.yesfancy.in)
npm run deploy:pages
```

---

## 🐍 5. Ingestion Scripts & Bulk Catalog Sync

The `scripts/` folder contains Python CLI tools for catalog extraction and cloud sync:

### Dependencies:
```bash
pip install pymupdf openpyxl pytesseract pillow
```

### Key Scripts:
1. **`scripts/extract_supplier_catalog.py`**:
   - Ingests supplier PDFs/images (Milton, Hasbro, DOMS, Ekta, Pexpo, etc.) and extracts product details with brand default discounts.
   - Output: `data/draft_catalog_import.xlsx` and `data/draft_catalog_import.json`.
   - Usage:
     ```bash
     python3 scripts/extract_supplier_catalog.py
     ```

2. **`scripts/sync_excel_to_cloud.py`**:
   - Converts edited `data/draft_catalog_import.xlsx` to JSON and batch-upserts rows into Supabase `yesfancy-db` as drafts (`is_active: false`).
   - Usage:
     ```bash
     python3 scripts/sync_excel_to_cloud.py --excel data/draft_catalog_import.xlsx
     ```

3. **`scripts/sync_drafts_to_supabase.py`**:
   - Appends drafts to `src/data/master_catalog.json` and syncs them to Supabase.

---

## 🗄️ 6. Database Schema (`yesfancy-db`)

### `products` Table
- `id` (text, PK)
- `name` (text)
- `category_id` (text: `toys`, `games`, `stem_toys`, `novelties`, `decor`, `lunchbox`, `fashion`, `all`)
- `mrp` (numeric)
- `discount` (numeric, e.g. 15 for 15%)
- `price` (numeric, selling price)
- `image_url` (text, local or Cloud Storage)
- `badge` (text, e.g. `TOP PICK`, `STEM`, `BESTSELLER`)
- `tags` (text[], array of search keywords)
- `stock` (integer, default 50)
- `is_active` (boolean: `true` = live on store, `false` = hidden draft)
- `description` (text)

### `orders` Table
- `order_id` (text, PK)
- `customer_name` (text)
- `phone` (text)
- `address` (text)
- `items` (jsonb/array of strings e.g. `["- Product Name (Qty: 1) = Rs. 299"]`)
- `total` (numeric)
- `status` (text: `Order Placed & Processing`, `Order Confirmed & Packing`, `Dispatched / Out for Delivery`, `Delivered`, `Cancelled`)
- `created_at` (timestamp)

---

## 💬 7. WhatsApp & Tracking Features

- **Storefront Tracking**: Customer inputs 10-digit mobile number in `📦 Track Order` drawer to view their 5 latest orders with a 4-step progress stepper (`Placed ➔ Packing ➔ Out for Delivery ➔ Delivered`).
- **Free Direct WhatsApp Dispatcher**: Admin console generates rich multi-line receipts and opens them in WhatsApp Web (reusing a single named tab `yesfancy_whatsapp_tab`) or native desktop app (`whatsapp://`) with **zero Meta API fees**.
