# Best Sellers Feature

## Overview
The Best Sellers feature allows admins to manually curate products displayed in the "Best Sellers" section on the homepage. If no manual selection is made, the system automatically calculates best sellers based on actual order data.

## Features

### ✅ Manual Curation
- Admins can manually select which products appear as best sellers
- Drag and drop reordering (using up/down arrows)
- Toggle active/inactive status for each product
- Display order control

### ✅ Auto-Calculation Fallback
- If no manual best sellers are configured, the system automatically shows top-selling products
- Based on actual order data (quantity sold)
- Excludes cancelled and refunded orders
- Only counts paid orders

### ✅ Homepage Display
- Shows up to 8 best seller products
- Top 3 products get special badges:
  - 🥇 #1 Best Seller (Gold)
  - 🥈 #2 Best Seller (Silver)
  - 🥉 #3 Best Seller (Bronze)
- Beautiful card design with hover effects
- Matches the design of Featured Products and New Arrivals sections

## How to Use

### Admin Panel Management

1. **Navigate to Best Sellers**
   - Go to Admin Dashboard
   - Click "Manage Best Sellers" in Quick Actions
   - Or visit `/admin/best-sellers`

2. **Add Products to Best Sellers**
   - Select a product from the dropdown
   - Click "Add Product"
   - Product will be added to the list

3. **Reorder Products**
   - Use ▲ and ▼ buttons to move products up/down
   - Order determines display order on homepage (#1 appears first)

4. **Toggle Active/Inactive**
   - Use the switch to activate/deactivate a product
   - Inactive products won't show on homepage

5. **Remove Products**
   - Click the trash icon to remove a product from best sellers

### Automatic Best Sellers

If no manual best sellers are configured, the system will:
1. Query all orders (excluding cancelled/refunded)
2. Calculate total quantity sold per product
3. Rank products by quantity sold
4. Display top 8 products
5. Automatically update when new orders are placed

## Database Structure

### Table: `best_sellers`
```sql
- id: UUID (primary key)
- product_id: UUID (references products)
- display_order: INTEGER (sorting order)
- is_active: BOOLEAN (show/hide on homepage)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Function: `get_auto_best_sellers(limit)`
Calculates top-selling products from order data:
- Returns product_id, product_name, total_quantity, total_revenue
- Excludes cancelled and refunded orders
- Only counts paid orders
- Sorted by total_quantity DESC

## API/Service Methods

### Frontend Service: `bestSellerService`

**Public Methods:**
- `getBestSellers(limit)` - Get best sellers (manual or auto)
- `getManualBestSellers()` - Get manually curated list
- `getAutoBestSellers(limit)` - Get auto-calculated list

**Admin Methods:**
- `getAllBestSellers()` - Get all entries with products
- `addBestSeller(productId, displayOrder)` - Add product
- `removeBestSeller(id)` - Remove product
- `updateBestSellerOrder(id, displayOrder)` - Update order
- `toggleBestSeller(id, isActive)` - Toggle status
- `reorderBestSellers(items[])` - Bulk reorder

## Homepage Integration

The Best Sellers section appears on the homepage between:
- **Above**: Fresh Picks (New Arrivals)
- **Below**: Featured Collections

**Section Design:**
- Green theme (vs amber for new arrivals, blue for featured)
- TrendingUp icon badge
- 4-column grid on desktop, 2-column on mobile
- Ranked badges for top 3 products
- Same card style as other sections

## Migration

**File:** `migrations/017_add_best_sellers.sql`

To apply:
```bash
# In Supabase SQL Editor, run the migration file
```

The migration creates:
1. `best_sellers` table
2. Indexes for performance
3. RLS policies (public read, admin write)
4. `get_auto_best_sellers()` function

## Notes

- Products must be published to appear in best sellers
- Manual selection always takes precedence over auto-calculation
- Order starts at 0 (lowest number appears first)
- Inactive products are hidden but remain in the list
- Removing a product from best sellers doesn't delete the product itself

## Future Enhancements

Potential improvements:
- [ ] Time-based best sellers (last 30 days, last 7 days)
- [ ] Category-specific best sellers
- [ ] Revenue-based ranking option
- [ ] Scheduled rotations
- [ ] A/B testing different best seller sets
