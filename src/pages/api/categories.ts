export const prerender = false;

import type { APIRoute } from 'astro';
import { supabase, isSupabaseConfigured } from '@lib/supabase';
import { uploadAsset } from '@lib/storage';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, label, tag, image_url, sort_order } = body;

    if (!label) {
      return new Response(JSON.stringify({ error: 'Missing label parameter' }), { status: 400 });
    }

    const catId = (id && typeof id === 'string' && id.trim().length > 0) ? id.trim() : `cat_${Date.now()}`;

    let publicCloudUrl = image_url;
    if (image_url && image_url.startsWith('data:image')) {
      publicCloudUrl = await uploadAsset('categories', image_url, catId);
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('categories')
        .upsert({
          id: catId,
          label,
          image_url: publicCloudUrl || '/images/hero_banner.jpg',
          sort_order: sort_order !== undefined ? Number(sort_order) : 0
        }, { onConflict: 'id' });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      }

      return new Response(JSON.stringify({ success: true, image_url: publicCloudUrl, id: catId }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: true, image_url: publicCloudUrl, id: catId }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing category id' }), { status: 400 });
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      }
    }

    return new Response(JSON.stringify({ success: true, id }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
