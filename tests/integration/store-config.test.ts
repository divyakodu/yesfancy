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

  it('should have exactly 543 total products and 190 active products', () => {
    assert.ok(store?.products, 'Products list must exist');
    const catalogProducts = store?.products.filter((p: any) => !p.id.startsWith('test_prod_'));
    assert.equal(catalogProducts?.length, 543, 'Total products in yesfancy-db must be 543');

    const activeProducts = catalogProducts?.filter((p: any) => p.is_active !== false);
    assert.equal(activeProducts?.length, 190, 'Active products in yesfancy-db must be 190');

    const draftProducts = catalogProducts?.filter((p: any) => p.is_active === false);
    assert.equal(draftProducts?.length, 353, 'Draft products in yesfancy-db must be 353');
  });

  it('all active products must have valid name, selling price > 0, and non-empty image_url', () => {
    const activeProducts = store?.products.filter((p: any) => p.is_active !== false) || [];
    for (const p of activeProducts) {
      assert.ok(p.name && p.name.trim().length > 0, `Active product ${p.id} must have a name`);
      assert.ok(Number(p.price) > 0, `Active product ${p.id} must have price > 0`);
      assert.ok(p.image_url && p.image_url.trim().length > 0, `Active product ${p.id} must have image_url`);
    }
  });

  it('should have exactly 3 hero slides configured', () => {
    assert.ok(store?.hero_slides, 'Hero slides must exist');
    assert.equal(store?.hero_slides.length, 3, 'Expected 3 hero slides in yesfancy-db');
  });
});
