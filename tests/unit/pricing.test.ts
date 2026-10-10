import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getSellingPrice, getSavingsAmount } from '../../src/core/lib/pricing';

describe('Gate 1: Pricing Calculations (Unit Tests)', () => {
  it('should correctly calculate selling price with standard discounts', () => {
    assert.equal(getSellingPrice(1000, 20), 800);
    assert.equal(getSellingPrice(500, 10), 450);
    assert.equal(getSellingPrice(2000, 50), 1000);
  });

  it('should correctly round odd amounts to the nearest rupee', () => {
    // 499 * 0.85 = 424.15 -> 424
    assert.equal(getSellingPrice(499, 15), 424);
    // 999 * 0.85 = 849.15 -> 849
    assert.equal(getSellingPrice(999, 15), 849);
    // 299 * 0.90 = 269.10 -> 269
    assert.equal(getSellingPrice(299, 10), 269);
  });

  it('should return exact MRP when discount is 0 or negative', () => {
    assert.equal(getSellingPrice(500, 0), 500);
    assert.equal(getSellingPrice(750, -5), 750);
  });

  it('should handle string inputs gracefully', () => {
    assert.equal(getSellingPrice('1000', '20'), 800);
    assert.equal(getSellingPrice('499', '15'), 424);
  });

  it('should return 0 when MRP is 0 or negative', () => {
    assert.equal(getSellingPrice(0, 20), 0);
    assert.equal(getSellingPrice(-100, 20), 0);
  });

  it('should correctly calculate savings amount across quantities', () => {
    // 1000 MRP - 800 price = 200 savings per item * 2 = 400
    assert.equal(getSavingsAmount(1000, 20, 2), 400);
    // No discount = 0 savings
    assert.equal(getSavingsAmount(500, 0, 3), 0);
    // 499 MRP - 424 price = 75 savings per item * 1 = 75
    assert.equal(getSavingsAmount(499, 15, 1), 75);
  });
});
