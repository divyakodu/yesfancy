export const prerender = false;

import type { APIRoute } from 'astro';
import { supabase, isSupabaseConfigured } from '@lib/supabase';

export const GET: APIRoute = async () => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && orders) {
        return new Response(JSON.stringify({ orders }), { status: 200 });
      }
    } catch (e) {}
  }

  return new Response(JSON.stringify({ orders: [] }), { status: 200 });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { order_id, customer_name, phone, address, items, total, status } = body;

    const generatedOrderId = order_id || `YF-${Date.now().toString(36).toUpperCase()}`;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .upsert({
          order_id: generatedOrderId,
          customer_name: customer_name || 'Valued Customer',
          phone: phone || '',
          address: address || '',
          items: items || [],
          total: Number(total || 0),
          status: status || 'Order Placed & Processing'
        }, { onConflict: 'order_id' })
        .select()
        .single();

      if (!error) {
        return new Response(JSON.stringify({ success: true, order: data }), { status: 200 });
      } else {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      }
    }

    return new Response(JSON.stringify({ success: true, order: { order_id: generatedOrderId } }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
