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
  razorpay_order_id?: string | null; // Razorpay order ID for webhook reconciliation
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

// ============================================
// ADVANCED COUPON RULES SYSTEM
// ============================================

export type CouponSourceType = 'category' | 'new_arrival' | 'category_new_arrival' | 'any';
export type CouponBenefitType = 'free_items' | 'fixed_discount' | 'percentage_discount' | 'bundle_price';
export type FreeItemSelection = 'cheapest' | 'most_expensive' | 'customer_choice';
export type DiscountTargetType = 'source' | 'target' | 'cart';

export interface CouponRule {
  id: string;
  coupon_id: string;
  rule_name: string;
  rule_priority: number;
  is_active: boolean;
  
  // Source Conditions (What customer must buy)
  source_type: CouponSourceType;
  source_category_id?: string | null;
  source_new_arrival_required?: boolean | null;
  source_min_quantity: number;
  source_max_quantity?: number | null;
  source_min_amount?: number | null;
  
  // Target Benefit (What discount they receive)
  benefit_type: CouponBenefitType;
  
  // For free_items benefit
  target_category_id?: string | null;
  target_new_arrival_required?: boolean | null;
  free_quantity?: number | null;
  free_item_selection?: FreeItemSelection | null;
  free_discount_percentage?: number | null;
  
  // For discount benefits
  discount_amount?: number | null;
  discount_percentage?: number | null;
  discount_target_type?: DiscountTargetType | null;
  discount_target_category_id?: string | null;
  discount_target_new_arrival?: boolean | null;
  
  // For bundle pricing
  bundle_fixed_price?: number | null;
  
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CouponWithRules {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  allow_stacking: boolean;
  max_applications_per_order: number;
  priority: number;
  created_at: string;
  updated_at: string;
  rules?: CouponRule[];
}

// Alias for backward compatibility
export type Coupon = CouponWithRules;

export interface CouponApplication {
  id: string;
  coupon_id: string;
  order_id?: string | null;
  user_id?: string | null;
  rule_id?: string | null;
  discount_amount: number;
  original_amount: number;
  final_amount: number;
  source_items?: any;
  target_items?: any;
  rule_description?: string | null;
  applied_at: string;
}

export interface CouponValidationResult {
  valid: boolean;
  message: string;
  discount?: number;
  coupon?: CouponWithRules;
  appliedRules?: AppliedCouponRule[];
  totalSavings?: number;
  breakdown?: CouponBreakdown;
}

export interface AppliedCouponRule {
  ruleId: string;
  ruleName: string;
  ruleDescription: string;
  discountAmount: number;
  sourceItems: string[]; // Product IDs
  targetItems: string[]; // Product IDs
  benefitType: CouponBenefitType;
}

export interface CouponBreakdown {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  appliedRuleCount: number;
  explanation: string;
}
