/**
 * scripts/03-verify-staging-qa.mjs
 * 
 * Comprehensive E2E Verification Suite for Phase 3 Staging Deployment
 * Tests live endpoints on https://yesfancy-staging.pages.dev
 */

const STAGING_URL = 'https://yesfancy-staging.pages.dev';

async function runQA() {
  console.log(`\n======================================================`);
  console.log(`Starting Phase 3 Staging QA on: ${STAGING_URL}`);
  console.log(`======================================================\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✔ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✖ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Home Page Verification
  console.log(`\n▶ QA-01: Verifying Storefront Homepage (/)`);
  try {
    const res = await fetch(`${STAGING_URL}/`);
    assert(res.status === 200, `Homepage returned HTTP 200`);
    const html = await res.text();
    assert(html.includes('Yes Fancy'), `Homepage renders "Yes Fancy" brand name`);
    assert(html.includes('Easy Return'), `Homepage renders features trailer ("Easy Return")`);
    assert(html.includes('Quality Assured'), `Homepage renders features trailer ("Quality Assured")`);
    assert(!html.includes('8197921458'), `Homepage contains 0 occurrences of legacy phone 8197921458`);
    assert(!html.includes('oorumart.in'), `Homepage contains 0 occurrences of oorumart.in`);
  } catch (err) {
    assert(false, `Homepage request failed: ${err.message}`);
  }

  // 2. Catalog Page Verification
  console.log(`\n▶ QA-02: Verifying Catalog Page (/catalog)`);
  try {
    const res = await fetch(`${STAGING_URL}/catalog`);
    assert(res.status === 200, `Catalog returned HTTP 200`);
    const html = await res.text();
    assert(html.includes('All Products'), `Catalog renders "All Products" filter`);
    assert(html.includes('e.g. 9014838640'), `Catalog renders standardized placeholder phone (9014838640)`);
    assert(!html.includes('8197921458'), `Catalog contains 0 occurrences of legacy phone 8197921458`);
  } catch (err) {
    assert(false, `Catalog request failed: ${err.message}`);
  }

  // 3. Category Filter Verification
  console.log(`\n▶ QA-03: Verifying Category Filtering (/catalog?category=toys)`);
  try {
    const res = await fetch(`${STAGING_URL}/catalog?category=toys`);
    assert(res.status === 200, `Category filter returned HTTP 200`);
    const html = await res.text();
    assert(html.includes('toys') || html.includes('Toys'), `Category filter processed toys parameter`);
  } catch (err) {
    assert(false, `Category filter request failed: ${err.message}`);
  }

  // 4. Product Display Page (PDP) Verification
  console.log(`\n▶ QA-04: Verifying Product Display Page (/product/prod_1758288591873)`);
  try {
    const res = await fetch(`${STAGING_URL}/product/prod_1758288591873`);
    assert(res.status === 200, `Product page returned HTTP 200`);
    const html = await res.text();
    assert(html.includes('wa.me/919014838640'), `WhatsApp direct order button points to 919014838640`);
    assert(html.includes('tel:+919014838640') || html.includes('tel:+91 9014838640'), `Store help call link points to 919014838640`);
    assert(!html.includes('8197921458'), `Product page contains 0 occurrences of legacy phone 8197921458`);
  } catch (err) {
    assert(false, `Product page request failed: ${err.message}`);
  }

  // 5. Admin Portal Verification
  console.log(`\n▶ QA-05: Verifying Admin Console (/admin)`);
  try {
    const res = await fetch(`${STAGING_URL}/admin`);
    assert(res.status === 200, `Admin page returned HTTP 200`);
    const html = await res.text();
    assert(html.includes('Yes Fancy Store Admin') || html.includes('Yes Fancy Admin'), `Admin renders Yes Fancy branding`);
    assert(html.includes('919014838640'), `Admin form prefill contains standardized phone 919014838640`);
    assert(!html.includes('8197921458'), `Admin page contains 0 occurrences of legacy phone 8197921458`);
  } catch (err) {
    assert(false, `Admin page request failed: ${err.message}`);
  }

  // 6. API Orders Lifecycle Verification
  console.log(`\n▶ QA-06: Verifying Order Creation API (POST /api/orders)`);
  const testOrderId = `STAGING-QA-${Date.now()}`;
  try {
    const payload = {
      order_id: testOrderId,
      customer_name: 'Staging QA Verification Bot',
      phone: '9014838640',
      address: 'Cloudflare Pages Staging Test Suite',
      items: ['- Automated QA Item (Qty: 1) = Rs. 499'],
      total: 499
    };
    const res = await fetch(`${STAGING_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    assert(res.status === 200, `POST /api/orders returned HTTP 200`);
    const body = await res.json();
    assert(body.success === true, `Order created with success: true`);
    assert(body.order?.order_id === testOrderId, `Returned order_id matches (${testOrderId})`);
  } catch (err) {
    assert(false, `Order creation request failed: ${err.message}`);
  }

  // 7. API Orders List Verification
  console.log(`\n▶ QA-07: Verifying Order Lookup API (GET /api/orders)`);
  try {
    const res = await fetch(`${STAGING_URL}/api/orders`);
    assert(res.status === 200, `GET /api/orders returned HTTP 200`);
    const body = await res.json();
    assert(Array.isArray(body.orders), `Orders API returned array`);
    const found = body.orders.find(o => o.order_id === testOrderId);
    assert(!!found, `Newly submitted staging order found in orders list`);
  } catch (err) {
    assert(false, `Orders list request failed: ${err.message}`);
  }

  // Cleanup test order directly in DB
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      'https://ebsrmjnegdhpnlbxcxfm.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVic3Jtam5lZ2RocG5sYnhjeGZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTYxNjQwMCwiZXhwIjoyMTA3MTkyNDAwfQ.ZXgJA-bJMrFwQhR-l81fW9bYldzAr7XkgEBhUrm0Evo'
    );
    await supabase.from('orders').delete().eq('order_id', testOrderId);
    console.log(`  ✔ Cleaned up temporary test order ${testOrderId} from database.`);
  } catch (err) {
    console.warn(`  ⚠ Order cleanup note: ${err.message}`);
  }

  console.log(`\n======================================================`);
  console.log(`QA Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runQA();
