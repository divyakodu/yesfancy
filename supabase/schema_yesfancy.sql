-- =========================================================================
-- Yes Fancy Single-Store Database Schema (PostgreSQL)
-- Decoupled from Oorumart (Zero multi-tenant overhead)
-- =========================================================================

-- 1. Categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0
);

-- 2. Products (Clean Single-Store Schema with Discount-First Pricing)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  mrp NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  stock INTEGER NOT NULL DEFAULT 100,
  badge TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- 3. Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Order Placed & Processing',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Hero Slides
CREATE TABLE IF NOT EXISTS hero_slides (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link TEXT,
  tag_id TEXT,
  sort_order INTEGER DEFAULT 0
);

-- 5. Store Settings
CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY DEFAULT 'yesfancy',
  name TEXT NOT NULL DEFAULT 'Yes Fancy',
  phone TEXT NOT NULL DEFAULT '918197921458',
  tagline TEXT DEFAULT 'Curated Luxury Gifting, Novelties & Lifestyle',
  announcement_text TEXT DEFAULT 'FREE SHIPPING ON ORDERS ABOVE ₹999 | EXPRESS STORE PICKUP',
  primary_color TEXT DEFAULT '#581C87',
  secondary_color TEXT DEFAULT '#D4AF37',
  accent_color TEXT DEFAULT '#E11D48',
  logo_url TEXT DEFAULT '/images/yes_fancy_icon_transparent.png',
  logo_animated_url TEXT DEFAULT '/images/yes_fancy_icon_animated.gif',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
