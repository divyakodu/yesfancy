import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getStoreConfigAsync } from '../../src/core/lib/getShopConfig';

describe('Gate 2: Database Data Parity & Store Config (Integration Tests)', async () => {
  const store = await getStoreConfigAsync();

  it('should successfully connect to yesfancy-db and load store config', () => {
    assert.ok(store, 'Store config must not be null');
    assert.equal(store?.id, 'yesfancy');
    assert.equal(store?.name, 'Yes Fancy');
  });

  it('should have all 8 expected categories loaded with valid sort order', () => {
    assert.ok(store?.categories, 'Categories must exist');
    assert.equal(store?.categories.length, 8, 'Expected 8 categories in yesfancy-db');
    
    const catIds = store?.categories.map(c => c.id);
    const expectedCategories = ['all', 'fashion', 'novelties', 'decor', 'games', 'toys', 'lunchbox', 'stem_toys'];
    expectedCategories.forEach(expectedId => {
      assert.ok(catIds?.includes(expectedId), `Missing category: ${expectedId}`);
    });
  });

  it('should have exactly 543 total products, 189 active products, and 354 draft products', () => {
    assert.ok(store?.products, 'Products list must exist');
    const catalogProducts = store?.products.filter((p: any) => !p.id.startsWith('test_prod_'));
    assert.equal(catalogProducts?.length, 543, 'Total products in yesfancy-db must be 543');

    const activeProducts = catalogProducts?.filter((p: any) => p.is_active !== false);
    assert.equal(activeProducts?.length, 189, 'Active products in yesfancy-db must be 189');

    const draftProducts = catalogProducts?.filter((p: any) => p.is_active === false);
    assert.equal(draftProducts?.length, 354, 'Draft products in yesfancy-db must be 354');
  });

  it('all active storefront products must have valid name, selling price > 0, and non-empty image_url', async () => {
    const { isStorefrontProduct } = await import('../../src/core/lib/productFilter');
    const activeProducts = store?.products.filter(isStorefrontProduct) || [];
    assert.equal(activeProducts.length, 189, 'Storefront active products must be exactly 189');
    for (const p of activeProducts) {
      assert.ok(p.name && p.name.trim().length > 0, `Active product ${p.id} must have a name`);
      assert.ok(Number(p.price) > 0, `Active product ${p.id} must have price > 0`);
      assert.ok(p.image_url && p.image_url.trim().length > 0, `Active product ${p.id} must have image_url`);
      assert.notEqual(p.image_url, '/images/placeholder.webp', `Active product ${p.id} must not have placeholder`);
    }
  });

  it('should have exactly 3 hero slides configured linking to specific categories', () => {
    assert.ok(store?.hero_slides, 'Hero slides must exist');
    assert.equal(store?.hero_slides.length, 3, 'Expected 3 hero slides in yesfancy-db');

    const links = store.hero_slides.map((s: any) => s.link);
    assert.ok(links[0].includes('category=fashion'), 'Slide 1 must link to fashion');
    assert.ok(links[1].includes('category=novelties'), 'Slide 2 must link to novelties');
    assert.ok(links[2].includes('category=decor'), 'Slide 3 must link to decor');
    for (const link of links) {
      assert.notEqual(link, '/catalog?category=all', 'Hero slide must not default to category=all');
    }
  });
});
