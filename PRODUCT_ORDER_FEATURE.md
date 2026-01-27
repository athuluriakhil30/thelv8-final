# Product Display Order Management

## Overview
This feature allows admins to control the display order of products in the Shop page and New Arrivals page. Products can be reordered via drag-and-drop or by manually entering order numbers.

## Files Modified/Created

### Database Migration
- **`/migrations/013_add_product_display_order.sql`**
  - Adds `shop_display_order` and `new_arrival_display_order` columns to products table
  - Creates indexes for performance optimization

### Service Layer
- **`/services/product.service.ts`** (Modified)
  - Updated `getProducts()` to sort by `shop_display_order` first, then `created_at`
  - Updated `getNewArrivals()` to sort by `new_arrival_display_order` first, then `created_at`
  - Added `updateShopDisplayOrder()` - Update single product shop order
  - Added `updateNewArrivalDisplayOrder()` - Update single product new arrival order
  - Added `bulkUpdateShopDisplayOrders()` - Batch update shop orders
  - Added `bulkUpdateNewArrivalDisplayOrders()` - Batch update new arrival orders

### Types
- **`/types/index.ts`** (Modified)
  - Added `shop_display_order?: number` to Product interface
  - Added `new_arrival_display_order?: number` to Product interface

### Admin UI
- **`/app/admin/product-order/page.tsx`** (New)
  - Admin page for managing product display orders
  - Features:
    - Toggle between Shop and New Arrivals order management
    - Drag-and-drop reordering
    - Manual order number input
    - Visual product list with images, names, prices
    - Bulk save functionality

- **`/app/admin/layout.tsx`** (Modified)
  - Added "Product Display Order" menu item
  - Added ArrowUpDown icon import

## How It Works

### Database Schema
```sql
shop_display_order INTEGER DEFAULT 0
new_arrival_display_order INTEGER DEFAULT 0
```
- Lower numbers appear first (1 before 2, etc.)
- Default value of 0 means chronological order (newest first)
- Products with custom order (>0) always appear before products with 0

### Sorting Logic
Products are sorted with two ORDER BY clauses:
1. Primary: `shop_display_order` or `new_arrival_display_order` (ascending)
2. Secondary: `created_at` (descending)

This ensures:
- Products with set display orders appear first in their specified order
- Products without display orders appear after in chronological order

## Usage Instructions

### Admin Interface
1. Navigate to **Admin → Product Display Order**
2. Choose between "Shop Page Order" or "New Arrivals Order"
3. **Drag and drop** rows to reorder OR **enter numbers** in Order column
4. Click **"Save Display Order"** to apply changes
5. Click **"Reset"** to discard changes

### Display Order Rules
- **Order 1** = First position
- **Order 2** = Second position
- **Order 0** = Chronological order (default)
- Products with same order number will be sorted by creation date

## Example Use Cases

### Scenario 1: Feature New Collection First
- Set new winter collection items to orders 1-10
- They'll appear before all older products

### Scenario 2: Promote Sale Items
- Set sale items to orders 1-5 in shop page
- Normal products remain in chronological order (order 0)

### Scenario 3: Seasonal New Arrivals
- Reorder new arrivals to highlight seasonal products
- Summer items (orders 1-8) appear before spring items (order 0)

## API Examples

### Update Single Product
```typescript
await productService.updateShopDisplayOrder('product-id', 5);
await productService.updateNewArrivalDisplayOrder('product-id', 2);
```

### Bulk Update
```typescript
await productService.bulkUpdateShopDisplayOrders([
  { id: 'product-1-id', order: 1 },
  { id: 'product-2-id', order: 2 },
  { id: 'product-3-id', order: 3 }
]);
```

## Migration Instructions

### Apply the Migration
```sql
-- Run the migration file
psql -d your_database < migrations/013_add_product_display_order.sql
```

### Or via Supabase Dashboard
1. Go to Supabase SQL Editor
2. Copy contents of `013_add_product_display_order.sql`
3. Run the SQL

## Technical Notes

- **Modular Design**: All changes are isolated to service layer and new admin page
- **Backward Compatible**: Existing functionality unchanged (default order 0)
- **Performance**: Indexed columns for fast sorting
- **No Breaking Changes**: Products without display orders work exactly as before

## Future Enhancements
- Category-specific ordering
- Auto-numbering feature
- Order templates (presets)
- Drag-and-drop visual grid view
- Schedule-based ordering (time-based changes)
