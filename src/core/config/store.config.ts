/**
 * src/core/config/store.config.ts
 *
 * Single Source of Truth for static store configuration, default branding,
 * contact details, and trailer/ticker metadata for Yes Fancy.
 */

export interface StoreFeatureTickerItem {
  label: string;
  icon: 'return' | 'quality' | 'heart' | 'dispatch' | string;
}

export interface StoreConfig {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  template: string;
  contact: {
    phone: string;
    displayPhone: string;
    placeholderPhone: string;
    whatsappNumber: string;
    email: string;
  };
  announcement: {
    text: string;
  };
  featuresTicker: StoreFeatureTickerItem[];
  branding: {
    logoUrl: string;
    logoAnimatedUrl: string;
    logoText: string;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontTitle: string;
    fontBody: string;
  };
}

export const STORE_CONFIG: StoreConfig = {
  id: 'yesfancy',
  slug: 'yesfancy',
  name: 'Yes Fancy',
  tagline: 'Curated Fancy Gifts, Toys, Games & Novelties',
  category: 'Gifts & Toys',
  template: 'GiftShopTemplate1',
  contact: {
    phone: '919014838640',
    displayPhone: '+91 9014838640',
    placeholderPhone: '9014838640',
    whatsappNumber: '919014838640',
    email: 'support@yesfancy.in'
  },
  announcement: {
    text: 'FREE SHIPPING ON ORDERS ABOVE ₹999 | EXPRESS STORE PICKUP'
  },
  featuresTicker: [
    { label: "Easy Return", icon: "return" },
    { label: "Quality Assured", icon: "quality" },
    { label: "Satisfied Customers", icon: "heart" },
    { label: "Express Dispatch", icon: "dispatch" }
  ],
  branding: {
    logoUrl: '/images/yes_fancy_icon_transparent.png',
    logoAnimatedUrl: '/images/yes_fancy_icon_animated.gif',
    logoText: 'Yes Fancy'
  },
  theme: {
    primaryColor: '#581C87',
    secondaryColor: '#D4AF37',
    accentColor: '#E11D48',
    fontTitle: 'Plus Jakarta Sans',
    fontBody: 'Plus Jakarta Sans'
  }
} as const;
