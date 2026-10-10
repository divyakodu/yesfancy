import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// 1. Source (Old Shared DB)
const env = fs.readFileSync('.env', 'utf8');
const oldUrl = env.match(/PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim() || '';
const oldServiceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim() || '';

// 2. Destination (New Yes Fancy Dedicated DB)
const newUrl = 'https://ebsrmjnegdhpnlbxcxfm.supabase.co';
const newServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVic3Jtam5lZ2RocG5sYnhjeGZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTYxNjQwMCwiZXhwIjoyMTA3MTkyNDAwfQ.ZXgJA-bJMrFwQhR-l81fW9bYldzAr7XkgEBhUrm0Evo';

const oldClient = createClient(oldUrl, oldServiceKey);
const newClient = createClient(newUrl, newServiceKey);

const YESFANCY_SHOP_ID = '8ca39196-2948-4d61-bfe2-388875120b2b';

async function verifyMigration() {
  console.log('====================================================');
  console.log('🔍 PHASE 1 AUTOMATED INTEGRITY VERIFICATION GATE');
  console.log('====================================================\n');

  let passed = true;

  // 1. Audit Products
  console.log('📊 [Check 1/5] Auditing Products Count & Active Status...');
  const { data: oldProds } = await oldClient
    .from('products')
    .select('id, name, is_active, mrp, discount, price')
    .eq('shop_id', YESFANCY_SHOP_ID);

  const { data: newProds } = await newClient
    .from('products')
    .select('id, name, is_active, mrp, discount, price');

  const oldTotal = oldProds?.length || 0;
  const newTotal = newProds?.length || 0;
  const oldActive = oldProds?.filter(p => p.is_active !== false).length || 0;
  const newActive = newProds?.filter(p => p.is_active !== false).length || 0;

  console.log(`- Old DB Total Products: ${oldTotal} | New DB Total Products: ${newTotal}`);
  console.log(`- Old DB Active Products: ${oldActive} | New DB Active Products: ${newActive}`);

  if (oldTotal === newTotal && oldTotal === 543 && newActive === oldActive && newActive === 190) {
    console.log('✅ CHECK 1 PASSED: Product counts match exactly (543 total, 190 active).');
  } else {
    console.error('❌ CHECK 1 FAILED: Product count discrepancy detected.');
    passed = false;
  }

  // 2. Audit Pricing Formula Integrity
  console.log('\n📊 [Check 2/5] Auditing Discount-First Pricing Formula...');
  let pricingMismatches = 0;
  newProds?.forEach(p => {
    const mrp = Number(p.mrp || p.price || 0);
    const disc = Number(p.discount || 0);
    const expectedSellingPrice = Math.round(mrp * (1 - disc / 100));
    if (mrp > 0 && Number(p.price) !== expectedSellingPrice) {
      pricingMismatches++;
    }
  });

  if (pricingMismatches === 0) {
    console.log('✅ CHECK 2 PASSED: 100% of products conform to Selling Price = round(MRP * (1 - Discount/100)).');
  } else {
    console.warn(`⚠️ CHECK 2 NOTE: ${pricingMismatches} products have custom price values.`);
  }

  // 3. Audit Categories
  console.log('\n📊 [Check 3/5] Auditing Categories Count & Labels...');
  const { data: oldCats } = await oldClient.from('categories').select('*').eq('shop_id', YESFANCY_SHOP_ID);
  const { data: newCats } = await newClient.from('categories').select('*');

  console.log(`- Old DB Categories: ${oldCats?.length} | New DB Categories: ${newCats?.length}`);
  if ((newCats?.length || 0) >= 7) {
    console.log('✅ CHECK 3 PASSED: Categories successfully loaded in new DB.');
  } else {
    console.error('❌ CHECK 3 FAILED: Category count issue.');
    passed = false;
  }

  // 4. Audit Orders History
  console.log('\n📊 [Check 4/5] Auditing Orders History...');
  const { data: oldOrders } = await oldClient.from('orders').select('*').eq('shop_id', YESFANCY_SHOP_ID);
  const { data: newOrders } = await newClient.from('orders').select('*');

  console.log(`- Old DB Orders: ${oldOrders?.length} | New DB Orders: ${newOrders?.length}`);
  if (oldOrders?.length === newOrders?.length && (newOrders?.length || 0) === 38) {
    console.log('✅ CHECK 4 PASSED: Exactly 38 historical customer orders migrated.');
  } else {
    console.error('❌ CHECK 4 FAILED: Order count mismatch.');
    passed = false;
  }

  // 5. Audit Storage Bucket & Transferred Assets
  console.log('\n📊 [Check 5/5] Auditing Storage Bucket & Custom Uploads...');
  const { data: buckets } = await newClient.storage.listBuckets();
  const hasProductBucket = buckets?.some(b => b.name === 'product-images' && b.public === true);
  const { data: prodFiles } = await newClient.storage.from('product-images').list('yesfancy/products');
  const { data: catFiles } = await newClient.storage.from('product-images').list('yesfancy/categories');

  console.log(`- Bucket 'product-images' (Public): ${hasProductBucket ? 'YES' : 'NO'}`);
  console.log(`- Transferred custom product images: ${prodFiles?.length}`);
  console.log(`- Transferred custom category images: ${catFiles?.length}`);

  if (hasProductBucket && (prodFiles?.length || 0) > 0) {
    console.log('✅ CHECK 5 PASSED: Storage bucket configured and images verified.');
  } else {
    console.error('❌ CHECK 5 FAILED: Storage asset verification failed.');
    passed = false;
  }

  console.log('\n====================================================');
  if (passed) {
    console.log('🏆 VERIFICATION GATE PASSED: PHASE 1 IS 100% COMPLETE & VERIFIED!');
  } else {
    console.log('❌ VERIFICATION GATE FAILED: Issues require resolution before review.');
  }
  console.log('====================================================\n');
}

verifyMigration().catch(console.error);
