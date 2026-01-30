# Coupons Integration Guide

## Quick Integration Examples

### 1. Cart Page (✅ Already Integrated)
```tsx
// app/cart/page.tsx
import { AvailableCoupons } from '@/components/coupons';

<div className="lg:col-span-1 space-y-6">
  {/* Available Coupons */}
  <div className="bg-white rounded-2xl p-6 shadow-md">
    <AvailableCoupons 
      variant="compact"
      onCouponSelect={(code) => toast.success(`Coupon ${code} copied!`)}
    />
  </div>
  
  {/* Order Summary */}
  <div className="bg-white rounded-2xl p-8 shadow-md sticky top-24">
    ...
  </div>
</div>
```

### 2. Checkout Page (Recommended)
```tsx
// app/checkout/page.tsx
import { AvailableCoupons } from '@/components/coupons';
import { useState } from 'react';

export default function CheckoutPage() {
  const [couponCode, setCouponCode] = useState('');

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Left: Shipping & Payment */}
      <div className="lg:col-span-2">
        ...
      </div>

      {/* Right: Order Summary + Coupons */}
      <div className="space-y-6">
        {/* Available Coupons */}
        <AvailableCoupons 
          variant="compact"
          onCouponSelect={(code) => {
            setCouponCode(code);
            // Auto-fill the coupon input field
            document.getElementById('coupon-input')?.value = code;
            toast.success('Coupon code filled! Click apply.');
          }}
        />

        {/* Order Summary with Coupon Input */}
        <div className="bg-white p-6 rounded-xl">
          <h3>Have a Coupon?</h3>
          <input 
            id="coupon-input"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Enter coupon code"
          />
          <button onClick={applyCoupon}>Apply</button>
        </div>
      </div>
    </div>
  );
}
```

### 3. Shop Page Banner (Optional)
```tsx
// app/shop/page.tsx
import { AvailableCoupons } from '@/components/coupons';

export default function ShopPage() {
  return (
    <div>
      {/* Hero/Banner */}
      <section className="py-8 bg-amber-50 dark:bg-amber-950/20">
        <div className="max-w-4xl mx-auto px-6">
          <AvailableCoupons 
            variant="compact"
            className="max-w-2xl mx-auto"
          />
        </div>
      </section>

      {/* Products Grid */}
      <section>
        ...
      </section>
    </div>
  );
}
```

### 4. Dedicated Coupons Page (Full Experience)
```tsx
// app/coupons/page.tsx
import { AvailableCoupons } from '@/components/coupons';

export default function CouponsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-4">Available Offers</h1>
        <p className="text-stone-600 mb-8">
          Save more with our exclusive coupon codes
        </p>

        <AvailableCoupons 
          variant="default"
          onCouponSelect={(code) => {
            toast.success(`${code} copied to clipboard!`, {
              description: 'Apply at checkout to get your discount'
            });
          }}
        />
      </div>
    </div>
  );
}
```

### 5. Product Page (Cross-sell)
```tsx
// app/product/[id]/page.tsx
import { AvailableCoupons } from '@/components/coupons';

export default function ProductPage() {
  return (
    <div>
      {/* Product Details */}
      <div className="grid lg:grid-cols-2 gap-12">
        ...
      </div>

      {/* Related Products & Coupons */}
      <section className="mt-16">
        <div className="bg-stone-50 dark:bg-stone-900 p-8 rounded-2xl">
          <h2 className="text-2xl font-bold mb-6">Save More</h2>
          <AvailableCoupons variant="compact" />
        </div>
      </section>
    </div>
  );
}
```

### 6. Homepage Announcement (Promotional)
```tsx
// app/page.tsx
import { AvailableCoupons } from '@/components/coupons';

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section>...</section>

      {/* Special Offers Section */}
      <section className="py-16 bg-gradient-to-br from-amber-50 to-stone-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Special Offers</h2>
            <p className="text-stone-600">Exclusive deals just for you</p>
          </div>
          
          <AvailableCoupons 
            variant="default"
            className="max-w-3xl mx-auto"
          />
        </div>
      </section>

      {/* Featured Products */}
      <section>...</section>
    </div>
  );
}
```

## Pro Tips

### Auto-Apply Feature
```tsx
const handleCouponSelect = async (code: string) => {
  // Copy to clipboard
  await navigator.clipboard.writeText(code);
  
  // Auto-apply if in checkout
  if (isCheckoutPage) {
    await applyCoupon(code);
    toast.success('Coupon applied successfully!');
  } else {
    // Navigate to checkout with coupon
    router.push(`/checkout?coupon=${code}`);
  }
};
```

### Sticky Sidebar
```tsx
<div className="sticky top-24 space-y-6">
  <AvailableCoupons variant="compact" />
  <OrderSummary />
</div>
```

### Modal/Popup
```tsx
import { Dialog } from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger>View Offers</DialogTrigger>
  <DialogContent>
    <AvailableCoupons variant="default" />
  </DialogContent>
</Dialog>
```

### Mobile Bottom Sheet
```tsx
import { Sheet } from '@/components/ui/sheet';

<Sheet>
  <SheetTrigger>🎁 View Coupons</SheetTrigger>
  <SheetContent side="bottom">
    <AvailableCoupons variant="compact" />
  </SheetContent>
</Sheet>
```

## Best Practices

1. **Placement Priority**:
   - ✅ Cart page (sidebar)
   - ✅ Checkout page (before payment)
   - ⭐ Shop page (banner)
   - ⭐ Product page (cross-sell)

2. **Variant Selection**:
   - Use `compact` for sidebars, headers, footers
   - Use `default` for dedicated pages, main content areas

3. **User Experience**:
   - Show toast notification when copied
   - Auto-fill coupon input when available
   - Show success message when applied

4. **Performance**:
   - Component fetches coupons only once
   - Uses React state for updates
   - No unnecessary re-renders

5. **Accessibility**:
   - Copy button has proper labels
   - Keyboard navigation supported
   - Screen reader friendly
