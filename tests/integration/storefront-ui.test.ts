import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Gate 4: Storefront UI Contracts & Modal Integrity (DOM Contract Tests)', () => {
  const storeHeaderPath = path.resolve(process.cwd(), 'src/core/components/StoreHeader.astro');
  const indexPagePath = path.resolve(process.cwd(), 'src/pages/index.astro');
  const catalogPagePath = path.resolve(process.cwd(), 'src/pages/catalog.astro');
  const productPagePath = path.resolve(process.cwd(), 'src/pages/product/[id].astro');

  it('StoreHeader must render explicit Track Order text button instead of raw person icon', () => {
    const content = fs.readFileSync(storeHeaderPath, 'utf-8');
    assert.ok(content.includes('Track Order'), 'StoreHeader must contain explicit "Track Order" label');
    assert.ok(content.includes('toggleTrackDrawer(true)'), 'StoreHeader must trigger toggleTrackDrawer');
    assert.ok(content.includes('📦'), 'StoreHeader must contain the package icon');
  });

  it('StoreHeader lookupOrderStatus must cap orders to 5 and support accordion toggling', () => {
    const content = fs.readFileSync(storeHeaderPath, 'utf-8');
    assert.ok(content.includes('foundOrders.slice(0, 5)'), 'Must cap orders to maximum of 5');
    assert.ok(content.includes('toggleOrderAccordion'), 'Must have accordion toggle function');
    assert.ok(content.includes('getStepperHtml'), 'Must render 4-step progress stepper');
  });

  it('All storefront pages (index, catalog, product) must contain the celebratory #order-success-modal', () => {
    [indexPagePath, catalogPagePath, productPagePath].forEach((filePath) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      assert.ok(content.includes('id="order-success-modal"'), `${path.basename(filePath)} must have #order-success-modal`);
      assert.ok(content.includes('id="success-order-id"'), `${path.basename(filePath)} must display #success-order-id`);
      assert.ok(content.includes('id="success-order-items"'), `${path.basename(filePath)} must display #success-order-items`);
      assert.ok(content.includes('id="success-order-total"'), `${path.basename(filePath)} must display #success-order-total`);
      assert.ok(content.includes('window.closeOrderSuccessModal'), `${path.basename(filePath)} must have closeOrderSuccessModal`);
    });
  });

  it('Index page cart must render structured item card layout matching admin design language', () => {
    const content = fs.readFileSync(indexPagePath, 'utf-8');
    assert.ok(content.includes('Subtotal ('), 'Cart items must show itemized subtotal breakdown');
    assert.ok(content.includes('bg-slate-50 border border-slate-200/80 rounded-xl'), 'Cart items must have structured card container');
  });
});
