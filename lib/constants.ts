export const SITE_CONFIG = {
  name: 'thelv8',
  description: 'Elevate Your Style - Premium clothing collections for the modern wardrobe',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  currency: 'INR',
  currencySymbol: '₹',
  locale: 'en-IN',
  country: 'India',
};

export const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
] as const;

export const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
] as const;

export const PAYMENT_METHODS = [
  { value: 'razorpay', label: 'Online Payment (Razorpay)' },
  { value: 'cod', label: 'Cash on Delivery' },
] as const;

export const PRODUCT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

export const DEFAULT_PRODUCT_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gray', hex: '#6B7280' },
  { name: 'Navy', hex: '#1E3A8A' },
  { name: 'Beige', hex: '#D4B996' },
  { name: 'Brown', hex: '#92400E' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Pink', hex: '#EC4899' },
] as const;

export const PAGINATION = {
  productsPerPage: 12,
  ordersPerPage: 10,
  usersPerPage: 20,
};

// Note: GST rate, shipping threshold, and shipping rate are now managed in database settings table
// Use settingsService.getSettings() to fetch these values
export const FREE_SHIPPING_THRESHOLD = 999; // Free shipping above ₹999 (fallback)
export const FLAT_SHIPPING_RATE = 50; // ₹50 flat shipping (fallback)

export const ADMIN_SIDEBAR_LINKS = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: 'LayoutDashboard',
  },
  {
    label: 'Products',
    href: '/admin/products',
    icon: 'Package',
  },
  {
    label: 'Categories',
    href: '/admin/categories',
    icon: 'Tags',
  },
  {
    label: 'Orders',
    href: '/admin/orders',
    icon: 'ShoppingCart',
  },
  {
    label: 'Customers',
    href: '/admin/customers',
    icon: 'Users',
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: 'Settings',
  },
] as const;
