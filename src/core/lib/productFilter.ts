/**
 * src/core/lib/productFilter.ts
 *
 * Single Source of Truth for customer-facing storefront product visibility.
 * Enforces that products must be active AND have a verified, genuine image.
 */

export function isStorefrontProduct(p: any): boolean {
  if (!p) return false;
  
  // Must be active
  const isActive = p.is_active === true || (p.is_active !== false && p.is_active !== null);
  if (!isActive) return false;

  // Must have a valid, non-empty, genuine image (not placeholder)
  const imageUrl = typeof p.image_url === 'string' ? p.image_url.trim() : '';
  const hasImage = Boolean(
    imageUrl.length > 0 && 
    imageUrl !== '/images/placeholder.webp' &&
    !imageUrl.endsWith('/placeholder.webp')
  );

  return hasImage;
}
