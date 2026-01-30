# Available Coupons Component

A modular, reusable component to display active coupons with copy functionality.

## Features

- ✅ Fetches active coupons from database automatically
- ✅ Displays coupon details with attractive design
- ✅ Copy to clipboard functionality
- ✅ Visual feedback (checkmark when copied)
- ✅ Responsive design with light/dark mode support
- ✅ Two variants: `default` (detailed) and `compact` (minimal)
- ✅ Automatic icon selection based on coupon type
- ✅ Smart description generation

## Usage

### Basic Usage (Compact Variant)

```tsx
import { AvailableCoupons } from '@/components/coupons';

export default function CartPage() {
  return (
    <div>
      <AvailableCoupons 
        variant="compact"
        onCouponSelect={(code) => console.log('Copied:', code)}
      />
    </div>
  );
}
```

### Detailed Variant

```tsx
import { AvailableCoupons } from '@/components/coupons';

export default function CouponsPage() {
  return (
    <div>
      <AvailableCoupons 
        variant="default"
        onCouponSelect={(code) => {
          // Auto-apply coupon or show message
          toast.success(`Coupon ${code} ready to apply!`);
        }}
      />
    </div>
  );
}
```

### With Custom Styling

```tsx
<AvailableCoupons 
  variant="compact"
  className="my-8 max-w-md"
  onCouponSelect={(code) => {
    // Custom action when coupon is copied
    setCouponCode(code);
  }}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'compact'` | `'default'` | Display style |
| `onCouponSelect` | `(code: string) => void` | `undefined` | Callback when coupon is copied |
| `className` | `string` | `''` | Additional CSS classes |

## Variants

### Compact Variant
- Minimal design for sidebars
- Shows code, discount, and copy button
- Perfect for cart/checkout pages

### Default Variant
- Full details with description
- Decorative design elements
- Expiry date display
- Best for dedicated coupons page

## Coupon Types Supported

### 1. Fixed Discount (₹500 OFF)
```sql
INSERT INTO coupons (code, discount_type, discount_value, min_purchase_amount)
VALUES ('ESSENTIALS500', 'fixed', 500, 400);
```
Shows: Tag icon, "₹500 OFF"

### 2. Percentage Discount
```sql
INSERT INTO coupons (code, discount_type, discount_value)
VALUES ('SAVE20', 'percentage', 20);
```
Shows: Percent icon, "20% OFF"

### 3. Buy X Get Y Free (with Rules)
```sql
INSERT INTO coupons (code, discount_type, discount_value)
VALUES ('B2G1', 'fixed', 100);

INSERT INTO coupon_rules (coupon_id, benefit_type, description, ...)
VALUES (..., 'free_items', 'Buy 2 get 1 free', ...);
```
Shows: Gift icon, custom description

## Integration Points

### Current Implementation
- ✅ **Cart Page** (`app/cart/page.tsx`) - Compact variant in sidebar
- 🎯 **Checkout Page** - Can be added with auto-apply functionality
- 🎯 **Shop Page** - Can show as promotional banner
- 🎯 **Dedicated Coupons Page** - Full variant with all details

### Future Enhancements
1. **Auto-apply**: Automatically apply copied coupon at checkout
2. **Filtering**: Filter by category/product compatibility
3. **Countdown**: Show time remaining for expiring coupons
4. **Animation**: Celebrate when coupon is applied successfully
5. **Terms & Conditions**: Expandable section for detailed rules

## File Structure

```
components/
  coupons/
    AvailableCoupons.tsx  # Main component
    index.ts              # Barrel export
```

## Dependencies

- `services/coupon.service.ts` - For fetching active coupons
- `@/types` - Coupon type definitions
- `lucide-react` - Icons (Copy, Check, Tag, Gift, Percent)
- `components/ui/button` - Button component

## Example Output

### Compact Variant
```
┌────────────────────────────────────────┐
│ Available Coupons                      │
├────────────────────────────────────────┤
│ 🎁 ESSENTIALS500  ₹500 OFF   [Copy]   │
│ 🎁 B2G1           ₹100 OFF   [Copy]   │
└────────────────────────────────────────┘
```

### Default Variant
```
┌───────────────────────────────────────────┐
│ 🏷️ Available Coupons                     │
├───────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐  │
│ │ 🏷️  ₹500 OFF                       │  │
│ │    Valid until Mar 1, 2026          │  │
│ │                                      │  │
│ │ On orders above ₹400                │  │
│ │                                      │  │
│ │ ┌──────────────┐  [Copy Code]     │  │
│ │ │ ESSENTIALS500│                   │  │
│ │ └──────────────┘                   │  │
│ └─────────────────────────────────────┘  │
└───────────────────────────────────────────┘
```

## Maintenance Notes

- Coupons are fetched from `coupons` table using `getActiveCoupons()`
- Only shows coupons where `is_active = true` and within validity period
- Supports both simple coupons and advanced rule-based coupons
- Automatically handles coupon rules for description generation
- Copy functionality uses Web Clipboard API with fallback
