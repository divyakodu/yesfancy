export const prerender = false;

import type { APIRoute } from 'astro';
import { supabase, isSupabaseConfigured } from '@lib/supabase';
import { uploadAsset } from '@lib/storage';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { 
      name,
      phone, 
      announcement_text, 
      tagline,
      logo_url,
      logo_text,
      primary_color, 
      secondary_color, 
      accent_color,
      font_title,
      font_body,
      features_ticker
    } = body;

    let publicLogoUrl = logo_url;
    if (logo_url && logo_url.startsWith('data:image')) {
      publicLogoUrl = await uploadAsset('banners', logo_url, `logo_${Date.now()}`);
    }

    if (isSupabaseConfigured && supabase) {
      const updatePayload: Record<string, any> = {
        id: 'default',
        updated_at: new Date().toISOString()
      };
      if (name) updatePayload.name = name;
      if (phone) updatePayload.phone = phone;
      if (announcement_text) updatePayload.announcement_text = announcement_text;
      if (tagline) updatePayload.tagline = tagline;
      if (publicLogoUrl) updatePayload.logo_url = publicLogoUrl;
      if (logo_text) updatePayload.logo_text = logo_text;
      if (primary_color) updatePayload.primary_color = primary_color;
      if (secondary_color) updatePayload.secondary_color = secondary_color;
      if (accent_color) updatePayload.accent_color = accent_color;
      if (font_title) updatePayload.font_title = font_title;
      if (font_body) updatePayload.font_body = font_body;
      if (features_ticker) updatePayload.features_ticker = features_ticker;

      const { error } = await supabase
        .from('store_settings')
        .upsert(updatePayload, { onConflict: 'id' });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
