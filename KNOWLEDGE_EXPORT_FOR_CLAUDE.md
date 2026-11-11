# YesFancy — Full Knowledge Base & Architecture Export

> **How to Use this Document with Claude:**
> - **In Claude.ai (Web App)**: Create a Project named `YesFancy E-Commerce`, paste the System Prompt section into **Custom Instructions**, and upload this file under **Project Knowledge**.
> - **In Claude Code (CLI)**: A `CLAUDE.md` file has already been generated at the project root for local CLI execution.

---

## 1. Executive Summary & Tech Stack

**Yes Fancy** ([www.yesfancy.in](https://www.yesfancy.in)) is a standalone single-store e-commerce platform for handcrafted gifts, action toys, board games, STEM kits, home decor, and lifestyle novelties.

- **Frontend / Rendering**: Astro 7.x (`output: 'server'`) with `@astrojs/cloudflare` edge SSR adapter.
- **Styling**: Tailwind CSS v4.
- **Database**: Dedicated Supabase PostgreSQL (`yesfancy-db` / ref `ebsrmjnegdhpnlbxcxfm`).
- **Media Storage**: Supabase Storage bucket (`product-images`).
- **Edge Deployment**: Cloudflare Pages (Production: `yesfancy`, Staging: `yesfancy-staging`).
- **Domain**: `www.yesfancy.in` (and `yesfancy.pages.dev`).

---

## 2. Environment Connections & How Tools Authenticate

When working with this project, here is how each service connects:

### A. Local Machine & Shell Execution
- Shell: Zsh on macOS.
- Working Directory: `/Users/divyakodukula/Documents/yesfancy`.
- Node.js runtime: v20+ / Node native test runner (`node:test`).
- Python runtime: Python 3 with `pymupdf`, `openpyxl`, `pytesseract`, `pillow`.

### B. Cloudflare Pages
- Authenticated via the Cloudflare Wrangler CLI (`npx wrangler`).
- Credentials: Stored in `~/.wrangler` using local API tokens.
- Projects managed:
  1. `yesfancy` — Production deployment linked to custom domain `www.yesfancy.in`.
  2. `yesfancy-staging` — Staging deployment live at `https://yesfancy-staging.pages.dev`.

### C. Supabase Cloud (`yesfancy-db`)
- Project Reference: `ebsrmjnegdhpnlbxcxfm`.
- Project URL: `https://ebsrmjnegdhpnlbxcxfm.supabase.co`.
- Credentials stored in `.env`:
  - `PUBLIC_SUPABASE_URL`: `https://ebsrmjnegdhpnlbxcxfm.supabase.co`
  - `PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGciOi...`
  - `SUPABASE_SERVICE_ROLE_KEY`: `eyJhbGciOi...`
- Cloudflare Pages sync: Configured using `npx wrangler pages secret bulk .env --project-name yesfancy`.

### D. GitHub Repository
- Repo URL: `https://github.com/divyakodu/yesfancy.git`.
- Default branch: `main`.

---

## 3. Database Schema (`yesfancy-db`)

### `products` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `text` | Primary Key | Product SKU / unique slug (e.g. `nerf_elite_20` or `prod_1791656278533`). |
| `name` | `text` | NOT NULL | Customer-facing product title. |
| `category_id` | `text` | NOT NULL | One of: `all`, `toys`, `games`, `stem_toys`, `novelties`, `decor`, `lunchbox`, `fashion`. |
| `mrp` | `numeric` | NOT NULL | Maximum Retail Price in INR (₹). |
| `discount` | `numeric` | Default `0` | Percentage discount (0 to 99). |
| `price` | `numeric` | NOT NULL | Final customer selling price: `round(mrp * (1 - discount / 100))`. |
| `image_url` | `text` | NOT NULL | Path or hosted Cloud Storage URL. |
| `badge` | `text` | Optional | High-contrast promotional pill (e.g. `TOP PICK`, `BESTSELLER`, `STEM`). |
| `tags` | `text[]` | Default `[]` | Keywords for semantic search and hero carousel matching. |
| `stock` | `integer` | Default `50` | Available stock count. |
| `is_active` | `boolean` | Default `true` | `true` = Live on storefront; `false` = Hidden draft. |
| `description` | `text` | Optional | Detailed specifications and descriptions. |
| `created_at` | `timestamptz`| Default `now()` | Timestamp of creation. |

### `orders` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `order_id` | `text` | Primary Key | Order number (e.g. `YF-5360`). |
| `customer_name` | `text` | NOT NULL | Name of the customer. |
| `phone` | `text` | NOT NULL | 10-digit mobile number for order lookup and WhatsApp receipts. |
| `address` | `text` | NOT NULL | Delivery destination address or Store Pickup note. |
| `items` | `jsonb` | NOT NULL | Array of strings: `["- Item Name (Qty: 1) = Rs. 299"]`. |
| `total` | `numeric` | NOT NULL | Total COD amount payable in INR (₹). |
| `status` | `text` | Default `Order Placed & Processing` | Lifecycle state: `Order Placed & Processing`, `Order Confirmed & Packing`, `Dispatched / Out for Delivery`, `Delivered`, `Cancelled`. |
| `created_at` | `timestamptz`| Default `now()` | Order placement timestamp. |

---

## 4. Key Workflows & Scripts

### A. Testing Quality Gates
Every change must pass **all 4 gates** before deployment:
```bash
npm test
```
1. **Gate 1: Pricing Calculations**: Rounding, discount formulas, and edge cases.
2. **Gate 2: Database Data Parity**: Verifies Supabase connectivity, category IDs, and product field constraints.
3. **Gate 3: Single-Store API Contracts**: Verifies endpoints (`/api/orders`, `/api/products`, `/api/categories`).
4. **Gate 4: Storefront UI Contracts**: Verifies `#order-success-modal`, `📦 Track Order` button, and accordion order tracking.

### B. Catalog Ingestion Pipeline
1. **Extract from Supplier Documents**:
   ```bash
   python3 scripts/extract_supplier_catalog.py
   ```
   Parses PDFs/images and outputs `data/draft_catalog_import.xlsx` and `data/draft_catalog_import.json`.
2. **Sync to Supabase**:
   ```bash
   python3 scripts/sync_excel_to_cloud.py --excel data/draft_catalog_import.xlsx
   ```
   Batch-upserts products into `yesfancy-db` as drafts (`is_active: false`).
3. **Publish in Admin Console**:
   Go to `/admin` -> **Store Products** -> Filter by **⚪ Hidden Only** -> Add photo -> Toggle **🟢 Active**.

### C. Deployment Commands
```bash
# Build
npm run build

# Deploy to Staging
npx wrangler pages deploy dist --project-name yesfancy-staging --branch main

# Deploy to Production (www.yesfancy.in)
npm run deploy:pages
```

---

## 5. UI Features & Architectural Decisions

1. **Free Zero-Cost WhatsApp Dispatcher**:
   - Skips intermediate Meta API redirect pages (`api.whatsapp.com` and `wa.me`).
   - Uses `web.whatsapp.com/send` targeting a named reusable tab (`yesfancy_whatsapp_tab`) to prevent opening multiple browser tabs.
   - Allows switching between **🌐 Web Tab** and **💻 Desktop App** (`whatsapp://`) in the Admin Orders toolbar.
2. **Capped 5-Order Customer Tracking**:
   - Customer searches via mobile number in the header drawer.
   - Results are capped to the 5 most recent orders with collapsible accordions.
   - Includes a visual 4-step progress stepper: `Placed ➔ Packing ➔ Out for Delivery ➔ Delivered`.
3. **Celebratory Order Placed Modal**:
   - Replaced raw toasts with an animated glassmorphic confirmation modal (`#order-success-modal`) displaying the Order ID, itemized receipt table, and delivery address.

---

## 6. Custom Instructions Template (For Claude Project System Prompt)

Copy and paste this into the **Custom Instructions** field in your Claude Project:

```text
You are an expert full-stack developer assisting with the YesFancy standalone e-commerce codebase (www.yesfancy.in).

Tech Stack:
- Astro 7.x (Server-Side Rendering on Cloudflare Pages via @astrojs/cloudflare)
- Tailwind CSS v4
- Supabase PostgreSQL (yesfancy-db / ref: ebsrmjnegdhpnlbxcxfm)
- Node.js test runner for 4-tier quality gates

Core Rules & Constraints:
1. Strict Isolation: This project is strictly decoupled from oorumart. Never touch ~/Documents/oorumart or database fwrievuhudjkeffmszqf.
2. Pricing: Always adhere to the discount-first formula: Selling Price = round(MRP * (1 - discount / 100)).
3. Quality Gates: Always run `npm test` after changes. All 4 quality gates (Unit, DB Parity, API Contracts, UI Contracts) must pass 100%.
4. Draft Protection: Ingested products must default to `is_active: false` until images are provided and toggled active.
5. WhatsApp: Keep messaging 100% free; use direct web.whatsapp.com named tab reuse or native whatsapp:// deep links without paid Meta APIs.
```
