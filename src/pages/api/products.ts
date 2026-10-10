export const prerender = false;

import type { APIRoute } from 'astro';
import { supabase, isSupabaseConfigured } from '@lib/supabase';
import { uploadAsset } from '@lib/storage';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, name, price, discount, mrp, category_id, badge, tags, image_url, stock, is_active } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: 'Missing product name' }), { status: 400 });
    }

    const prodId = id || `prod_${Date.now()}`;

    // Upload photo to Supabase Storage isolated under product-images/yesfancy/products/
    let publicCloudUrl = image_url;
    if (image_url && image_url.startsWith('data:image')) {
      publicCloudUrl = await uploadAsset('products', image_url, prodId);
    }

    const stockQty = stock !== undefined ? Number(stock) : 100;
    const finalMrp = Number(mrp || price || 0);
    const finalDiscount = discount !== undefined ? Number(discount) : (price && finalMrp > Number(price) ? Math.round(((finalMrp - Number(price)) / finalMrp) * 100) : 0);
    const finalPrice = Math.round(finalMrp * (1 - finalDiscount / 100));

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('products')
        .upsert({
          id: prodId,
          category_id: category_id || 'all',
          name,
          discount: finalDiscount,
          price: finalPrice,
          mrp: finalMrp,
          image_url: publicCloudUrl,
          badge: badge || null,
          tags: Array.isArray(tags) ? tags : [category_id || 'all'],
          stock: stockQty,
          is_active: is_active !== undefined ? Boolean(is_active) : true
        }, { onConflict: 'id' });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      }

      return new Response(JSON.stringify({ success: true, id: prodId, image_url: publicCloudUrl, stock: stockQty }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: true, id: prodId, image_url: publicCloudUrl, stock: stockQty }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    let ids: string[] = [];

    const queryId = url.searchParams.get('id');
    const queryIds = url.searchParams.get('ids');

    if (queryId) ids = [queryId];
    else if (queryIds) ids = queryIds.split(',').map(s => s.trim()).filter(Boolean);
    else {
      try {
        const body = await request.json();
        if (body.ids && Array.isArray(body.ids)) ids = body.ids;
        else if (body.id) ids = [body.id];
      } catch (e) {}
    }

    if (ids.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing product ids' }), { status: 400 });
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', ids);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      }
    }

    return new Response(JSON.stringify({ success: true, count: ids.length, ids }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, ids, is_active, stock } = body;
    const targetIds = Array.isArray(ids) ? ids : (id ? [id] : []);

    if (targetIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing product id(s)' }), { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (is_active !== undefined) updates.is_active = Boolean(is_active);
    if (stock !== undefined) updates.stock = Number(stock);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .in('id', targetIds);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      }
    }

    return new Response(JSON.stringify({ success: true, count: targetIds.length, ids: targetIds, updates }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
