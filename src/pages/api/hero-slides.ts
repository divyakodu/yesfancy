export const prerender = false;

import type { APIRoute } from 'astro';
import { supabase, isSupabaseConfigured } from '@lib/supabase';
import { uploadAsset } from '@lib/storage';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, title, subtitle, bg_gradient, cta_text, cta_link, image_url, sort_order } = body;

    let publicCloudUrl = image_url;
    if (image_url && image_url.startsWith('data:image')) {
      publicCloudUrl = await uploadAsset('banners', image_url, `hero_${Date.now()}`);
    }

    if (isSupabaseConfigured && supabase) {
      const slideId = id || `slide_${Date.now()}`;
      const { error } = await supabase
        .from('hero_slides')
        .upsert({
          id: slideId,
          title,
          subtitle,
          bg_gradient: bg_gradient || 'from-slate-900 to-teal-900',
          cta_text: cta_text || 'Explore Collection',
          cta_link: cta_link || 'all',
          image_url: publicCloudUrl,
          sort_order: sort_order !== undefined ? Number(sort_order) : 0
        }, { onConflict: 'id' });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      }

      return new Response(JSON.stringify({ success: true, id: slideId }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing slide id parameter' }), { status: 400 });
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('hero_slides')
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
