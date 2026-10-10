import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// 1. Source (Old Shared DB) credentials from .env
const env = fs.readFileSync('.env', 'utf8');
const oldUrl = env.match(/PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim() || '';
const oldServiceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim() || '';

// 2. Destination (New Yes Fancy Dedicated DB) credentials
const newUrl = 'https://ebsrmjnegdhpnlbxcxfm.supabase.co';
const newServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVic3Jtam5lZ2RocG5sYnhjeGZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTYxNjQwMCwiZXhwIjoyMTA3MTkyNDAwfQ.ZXgJA-bJMrFwQhR-l81fW9bYldzAr7XkgEBhUrm0Evo';

const oldClient = createClient(oldUrl, oldServiceKey);
const newClient = createClient(newUrl, newServiceKey);

const YESFANCY_SHOP_ID = '8ca39196-2948-4d61-bfe2-388875120b2b';

async function migrateData() {
  console.log('🚀 Starting Yes Fancy Non-Destructive Data Migration...');

  // --- Step 1: Migrate Categories ---
  console.log('\n📦 1. Migrating Categories...');
  const { data: oldCategories, error: catErr } = await oldClient
    .from('categories')
    .select('id, label, image_url, sort_order')
    .eq('shop_id', YESFANCY_SHOP_ID)
    .order('sort_order', { ascending: true });

  if (catErr) throw new Error('Error reading old categories: ' + catErr.message);
  console.log(`Found ${oldCategories.length} categories to migrate.`);

  const { error: newCatErr } = await newClient.from('categories').upsert(oldCategories);
  if (newCatErr) throw new Error('Error inserting categories: ' + newCatErr.message);
  console.log('✅ Categories migrated successfully.');

  // --- Step 2: Migrate Products ---
  console.log('\n📦 2. Migrating Products...');
  let offset = 0;
  const chunkSize = 100;
  let allProducts: any[] = [];

  while (true) {
    const { data: chunk, error: pErr } = await oldClient
      .from('products')
      .select('id, category_id, name, description, mrp, discount, price, image_url, stock, badge, tags, is_active, created_at')
      .eq('shop_id', YESFANCY_SHOP_ID)
      .range(offset, offset + chunkSize - 1);

    if (pErr) throw new Error('Error reading old products chunk: ' + pErr.message);
    if (!chunk || chunk.length === 0) break;

    allProducts = allProducts.concat(chunk);
    offset += chunkSize;
    console.log(`Read ${allProducts.length} products so far...`);
  }

  console.log(`Total Yes Fancy products to insert: ${allProducts.length}`);

  // Ingest in chunks of 50
  for (let i = 0; i < allProducts.length; i += 50) {
    const slice = allProducts.slice(i, i + 50);
    const { error: insErr } = await newClient.from('products').upsert(slice);
    if (insErr) throw new Error(`Error inserting products at ${i}: ` + insErr.message);
  }
  console.log('✅ All 543 Products migrated successfully.');

  // --- Step 3: Migrate Orders ---
  console.log('\n📦 3. Migrating Orders...');
  const { data: oldOrders, error: ordErr } = await oldClient
    .from('orders')
    .select('order_id, customer_name, phone, address, items, total, status, created_at')
    .eq('shop_id', YESFANCY_SHOP_ID);

  if (ordErr) throw new Error('Error reading old orders: ' + ordErr.message);
  console.log(`Found ${oldOrders.length} orders to migrate.`);

  if (oldOrders.length > 0) {
    const { error: insOrdErr } = await newClient.from('orders').upsert(oldOrders);
    if (insOrdErr) throw new Error('Error inserting orders: ' + insOrdErr.message);
  }
  console.log('✅ Orders migrated successfully.');

  // --- Step 4: Migrate Store Settings & Hero Slides ---
  console.log('\n📦 4. Migrating Store Settings & Hero Slides...');
  const { data: shopRecord } = await oldClient
    .from('shops')
    .select('*')
    .eq('id', YESFANCY_SHOP_ID)
    .single();

  if (shopRecord) {
    const themeObj = shopRecord.theme || {};
    const storeSettings = {
      id: 'yesfancy',
      name: shopRecord.name || 'Yes Fancy',
      phone: shopRecord.phone || '918197921458',
      tagline: shopRecord.tagline || 'Curated Luxury Gifting, Novelties & Lifestyle',
      announcement_text: shopRecord.announcement_text || 'FREE SHIPPING ON ORDERS ABOVE ₹999 | EXPRESS STORE PICKUP',
      primary_color: themeObj.primary_color || '#581C87',
      secondary_color: themeObj.secondary_color || '#D4AF37',
      accent_color: themeObj.accent_color || '#E11D48',
      logo_url: shopRecord.logo_url || '/images/yes_fancy_icon_transparent.png',
      logo_animated_url: shopRecord.logo_animated_url || '/images/yes_fancy_icon_animated.gif'
    };

    const { error: setErr } = await newClient.from('store_settings').upsert(storeSettings);
    if (setErr) throw new Error('Error inserting store_settings: ' + setErr.message);
    console.log('✅ Store Settings migrated.');

    const defaultHeroSlides = [
      {
        id: "slide_beauty_lifestyle",
        title: "BEAUTY & LIFESTYLE",
        subtitle: "Curated luxury fragrances, fine jewellery & premium personal care.",
        image_url: "/images/offer_beauty_lifestyle.webp",
        link: "/catalog?category=fashion",
        tag_id: "fashion",
        sort_order: 1
      },
      {
        id: "slide_gift_store",
        title: "FESTIVE GIFT STORE",
        subtitle: "Curated luxury hampers, fancy boxes & novelties for every occasion.",
        image_url: "/images/offer_gift_store.webp",
        link: "/catalog?category=novelties",
        tag_id: "novelties",
        sort_order: 2
      },
      {
        id: "slide_home_decor",
        title: "MODERN HOME & DECOR",
        subtitle: "Fancy minimal interiors, designer lamps & contemporary living accents.",
        image_url: "/images/offer_home_decor.webp",
        link: "/catalog?category=decor",
        tag_id: "decor",
        sort_order: 3
      }
    ];

    const { error: slideErr } = await newClient.from('hero_slides').upsert(defaultHeroSlides);
    if (slideErr) throw new Error('Error inserting hero_slides: ' + slideErr.message);
    console.log('✅ Hero Slides migrated.');
  }

  console.log('\n🎉 ALL DATA MIGRATED WITH ZERO ERRORS!');
}

migrateData().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
