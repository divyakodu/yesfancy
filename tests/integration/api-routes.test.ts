import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GET as getOrders, POST as createOrder } from '../../src/pages/api/orders';
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

  it('POST /api/products and DELETE /api/products should operate without shop_slug', async () => {
    const testProdId = `test_prod_${Date.now()}`;
    const createPayload = {
      id: testProdId,
      name: 'Automated Test Product',
      mrp: 500,
      discount: 20,
      price: 400,
      category_id: 'toys',
      image_url: '/images/placeholder.webp',
      stock: 50,
      is_active: false
    };

    // 1. Create product
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
});
