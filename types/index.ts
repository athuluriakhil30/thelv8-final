// Export Database types
export type { Database } from './database.types';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price?: number | null;
  cost_price?: number | null;
  category_id: string;
  category?: Category;
  images: string[];
  image_url?: string; // First image for backward compatibility
  colors: ProductColor[];
  sizes: string[];
  stock: number;
  stock_by_size?: Record<string, number>; // Stock per size: { "S": 10, "M": 15, "L": 20 }
  stock_by_color_size?: Record<string, Record<string, number>>; // Stock per color+size: { "blue": { "M": 10, "L": 5 }, "white": { "M": 8 } }
  sku: string;
  featured: boolean;
  published: boolean;
  new_arrival?: boolean; // New field for marking new arrivals
  collection_ids?: string[]; // Array of collection IDs this product belongs to
  shop_display_order?: number; // Display order in shop page (lower numbers appear first)
  new_arrival_display_order?: number; // Display order in new arrivals page (lower numbers appear first)
  created_at: string;
  updated_at: string;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role: 'customer' | 'admin';
  created_at: string;
  updated_at: string;
}

export type Profile = User;

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  street_address?: string; // Alias for address_line1
  address_type?: 'home' | 'work' | 'other';
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  selected_color: string;
  selected_size: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  price: number;
  selected_color: string;
  selected_size: string;
  sku: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: 'razorpay' | 'cod';
  payment_id?: string | null;
  subtotal: number;
  shipping_charge: number;
  tax: number;
  gst?: number; // Alias for tax
  discount: number;
  total: number;
  shipping_address: Address;
  address?: Address; // Alias for shipping_address
  items: OrderItem[];
  order_items?: OrderItem[]; // Alias for items
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product?: Product;
  created_at: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionProduct {
  collection_id: string;
  product_id: string;
  sort_order?: number;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  description?: string | null;
  content?: string | null;
  image_url?: string | null;
  button_text?: string | null;
  button_link?: string | null;
  is_active: boolean;
  valid_from: string;
  valid_until?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeasonalSetting {
  id: string;
  season: 'winter' | 'spring' | 'summer' | 'autumn';
  animation_type: 'snow' | 'rain' | 'leaves' | 'petals' | 'stars' | 'none';
  animation_intensity: 'light' | 'medium' | 'heavy';
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
}

// Indian States
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
] as const;

export type IndianState = typeof INDIAN_STATES[number];

export interface PaymentLog {
  id: string;
  payment_id: string;
  razorpay_order_id: string;
  order_id?: string | null;
  event_type: string;
  status: string;
  amount: number;
  currency: string;
  payment_method?: string | null;
  error_code?: string | null;
  error_description?: string | null;
  webhook_signature?: string | null;
  webhook_payload: any;
  verified: boolean;
  created_at: string;
}
