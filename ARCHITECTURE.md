# Yes Fancy — Architecture Documentation

This document describes the decoupled, standalone architecture of **Yes Fancy** (`www.yesfancy.in`).

---

## 1. System Architecture

```
                    ┌─────────────────────────┐
                    │      Cloudflare Edge    │
                    │   (www.yesfancy.in)     │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Astro SSR Server      │
                    │   (Cloudflare Pages)    │
                    └────────────┬────────────┘
                                 │
                     ┌───────────┴───────────┐
                     │                       │
                     ▼                       ▼
          ┌─────────────────────┐ ┌──────────────────────┐
          │ Supabase Cloud DB   │ │ Supabase Storage     │
          │ (ebsrmjnegdhpnlbxc) │ │ (product-images)     │
          │                     │ │                      │
          │ - store_settings    │ │ - yesfancy/products/ │
          │ - categories        │ │ - yesfancy/categ...  │
          │ - products          │ │ - yesfancy/banners/  │
          │ - hero_slides       │ └──────────────────────┘
          │ - orders            │
          └─────────────────────┘
```

---

## 2. Database Schema (Single-Store)

All tables are strictly single-store without multi-tenant foreign keys or tenant scaffolding:

| Table | Purpose | Primary Key | Key Columns |
| :--- | :--- | :--- | :--- |
| `store_settings` | Global store branding & contact | `id` ('default') | `name`, `phone`, `tagline`, `logo_url`, `primary_color`, `secondary_color` |
| `categories` | Store categories | `id` | `label`, `tag`, `image_url`, `sort_order` |
| `products` | Catalog items | `id` | `name`, `mrp`, `discount`, `price`, `image_url`, `category_id`, `stock`, `is_active` |
| `hero_slides` | Homepage banners | `id` | `title`, `subtitle`, `cta_link`, `image_url`, `sort_order` |
| `orders` | Customer orders | `order_id` | `customer_name`, `phone`, `address`, `items`, `total`, `status` |

---

## 3. Key Design Principles

1. **Zero Multi-Tenant Indirection**: No `shop_id`, `shop_slug`, or owner discovery loops. The application operates solely on Yes Fancy data.
2. **Clean URL Design**:
   - Homepage: `/`
   - Full Catalog: `/catalog`
   - Category Filter: `/catalog?category=fashion`
   - Product Details: `/product/[id]`
   - Store Admin: `/admin`
3. **Discount-First Pricing**:
   $$\text{Selling Price} = \text{round}\left(\text{MRP} \times \left(1 - \frac{\text{Discount}}{100}\right)\right)$$
4. **Client State Resilience**:
   Cart and order history are persisted in `localStorage` under `yesfancy_cart` and `yesfancy_orders`, with migration fallbacks for users transitioning from the legacy multi-tenant keys.
