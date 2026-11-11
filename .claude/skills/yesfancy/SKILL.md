---
name: yesfancy-ops
description: Comprehensive operational guide, Supabase connection architecture, Cloudflare Pages deployment, product catalog ingestion, multi-user macOS workflow, and test verification for the YesFancy ecommerce platform.
---

# YesFancy Operational & Architecture Skill

This skill provides complete reference, credentials architecture, Supabase integration details, deployment commands, catalog management instructions, and multi-user Mac workflow for the **YesFancy** ecommerce platform (`www.yesfancy.in`).

---

## 1. System Architecture & Tech Stack

- **Framework**: Astro 5 (Hybrid SSR + Static Prerendering)
- **Adapter**: `@astrojs/cloudflare` in SSR mode with Cloudflare Workers runtime
- **Edge CDN & Hosting**: Cloudflare Pages
- **Database & Auth & Realtime**: Supabase (PostgreSQL 15 + RLS + Realtime websockets)
- **Object Storage**: Supabase Storage (`product-images` bucket)
- **Styling**: TailwindCSS
- **Component Engine**: Dual-brand core (`src/core/`) supporting independent themes (`yesfancy` vs `oorumart`)
- **Strict Isolation Rule**: The legacy store `~/Documents/oorumart` and database `fwrievuhudjkeffmszqf` are completely separate and must never be touched or referenced.

---

## 2. Environments & Credentials

### 2.1 Cloudflare Pages
- **Account ID**: `ca3f72c19d043540486ac8bd70ab79e2` (Owner: Achalla Ravi Kiran / divyakodu)
- **Production Project**: `yesfancy`
  - URL: `https://yesfancy.pages.dev`
  - Custom Domain: `https://www.yesfancy.in`
- **Staging Project**: `yesfancy-staging`
  - URL: `https://yesfancy-staging.pages.dev`

### 2.2 Supabase (`yesfancy-db`)
- **Project Ref**: `ebsrmjnegdhpnlbxcxfm`
- **Region**: `ap-south-1` (Mumbai, India)
- **API URL**: `https://ebsrmjnegdhpnlbxcxfm.supabase.co`

### 2.3 Required Environment Variables (`.env`)
```bash
PUBLIC_STORE_ID=yesfancy
PUBLIC_SUPABASE_URL=https://ebsrmjnegdhpnlbxcxfm.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVic3Jtam5lZ2RocG5sYnhjeGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MTY0MDAsImV4cCI6MjEwNzE5MjQwMH0.zP6UtvlbN3Hx8E2MbMcNk9fx4JUQpdCqrrvigytIN7M
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVic3Jtam5lZ2RocG5sYnhjeGZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSI...
ADMIN_ACCESS_CODE=2809
CLOUDFLARE_ACCOUNT_ID=ca3f72c19d043540486ac8bd70ab79e2
```

---

## 3. How Supabase Connects (Deep Dive)

The system connects to Supabase across three distinct architectural layers:

```mermaid
flowchart TD
    Browser[Browser Storefront & Admin] -->|Anon Key / RLS| SupabasePublic[Supabase PostgREST API / Storage]
    AstroAPI[Cloudflare Workers / SSR API Routes] -->|Service Role Key / Bypasses RLS| SupabaseAdmin[Supabase PostgreSQL]
    PythonScripts[Python Automation Scripts] -->|Service Role Key / Direct Ingestion| SupabaseAdmin
```

### Layer 1: Client-Side Browser Connection
- **Initialized in**: `src/core/components/AdminPortalCore.astro` and storefront script tags using CDN `@supabase/supabase-js@2`.
- **Key Used**: `PUBLIC_SUPABASE_ANON_KEY` (Safe to be public).
- **Security / RLS (Row Level Security)**:
  - Anons can `SELECT` from `products` where `is_active = true`.
  - Anons can `INSERT` into `orders` (placing orders from checkout).
  - Anons **CANNOT** update or delete products, view admin settings, or read other customer orders.
- **Realtime**:
  - Storefront and admin subscribe to PostgreSQL change notifications using `supabaseClient.channel('custom-filter-channel').on('postgres_changes', ...)`.

### Layer 2: Server-Side API Routes (Cloudflare Workers Runtime)
- **Initialized in**: `src/core/lib/supabase.ts`, `src/core/lib/storage.ts`, and `src/core/lib/getShopConfig.ts`.
- **Key Used**: `SUPABASE_SERVICE_ROLE_KEY` (or fallback to `PUBLIC_SUPABASE_ANON_KEY` if service role is absent).
- **Role**:
  - Runs in edge compute (Cloudflare Workers via Astro Cloudflare Adapter).
  - Handles `/api/products` (POST, PUT, DELETE), `/api/orders` (PATCH status updates), `/api/shop-settings`, `/api/hero-slides`.
  - Service role key bypasses RLS policies to allow legitimate admin operations.
  - Environment variables are bound to Cloudflare Pages via:
    ```bash
    npx wrangler pages secret bulk .env --project-name yesfancy
    ```

### Layer 3: Batch Automation & ETL Scripts (Local Python)
- **Initialized in**: `scripts/sync_excel_to_cloud.py`.
- **Key Used**: `SUPABASE_SERVICE_ROLE_KEY` loaded from root `.env` via `python-dotenv`.
- **Role**:
  - Bulk upserts 500+ products into the `products` table.
  - Uploads local product images to the Supabase Storage bucket `product-images`.
  - Updates category counts and tag linkages.

---

## 4. Multi-User Mac Access (`divyakodukula` & `Ravi`)

Both profiles belong to macOS `admin` and `staff` groups on the same machine.
- Profile A: `divyakodukula` (Original repo path: `/Users/divyakodukula/Documents/yesfancy`)
- Profile B: `Ravi` (Real name: *Achalla Ravi Kiran*, Home: `/Users/Ravi`)

### 4.1 Permitting Access
macOS Access Control Lists (ACL) are active on the folder:
```bash
chmod +a "user:Ravi allow list,search" /Users/divyakodukula/Documents
chmod -R +a "user:Ravi allow list,add_file,search,delete,add_subdirectory,file_inherit,directory_inherit" /Users/divyakodukula/Documents/yesfancy
```

### 4.2 Creating the Link in Ravi's Account
When logged in as `Ravi`:
```bash
# Create symbolic link directly into Ravi's Documents
ln -s /Users/divyakodukula/Documents/yesfancy /Users/Ravi/Documents/yesfancy

# Access it instantly
cd ~/Documents/yesfancy
git status
```
This provides 100% real-time two-way synchronization: any file created or modified in either profile is immediately available in the other without copying or committing.

---

## 5. Development & Verification Workflow

### 5.1 Local Dev Server
```bash
npm install
npm run dev
# Storefront: http://localhost:4321
# Admin Portal: http://localhost:4321/admin/dashboard
```

### 5.2 Quality Gate Verification (Mandatory before push)
Must run and pass all 21 tests:
```bash
npm test
```
The 4 gates verified:
1. `tests/integration/brand-isolation.test.ts` (Ensures zero cross-contamination with oorumart)
2. `tests/integration/store-config.test.ts` (Validates 540+ products, categories, active status)
3. `tests/integration/whatsapp-dispatch.test.ts` (Validates direct WhatsApp customer dispatch formatting)
4. `tests/integration/order-tracking.test.ts` (Validates order lookup, status tracking modal, and cancellation rules)

### 5.3 Deploying to Staging
```bash
npm run build
npx wrangler pages deploy dist --project-name yesfancy-staging --commit-dirty=true
```

### 5.4 Deploying to Production
```bash
npm run build
npx wrangler pages deploy dist --project-name yesfancy --commit-dirty=true
```

---

## 6. Product Catalog Management

- **Catalog Schema**:
  ```json
  {
    "id": "yf-p001",
    "name": "Product Name",
    "category": "Hair Accessories",
    "price": 199,
    "mrp": 299,
    "discount": "33% OFF",
    "stock": 50,
    "image": "/catalog_images/yf-p001.jpg",
    "badge": "Bestseller",
    "tag": "Trending",
    "is_active": true
  }
  ```
- **Sync Catalog to Cloud**:
  ```bash
  python3 scripts/sync_excel_to_cloud.py
  ```
- **Extract From Source PDFs**:
  ```bash
  python3 scripts/extract_supplier_catalog.py
  ```
