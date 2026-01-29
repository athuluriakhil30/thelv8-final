# Advanced Coupon Rules System

## Overview

This system extends the existing coupon functionality with powerful rule-based discounts while maintaining **100% backward compatibility** with existing coupons.

## ✅ Key Features

- **Backward Compatible**: Existing coupons continue to work exactly as before
- **Buy X Get Y**: Complex "Buy 1 Get 1" scenarios
- **Category-Based Rules**: Target specific product categories
- **New Arrival Rules**: Special discounts for new arrival items
- **Multiple Rule Types**: Free items, fixed discounts, percentage discounts, bundle pricing
- **Priority System**: Control order of rule evaluation
- **Admin-Only Configuration**: All rules managed from admin panel
- **Dynamic Validation**: Real-time cart validation

---

## 📋 Database Schema

### New Tables

#### `coupon_rules`
Defines advanced rules for coupons.

**Key Columns:**
- `source_type`: What customer must buy (`category`, `new_arrival`, `category_new_arrival`, `any`)
- `source_category_id`: Category ID for source condition
- `source_new_arrival_required`: New arrival flag requirement
- `source_min_quantity`: Minimum items required
- `benefit_type`: Type of benefit (`free_items`, `fixed_discount`, `percentage_discount`, `bundle_price`)
- Target fields for defining what discount customer receives

#### `coupon_applications`
Tracks coupon usage for analytics.

### Extended Columns on `coupons`
- `allow_stacking`: Whether coupon can stack with others
- `max_applications_per_order`: How many times coupon applies per order
- `priority`: Evaluation priority

---

## 🎯 Supported Scenarios

### 1. Buy X Get Y (Same Category)
**Example**: Buy 1 T-Shirt, Get 1 Free (Cheapest)

```typescript
source_type: 'category'
source_category_id: '<tshirts-category-id>'
source_min_quantity: 1
benefit_type: 'free_items'
target_category_id: '<tshirts-category-id>'
free_quantity: 1
free_item_selection: 'cheapest'
free_discount_percentage: 100
```

### 2. Buy from Category, Get New Arrival Free
**Example**: Buy 2 from any category, get 1 new arrival free

```typescript
source_type: 'category'
source_category_id: '<category-id>'
source_min_quantity: 2
benefit_type: 'free_items'
target_new_arrival_required: true
free_quantity: 1
free_item_selection: 'cheapest'
```

### 3. Buy New Arrivals, Get Discount
**Example**: Buy 3 new arrivals, get ₹100 off

```typescript
source_type: 'new_arrival'
source_new_arrival_required: true
source_min_quantity: 3
benefit_type: 'fixed_discount'
discount_amount: 100
discount_target_type: 'source'
```

### 4. Category Percentage Discount
**Example**: Buy 2 from category, get 10% off those items

```typescript
source_type: 'category'
source_category_id: '<category-id>'
source_min_quantity: 2
benefit_type: 'percentage_discount'
discount_percentage: 10
discount_target_type: 'source'
```

### 5. Bundle Fixed Price
**Example**: Buy 3 items, pay only ₹999 total

```typescript
source_type: 'any'
source_min_quantity: 3
benefit_type: 'bundle_price'
bundle_fixed_price: 999
```

---

## 🔧 Implementation Guide

### 1. Run Database Migration

```bash
# Run the migration SQL file
psql -d your_database < migrations/015_add_advanced_coupon_rules.sql
```

Or use Supabase SQL editor to execute `015_add_advanced_coupon_rules.sql`

### 2. Admin Configuration

1. Go to **Admin Panel → Coupons**
2. Click the **gear icon (⚙️)** next to any coupon
3. Click **"Add Rule"**
4. Configure:
   - **Source Conditions**: What customer must buy
   - **Target Benefit**: What discount they receive
5. Save and activate

### 3. Testing

```typescript
// Example: Test coupon with cart items
const cartItems = [
  { product_id: '...', product: { category_id: '...', new_arrival: true, price: 499 }, quantity: 2 },
  // ... more items
];

const result = await couponService.validateCoupon('SAVE10', 1000, cartItems);

if (result.valid) {
  console.log('Discount:', result.discount);
  console.log('Applied Rules:', result.appliedRules);
  console.log('Breakdown:', result.breakdown);
}
```

---

## 📝 API Reference

### `couponRulesService`

#### `getCouponRules(couponId: string)`
Get all rules for a coupon.

#### `createCouponRule(ruleData: Partial<CouponRule>)`
Create a new rule.

#### `updateCouponRule(ruleId: string, updates: Partial<CouponRule>)`
Update existing rule.

#### `deleteCouponRule(ruleId: string)`
Delete a rule.

#### `validateAdvancedCoupon(code: string, cartItems: CartItem[], subtotal: number)`
Validate coupon with advanced rules.

### `couponService`

#### `validateCoupon(code: string, subtotal: number, cartItems?: CartItem[])`
Enhanced validation supporting both simple and advanced coupons.

**Returns**: `CouponValidationResult`
```typescript
{
  valid: boolean;
  message: string;
  discount?: number;
  coupon?: CouponWithRules;
  appliedRules?: AppliedCouponRule[];
  totalSavings?: number;
  breakdown?: {
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    appliedRuleCount: number;
    explanation: string;
  };
}
```

---

## 🔄 Validation Flow

```
1. User applies coupon code
       ↓
2. Check if coupon exists & is active
       ↓
3. Validate date range
       ↓
4. Check usage limits
       ↓
5. Load coupon rules
       ↓
6. IF no rules → Use simple discount logic (backward compatible)
   IF has rules → Evaluate each rule against cart
       ↓
7. Calculate discounts from applicable rules
       ↓
8. Return validation result with breakdown
```

---

## 🎨 UI Components

### Admin Panel
- **`/app/admin/coupons/[id]/rules/page.tsx`**: Rule management page
- **`/components/admin/CouponRuleForm.tsx`**: Rule creation/editing form

### Customer Facing
- Checkout page automatically uses advanced validation
- Detailed discount breakdown shown in toast notifications

---

## 🛡️ Backward Compatibility

### Existing Coupons
- Coupons without rules work exactly as before
- Simple discount logic (percentage/fixed) unchanged
- No migration needed for existing coupons

### Code Compatibility
```typescript
// Old code still works
await couponService.validateCoupon('SAVE10', 1000);

// New code with cart items
await couponService.validateCoupon('SAVE10', 1000, cartItems);
```

---

## 📊 Analytics

Track coupon usage with `coupon_applications` table:
- Which rules were applied
- Discount amounts
- Source and target items
- Timestamps

Query example:
```sql
SELECT 
  c.code,
  cr.rule_name,
  COUNT(*) as applications,
  SUM(ca.discount_amount) as total_discount
FROM coupon_applications ca
JOIN coupons c ON c.id = ca.coupon_id
LEFT JOIN coupon_rules cr ON cr.id = ca.rule_id
GROUP BY c.code, cr.rule_name
ORDER BY total_discount DESC;
```

---

## 🚀 Future Enhancements

Potential additions (not implemented):
- User-specific coupons
- Automatic coupon application
- Cart-wide combo rules
- Time-based rules (e.g., happy hour)
- Loyalty program integration
- A/B testing for coupon strategies

---

## 📖 Example Configurations

### Buy 1 Get 1 Free (Same Category)
```json
{
  "rule_name": "BOGO T-Shirts",
  "source_type": "category",
  "source_category_id": "3392e16c-d4e8-4720-b4ee-41b2209578c1",
  "source_min_quantity": 1,
  "benefit_type": "free_items",
  "target_category_id": "3392e16c-d4e8-4720-b4ee-41b2209578c1",
  "free_quantity": 1,
  "free_item_selection": "cheapest",
  "free_discount_percentage": 100
}
```

### Buy 2, Get New Arrival Free
```json
{
  "rule_name": "Buy 2 Get New Free",
  "source_type": "category",
  "source_category_id": "3392e16c-d4e8-4720-b4ee-41b2209578c1",
  "source_min_quantity": 2,
  "benefit_type": "free_items",
  "target_new_arrival_required": true,
  "free_quantity": 1,
  "free_item_selection": "cheapest",
  "free_discount_percentage": 100
}
```

### Buy 3 New Arrivals, Get ₹100 Off
```json
{
  "rule_name": "New Arrival Bundle Discount",
  "source_type": "new_arrival",
  "source_new_arrival_required": true,
  "source_min_quantity": 3,
  "benefit_type": "fixed_discount",
  "discount_amount": 100,
  "discount_target_type": "source"
}
```

---

## 🐛 Troubleshooting

### Rule Not Applying
1. Check rule is active (`is_active = true`)
2. Verify source conditions match cart items
3. Check minimum quantity is met
4. Ensure coupon itself is active and valid

### Discount Amount Wrong
1. Review `free_discount_percentage` for free items
2. Check `discount_target_type` for discount rules
3. Verify category IDs match

### Multiple Rules Conflict
1. Use `rule_priority` to control evaluation order
2. Set `max_applications_per_order` on coupon
3. Consider using `allow_stacking` flag

---

## 📞 Support

For issues or questions:
1. Check migration was applied successfully
2. Verify all TypeScript types are imported
3. Check browser console for validation errors
4. Review `coupon_applications` table for application history

---

## ✅ Checklist

- [x] Database migration applied
- [x] Admin UI configured
- [x] Test coupons created
- [x] Existing coupons still work
- [x] Checkout integration complete
- [x] Rules validated in cart

---

**Version**: 1.0.0  
**Date**: January 29, 2026  
**Backward Compatible**: ✅ Yes
