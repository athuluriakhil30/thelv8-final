# Quick Start: Advanced Coupon Rules

## 🚀 Setup (5 Minutes)

### Step 1: Run Database Migration
```bash
# In Supabase SQL Editor, run:
# File: migrations/015_add_advanced_coupon_rules.sql
```

Or via command line:
```bash
psql -h your-db-host -U your-user -d your-database -f migrations/015_add_advanced_coupon_rules.sql
```

### Step 2: Verify Tables Created
Check these tables exist:
- `coupon_rules`
- `coupon_applications`

### Step 3: Test Existing Coupons
All existing coupons should work without changes:
```sql
SELECT * FROM coupons WHERE code IN ('SAVE10', 'SAVE100');
```

---

## 🎯 Creating Your First Advanced Rule

### Example: Buy 1 Get 1 Free (T-Shirts)

#### 1. Get Your Category ID
```sql
SELECT id, name FROM categories WHERE slug = 'tshirts';
-- Copy the ID: 3392e16c-d4e8-4720-b4ee-41b2209578c1
```

#### 2. Create/Use a Coupon
Go to **Admin → Coupons** and create coupon code `BOGO`

#### 3. Add Advanced Rule
1. Click **⚙️ gear icon** next to `BOGO` coupon
2. Click **"Add Rule"**
3. Fill in:
   - **Rule Name**: "Buy 1 Get 1 Free T-Shirts"
   - **Source Type**: Category
   - **Category**: T-Shirts
   - **Minimum Quantity**: 1
   - **Benefit Type**: Free Items
   - **Target Category**: T-Shirts (same)
   - **Free Quantity**: 1
   - **Selection**: Cheapest
   - **Discount %**: 100
4. Click **Save Rule**

#### 4. Test It
1. Add 2 T-shirts to cart (e.g., ₹499 each)
2. Go to checkout
3. Apply coupon code: `BOGO`
4. See discount: ₹499 (cheapest item free)

---

## 📘 Common Scenarios

### Scenario 1: Buy 2 from Category, Get 1 New Arrival Free

```
Source Conditions:
- Source Type: Category
- Category: [Select category]
- Min Quantity: 2

Target Benefit:
- Benefit Type: Free Items
- Target New Arrival: Yes (New Arrivals Only)
- Free Quantity: 1
- Selection: Cheapest
- Discount %: 100
```

### Scenario 2: Buy 3 New Arrivals, Get ₹100 Off

```
Source Conditions:
- Source Type: New Arrival Status
- New Arrival Required: Yes
- Min Quantity: 3

Target Benefit:
- Benefit Type: Fixed Discount
- Discount Amount: 100
- Apply To: Source Items
```

### Scenario 3: Buy 3 Items, Get 10% Off

```
Source Conditions:
- Source Type: Any Product
- Min Quantity: 3

Target Benefit:
- Benefit Type: Percentage Discount
- Discount %: 10
- Apply To: Cart
```

---

## 🔍 Testing Checklist

- [ ] Existing simple coupons still work
- [ ] New rule-based coupon validates correctly
- [ ] Discount amount is accurate
- [ ] Toast shows detailed breakdown
- [ ] Rule appears in admin panel
- [ ] Can edit/delete rules
- [ ] Inactive rules don't apply

---

## 🐛 Common Issues

### Issue: Rule not applying
**Solution**: Check that:
- Rule is active (toggle is ON)
- Cart has required items
- Coupon code is correct
- Coupon itself is active

### Issue: Wrong discount amount
**Solution**: Verify:
- Free discount percentage (default 100%)
- Discount target type (source/target/cart)
- Category IDs match

### Issue: Can't see rules button
**Solution**: 
- Refresh admin coupons page
- Check you're logged in as admin
- Look for ⚙️ gear icon in Actions column

---

## 📊 View Applied Rules

Check what rules were applied:
```sql
SELECT 
  ca.*,
  c.code as coupon_code,
  cr.rule_name
FROM coupon_applications ca
JOIN coupons c ON c.id = ca.coupon_id
LEFT JOIN coupon_rules cr ON cr.id = ca.rule_id
ORDER BY ca.applied_at DESC
LIMIT 10;
```

---

## 🎓 Next Steps

1. Create multiple rules for one coupon (e.g., BOGO + 10% off)
2. Use priority to control rule order
3. Set max applications per order
4. Enable/disable rules without deleting
5. Track analytics in coupon_applications table

---

## 💡 Pro Tips

- **Start Simple**: Test with one rule before adding multiple
- **Use Priorities**: Higher priority = evaluated first
- **Test Thoroughly**: Add items to cart and test all scenarios
- **Monitor Usage**: Check coupon_applications for insights
- **Inactive Rules**: Keep rules disabled instead of deleting for history

---

## 📞 Need Help?

- Review full docs: `ADVANCED_COUPON_RULES.md`
- Check database schema: `migrations/015_add_advanced_coupon_rules.sql`
- View types: `types/index.ts` (search for CouponRule)
- Service logic: `services/coupon-rules.service.ts`

---

**That's it!** You now have a powerful coupon rules system. 🎉
