import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GET as getOrders, POST as createOrder, PATCH as updateOrderStatus } from '../../src/pages/api/orders';
import { POST as createProduct, DELETE as deleteProduct } from '../../src/pages/api/products';
import { POST as createCategory, DELETE as deleteCategory } from '../../src/pages/api/categories';
import { supabase } from '../../src/core/lib/supabase';

describe('Gate 3: Single-Store API Contracts (Integration Tests)', () => {
  it('GET /api/orders should return orders array without requiring shop_slug', async () => {
    const fakeContext: any = {
      url: new URL('http://localhost:4321/api/orders')
    };
    const response = await getOrders(fakeContext);
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.ok(Array.isArray(body.orders), 'body.orders must be an array');
  });

  it('POST /api/orders should successfully insert an order without requiring shop_slug', async () => {
    const testOrderId = `TEST-ORD-${Date.now()}`;
    const payload = {
      order_id: testOrderId,
      customer_name: 'Gate 3 Verification Bot',
      phone: '9999999999',
      address: 'Test Suite Suite 1',
      items: ['- Test Item 1 (Qty: 1) = Rs. 100'],
      total: 100
    };

    const fakeContext: any = {
      request: new Request('http://localhost:4321/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    };

    const response = await createOrder(fakeContext);
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.success, true);
    assert.equal(body.order?.order_id, testOrderId);

    // Clean up test order
    if (supabase) {
      await supabase.from('orders').delete().eq('order_id', testOrderId);
    }
  });

  it('PATCH /api/orders should update the status of an existing order', async () => {
    const testOrderId = `TEST-PATCH-${Date.now()}`;
    const payload = {
      order_id: testOrderId,
      customer_name: 'Status Test Bot',
      phone: '8888888888',
      address: 'Test Suite Suite 2',
      items: ['- Test Item 1 (Qty: 1) = Rs. 200'],
      total: 200
    };

    // Create order first
    const createCtx: any = {
      request: new Request('http://localhost:4321/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    };
    await createOrder(createCtx);

    // Now update status via PATCH
    const patchCtx: any = {
      request: new Request('http://localhost:4321/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: testOrderId,
          status: 'Dispatched / Out for Delivery'
        })
      })
    };
    const patchRes = await updateOrderStatus(patchCtx);
    assert.equal(patchRes.status, 200);

    const patchBody = await patchRes.json();
    assert.equal(patchBody.success, true);
    if (patchBody.order) {
      assert.equal(patchBody.order.status, 'Dispatched / Out for Delivery');
    }

    // Clean up
    if (supabase) {
      await supabase.from('orders').delete().eq('order_id', testOrderId);
    }
  });

  it('POST /api/products and DELETE /api/products should operate with custom badge and tags', async () => {
    const testProdId = `test_prod_${Date.now()}`;
    const createPayload = {
      id: testProdId,
      name: 'Automated Test Product With Badge & Tags',
      mrp: 500,
      discount: 20,
      price: 400,
      category_id: 'toys',
      badge: 'TOP PICK',
      tags: ['toys', 'fun', 'kids', 'gift'],
      image_url: '/images/products/test.webp',
      stock: 50,
      is_active: false
    };

    // 1. Create product with badge and tags
    const createRes = await createProduct({
      request: new Request('http://localhost:4321/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload)
      })
    } as any);

    assert.equal(createRes.status, 200);
    const createBody = await createRes.json();
    assert.equal(createBody.success, true);
    assert.equal(createBody.id, testProdId);

    // Verify in database
    if (supabase) {
      const { data: dbItem } = await supabase.from('products').select('*').eq('id', testProdId).single();
      assert.ok(dbItem, 'Product must exist in DB');
      assert.equal(dbItem.badge, 'TOP PICK', 'Badge must match TOP PICK');
      assert.deepEqual(dbItem.tags, ['toys', 'fun', 'kids', 'gift'], 'Tags must match payload array');
    }

    // 2. Delete product
    const deleteRes = await deleteProduct({
      request: new Request(`http://localhost:4321/api/products?id=${testProdId}`, {
        method: 'DELETE'
      })
    } as any);

    assert.equal(deleteRes.status, 200);
    const deleteBody = await deleteRes.json();
    assert.equal(deleteBody.success, true);
  });

  it('POST /api/categories and DELETE /api/categories should operate without shop_slug', async () => {
    const testCatId = `test_cat_${Date.now()}`;
    const createPayload = {
      id: testCatId,
      label: 'Automated Test Category',
      image_url: '/images/placeholder.webp',
      sort_order: 99
    };

    // 1. Create category
    const createRes = await createCategory({
      request: new Request('http://localhost:4321/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload)
      })
    } as any);

    assert.equal(createRes.status, 200);
    const createBody = await createRes.json();
    assert.equal(createBody.success, true);

    // 2. Delete category
    const deleteRes = await deleteCategory({
      request: new Request(`http://localhost:4321/api/categories?id=${testCatId}`, {
        method: 'DELETE'
      })
    } as any);

    assert.equal(deleteRes.status, 200);
    const deleteBody = await deleteRes.json();
    assert.equal(deleteBody.success, true);
  });

  it('STORE_CONFIG and getStoreConfigAsync should expose standardized phone 919014838640', async () => {
    const { STORE_CONFIG } = await import('../../src/core/config/store.config');
    const { getStoreConfigAsync } = await import('../../src/core/lib/getShopConfig');

    assert.equal(STORE_CONFIG.contact.phone, '919014838640');
    assert.equal(STORE_CONFIG.contact.whatsappNumber, '919014838640');
    assert.equal(STORE_CONFIG.contact.displayPhone, '+91 9014838640');
    assert.equal(STORE_CONFIG.contact.placeholderPhone, '9014838640');

    const shop = await getStoreConfigAsync();
    assert.ok(shop, 'shop config must not be null');
    assert.equal(shop.phone, '919014838640');
  });
});

