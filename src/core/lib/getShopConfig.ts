import { createClient } from '@supabase/supabase-js';
import { STORE_CONFIG } from '../config/store.config';

function getSupabaseClient() {
  const url = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.PUBLIC_SUPABASE_URL : null) 
    || (typeof process !== 'undefined' && process.env ? process.env.PUBLIC_SUPABASE_URL : null)
    || 'https://ebsrmjnegdhpnlbxcxfm.supabase.co';
    
  const key = (typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY) : null) 
    || (typeof process !== 'undefined' && process.env ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY) : null)
    || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVic3Jtam5lZ2RocG5sYnhjeGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MTY0MDAsImV4cCI6MjEwNzE5MjQwMH0.zP6UtvlbN3Hx8E2MbMcNk9fx4JUQpdCqrrvigytIN7M';

  if (url && key) {
    return createClient(url, key);
  }
  return null;
}

const defaultOfferSlides = [
  {
    id: "slide_beauty_lifestyle",
    title: "BEAUTY & LIFESTYLE",
    subtitle: "Curated luxury fragrances, fine jewellery & premium personal care.",
    image_url: "/images/offer_beauty_lifestyle.webp",
    tag_id: "fashion",
    link: "/catalog?category=fashion"
  },
  {
    id: "slide_gift_store",
    title: "FESTIVE GIFT STORE",
    subtitle: "Curated luxury hampers, fancy boxes & novelties for every occasion.",
    image_url: "/images/offer_gift_store.webp",
    tag_id: "novelties",
    link: "/catalog?category=novelties"
  },
  {
    id: "slide_home_decor",
    title: "MODERN HOME & DECOR",
    subtitle: "Fancy minimal interiors, designer lamps & contemporary living accents.",
    image_url: "/images/offer_home_decor.webp",
    tag_id: "decor",
    link: "/catalog?category=decor"
  },
  {
    id: "slide_games",
    title: "GAMES & PUZZLES",
    subtitle: "Interactive arcade labyrinths, marble runs & brain exercising games.",
    image_url: "/images/offer_games.webp",
    tag_id: "games",
    link: "/catalog?category=games"
  },
  {
    id: "slide_toys",
    title: "ACTION TOYS & ROBOTICS",
    subtitle: "Functional hydraulic crane kits, robotic arms & mechanical dynamic machines.",
    image_url: "/images/offer_toys.webp",
    tag_id: "toys",
    link: "/catalog?category=toys"
  },
  {
    id: "slide_lunchbox",
    title: "MODERN LUNCH BOXES",
    subtitle: "Insulated food carriers, stylish lunch sets & travel containers.",
    image_url: "/images/offer_lunch_boxes.webp",
    tag_id: "lunchbox",
    link: "/catalog?category=lunchbox"
  }
];

export const ORIGINAL_YESFANCY_CATEGORIES = [
  { id: 'all', label: 'All Products', sort_order: 0 },
  { id: 'fashion', label: 'Beauty & Lifestyle', sort_order: 1 },
  { id: 'novelties', label: 'Gift Store', sort_order: 2 },
  { id: 'decor', label: 'Home & Decor', sort_order: 3 },
  { id: 'games', label: 'Games', sort_order: 4 },
  { id: 'toys', label: 'Toys', sort_order: 5 },
  { id: 'lunchbox', label: 'Lunch Boxes', sort_order: 6 },
  { id: 'stem_toys', label: 'STEM & Robotics', sort_order: 7 }
];

export interface StoreConfig {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  template: string;
  phone: string;
  announcement_text: string;
  logo_url: string;
  logo_animated_url: string;
  logo_text: string;
  features_ticker: Array<{ label: string; icon: string }>;
  hero_slides: any[];
  theme: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_title: string;
    font_body: string;
  };
  tags: any[];
  categories: any[];
  products: any[];
  carousels: {
    hero: any[];
  };
}

/**
 * Direct single-store configuration loader for Yes Fancy.
 * Reads directly from single-store tables in yesfancy-db.
 */
export async function getStoreConfigAsync(): Promise<StoreConfig | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    // 1. Fetch store settings
    const { data: settings } = await supabase
      .from('store_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    // 2. Fetch categories
    const { data: dbCategories } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    const categories = (dbCategories && dbCategories.length > 0)
      ? dbCategories.map(c => ({
          id: c.id,
          label: c.label,
          tag: c.tag || c.id,
          image_url: c.image_url || '',
          sort_order: c.sort_order ?? 0
        }))
      : ORIGINAL_YESFANCY_CATEGORIES;

    // 3. Fetch products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    // 4. Fetch hero slides
    const { data: dbSlides } = await supabase
      .from('hero_slides')
      .select('*')
      .order('sort_order', { ascending: true });

    const heroSlides = (dbSlides && dbSlides.length > 0)
      ? dbSlides.map(s => ({
          ...s,
          link: s.cta_link?.startsWith('/') ? s.cta_link : `/catalog?category=${s.cta_link || 'all'}`
        }))
      : defaultOfferSlides;

    const defaultTicker = [
      { label: "Easy Return", icon: "return" },
      { label: "Quality Assured", icon: "quality" },
      { label: "Satisfied Customers", icon: "heart" },
      { label: "Express Dispatch", icon: "dispatch" }
    ];

    return {
      id: STORE_CONFIG.id,
      slug: STORE_CONFIG.slug,
      name: settings?.name || STORE_CONFIG.name,
      tagline: settings?.tagline || STORE_CONFIG.tagline,
      category: STORE_CONFIG.category,
      template: STORE_CONFIG.template,
      phone: settings?.phone || STORE_CONFIG.contact.phone,
      announcement_text: settings?.announcement_text || STORE_CONFIG.announcement.text,
      logo_url: settings?.logo_url || STORE_CONFIG.branding.logoUrl,
      logo_animated_url: settings?.logo_animated_url || STORE_CONFIG.branding.logoAnimatedUrl,
      logo_text: settings?.logo_text || STORE_CONFIG.branding.logoText,
      features_ticker: settings?.features_ticker || STORE_CONFIG.featuresTicker,
      hero_slides: heroSlides,
      theme: {
        primary_color: settings?.primary_color || STORE_CONFIG.theme.primaryColor,
        secondary_color: settings?.secondary_color || STORE_CONFIG.theme.secondaryColor,
        accent_color: settings?.accent_color || STORE_CONFIG.theme.accentColor,
        font_title: settings?.font_title || STORE_CONFIG.theme.fontTitle,
        font_body: settings?.font_body || STORE_CONFIG.theme.fontBody
      },
      tags: categories,
      categories: categories,
      products: (products || []).map((p: any) => ({
        ...p,
        image_url: p.image_url && p.image_url.trim().length > 0 ? p.image_url : '/images/placeholder.webp'
      })),
      carousels: {
        hero: heroSlides
      }
    };
  } catch (e) {
    console.error('Error fetching store config:', e);
    return null;
  }
}

/**
 * Backward compatibility loader. Returns { shop: storeConfig }.
 */
export async function getShopConfigAsync(_slug?: string) {
  const store = await getStoreConfigAsync();
  if (!store) return null;
  return { shop: store };
}

/**
 * Backward compatibility loader for any legacy loop callers.
 */
export async function getAllShopsConfigAsync() {
  const store = await getStoreConfigAsync();
  return store ? [store] : [];
}
