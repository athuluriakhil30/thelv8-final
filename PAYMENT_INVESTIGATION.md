# Payment Investigation & Resolution Guide

## 🔴 CRITICAL ISSUE DETECTED

### What Happened
Based on your console logs, here's the exact sequence of events:

1. ✅ **Order Created Successfully**
   - Order Number: `ORD202601285124`
   - Order UUID: `4b827752-8b93-4600-97df-dbebd6a8911c`
   - Stock decreased successfully

2. ✅ **Razorpay Order Created**
   - Razorpay Order ID: `order_S93Xw6YMKiGkwU`
   - Stored in database correctly

3. ❌ **Razorpay Server Error (500)**
   ```
   POST https://api.razorpay.com/v1/standard_checkout/checkout/order... 500 (Internal Server Error)
   ```
   - This is a **Razorpay internal server error**, not your code
   - Error occurred during payment modal interaction
   - Razorpay's servers failed to process the checkout request

4. ❓ **You Received Payment ID**
   - Payment ID: `pay_S93Y0v8cFh6N9o`
   - This suggests payment might have been captured despite the 500 error
   - Order status might not have been updated due to webhook failure

---

## 🚨 Immediate Actions Required

### Step 1: Check Order Status in Database
Run this query in your Supabase SQL editor:

```sql
SELECT 
    id,
    order_number,
    payment_status,
    payment_id,
    razorpay_order_id,
    status,
    total,
    created_at
FROM orders 
WHERE id = '4b827752-8b93-4600-97df-dbebd6a8911c';
```

**Expected Results:**
- If `payment_status = 'paid'` and `payment_id = 'pay_S93Y0v8cFh6N9o'` → **Webhook succeeded, order is complete**
- If `payment_status = 'pending'` and `payment_id IS NULL` → **Payment not recorded, needs verification**

---

### Step 2: Verify Payment with Razorpay Dashboard
1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to **Payments** section
3. Search for payment ID: `pay_S93Y0v8cFh6N9o`
4. Check payment status:
   - **Captured** → Money was received, order should be marked as paid
   - **Failed/Pending** → Payment didn't complete, order should be cancelled

---

### Step 3: Verify Payment via API (Automated)
Use the new verification endpoint I just created:

```bash
# Get your access token from browser dev tools (Application → Local Storage → supabase.auth.token)
curl -X POST https://your-domain.com/api/razorpay/verify-payment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "4b827752-8b93-4600-97df-dbebd6a8911c",
    "paymentId": "pay_S93Y0v8cFh6N9o"
  }'
```

**This endpoint will:**
- Check order status in your database
- Fetch payment status from Razorpay API
- Automatically update order if payment was captured
- Send confirmation email if payment is verified
- Return detailed status report

---

### Step 4: Check Webhook Logs
Run this query to see if webhook was received:

```sql
SELECT 
    payment_id,
    razorpay_order_id,
    event_type,
    status,
    verified,
    amount,
    created_at
FROM payment_logs 
WHERE razorpay_order_id = 'order_S93Xw6YMKiGkwU'
ORDER BY created_at DESC;
```

**Analysis:**
- **No rows** → Webhook never received (Razorpay server error prevented webhook)
- **Row with `verified = true`** → Webhook received, check why order wasn't updated
- **Row with `verified = false`** → Webhook received but signature invalid

---

## 🛠️ Resolution Scenarios

### Scenario A: Payment Captured But Order Not Updated

**If Razorpay shows payment as "Captured" but order is still "pending":**

1. **Immediate Fix (Manual)**:
```sql
UPDATE orders 
SET 
    payment_status = 'paid',
    payment_id = 'pay_S93Y0v8cFh6N9o',
    status = 'confirmed',
    updated_at = NOW()
WHERE id = '4b827752-8b93-4600-97df-dbebd6a8911c';
```

2. **Send confirmation email manually** via admin panel or run:
```typescript
// In Node.js console or admin script
import { emailClient } from '@/lib/email-client';
// Send email with order details
```

3. **Verify stock** - ensure it was decreased correctly

---

### Scenario B: Payment Failed But Stock Decreased

**If payment actually failed or was never captured:**

1. **Cancel order and restore stock**:
```sql
-- Check current stock first
SELECT * FROM products WHERE id IN (
    SELECT product_id FROM order_items WHERE order_id = '4b827752-8b93-4600-97df-dbebd6a8911c'
);

-- Cancel order (this will trigger stock restoration if you have the function)
UPDATE orders 
SET 
    status = 'cancelled',
    payment_status = 'failed',
    notes = 'Razorpay 500 error - payment not captured',
    updated_at = NOW()
WHERE id = '4b827752-8b93-4600-97df-dbebd6a8911c';

-- Manually restore stock if needed
SELECT increase_stock_by_color_size(
    'PRODUCT_UUID'::uuid,
    'COLOR',
    'SIZE',
    QUANTITY
);
```

2. **Notify customer**:
```
Subject: Payment Issue - Order ORD202601285124

Hi [Customer Name],

We noticed your payment encountered a technical issue (Payment ID: pay_S93Y0v8cFh6N9o).

Status: [CAPTURED/FAILED based on Razorpay dashboard]

Action Taken:
- If captured: Order has been confirmed and shipped
- If failed: Order cancelled and stock restored to cart

Please contact us if you have any questions.
```

---

## 🔧 Fixes Implemented

### 1. Enhanced Error Handling for Razorpay 500 Errors

**Location**: `app/checkout/page.tsx` (lines 688-750)

**What was added**:
- Error boundary around `razorpay.open()` to catch initialization errors
- 10-second timeout monitor for detecting stuck payment modals
- Automatic webhook check after timeout (waits 5s for delayed webhook)
- Intelligent decision:
  - If webhook arrives → redirect to success page
  - If no webhook → cancel order and restore stock
- User-friendly error messages for all failure scenarios

**Benefits**:
- Prevents orphaned orders (order created but payment failed)
- Automatic stock restoration on timeout
- Better user experience with clear error messages
- Handles Razorpay server errors gracefully

---

### 2. Manual Payment Verification Endpoint

**Location**: `app/api/razorpay/verify-payment/route.ts` (NEW FILE)

**Capabilities**:
- Verify payment status via Razorpay API
- Automatically update order if payment was captured
- Send confirmation email if verification succeeds
- Security: Only order owner or admin can verify
- Detailed response with payment and order status

**Use Cases**:
- When user completes payment but order status not updated
- When webhook fails due to server errors
- For manual reconciliation by support team
- For investigating payment discrepancies

---

## 📊 Monitoring & Prevention

### Enable These Logs

1. **Webhook Logs** (already enabled):
```typescript
// In webhook handler - logs every webhook attempt
console.log('[Webhook] Event:', eventType, 'Payment:', paymentId);
```

2. **Payment Success Rate**:
```sql
-- Daily payment success rate
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_payments,
    COUNT(*) FILTER (WHERE payment_status = 'paid') as successful,
    COUNT(*) FILTER (WHERE payment_status = 'failed') as failed,
    COUNT(*) FILTER (WHERE payment_status = 'pending') as stuck,
    ROUND(100.0 * COUNT(*) FILTER (WHERE payment_status = 'paid') / COUNT(*), 2) as success_rate
FROM orders
WHERE payment_method = 'razorpay'
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;
```

3. **Webhook Reconciliation**:
```sql
-- Find orders with successful payments but no webhook
SELECT 
    o.order_number,
    o.razorpay_order_id,
    o.payment_id,
    o.payment_status,
    COUNT(pl.id) as webhook_count
FROM orders o
LEFT JOIN payment_logs pl ON pl.razorpay_order_id = o.razorpay_order_id
WHERE o.payment_method = 'razorpay'
    AND o.created_at > NOW() - INTERVAL '7 days'
GROUP BY o.id, o.order_number, o.razorpay_order_id, o.payment_id, o.payment_status
HAVING COUNT(pl.id) = 0 OR o.payment_status = 'pending'
ORDER BY o.created_at DESC;
```

---

## 🚀 Testing the Fixes

### Test Razorpay 500 Error Handling

1. **Simulate timeout** (modify temporarily):
```typescript
// In checkout page.tsx, change timeout to 2 seconds for testing
errorTimeout = setTimeout(async () => {
    // ... existing code
}, 2000); // Changed from 10000 to 2000 for testing
```

2. **Test scenarios**:
   - Place test order
   - Close payment modal → should cancel order and restore stock
   - Complete payment → should succeed normally
   - Slow network → should wait and verify via webhook

---

## 📞 For This Specific Transaction

Run these commands **IN THIS ORDER**:

### 1. Check Current Order Status
```sql
SELECT * FROM orders WHERE id = '4b827752-8b93-4600-97df-dbebd6a8911c';
```

### 2. Check Razorpay Dashboard
- Go to Payments → Search `pay_S93Y0v8cFh6N9o`
- Note the status (Captured/Failed/Pending)

### 3a. If Payment is CAPTURED
```sql
-- Update order status
UPDATE orders 
SET 
    payment_status = 'paid',
    payment_id = 'pay_S93Y0v8cFh6N9o',
    status = 'confirmed',
    updated_at = NOW()
WHERE id = '4b827752-8b93-4600-97df-dbebd6a8911c';

-- Verify update
SELECT order_number, payment_status, payment_id, status FROM orders 
WHERE id = '4b827752-8b93-4600-97df-dbebd6a8911c';
```

### 3b. If Payment is FAILED
```sql
-- Cancel order
UPDATE orders 
SET 
    status = 'cancelled',
    payment_status = 'failed',
    notes = 'Razorpay 500 error - payment not captured',
    updated_at = NOW()
WHERE id = '4b827752-8b93-4600-97df-dbebd6a8911c';

-- Get product details for stock restoration
SELECT oi.*, p.name 
FROM order_items oi
JOIN products p ON p.id = oi.product_id
WHERE oi.order_id = '4b827752-8b93-4600-97df-dbebd6a8911c';

-- Restore stock for each item
SELECT increase_stock_by_color_size(
    'PRODUCT_UUID_FROM_ABOVE'::uuid,
    'green', -- color from order_items
    'S',     -- size from order_items
    1        -- quantity from order_items
);
```

---

## 🎯 Summary

**Root Cause**: Razorpay server returned 500 Internal Server Error during checkout

**Impact**: 
- Order created and stock decreased
- Payment might have been captured
- Order status not updated due to error

**Resolution**:
1. ✅ Enhanced error handling implemented (timeout monitoring + webhook check)
2. ✅ Manual verification endpoint created
3. ⏳ Need to check specific transaction status in Razorpay dashboard
4. ⏳ Update order or restore stock based on actual payment status

**Prevention**: 
- New error handling will catch this automatically
- Timeout monitoring will detect stuck payments
- Automatic webhook verification after 5 seconds
- Manual verification endpoint available for edge cases

---

## 📧 Next Steps

**For you (developer)**:
1. Run database migration: `migrations/014_add_razorpay_order_id.sql`
2. Deploy updated code to production
3. Test with Razorpay test mode
4. Monitor payment success rate for 7 days

**For this specific order**:
1. Check payment status in Razorpay dashboard
2. Update order status accordingly (see Scenario A or B above)
3. Notify customer of resolution
4. Add to payment_logs for audit trail

**Need help?** Check the verification endpoint response or contact with:
- Order ID: `4b827752-8b93-4600-97df-dbebd6a8911c`
- Order Number: `ORD202601285124`
- Razorpay Order ID: `order_S93Xw6YMKiGkwU`
- Payment ID: `pay_S93Y0v8cFh6N9o`
