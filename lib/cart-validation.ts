/**
 * Cart Validation Module
 * Provides centralized stock validation logic for cart operations
 * Ensures consistent validation across add-to-cart, cart page, and checkout flows
 */

import { productService } from '@/services/product.service';
import type { Product } from '@/types';

export interface StockValidationResult {
  valid: boolean;
  availableStock: number;
  message?: string;
}

export interface CartValidationItem {
  product_id: string;
  selected_size: string | null;
  quantity: number;
  product?: Product;
}

/**
 * Get available stock for a product considering size selection
 */
export function getAvailableStock(product: Product, size: string | null): number {
  // If size is selected and stock_by_size exists, use size-specific stock
  if (size && size !== 'default' && size !== '' && product.stock_by_size) {
    const sizeStock = product.stock_by_size[size];
    return typeof sizeStock === 'number' ? sizeStock : 0;
  }
  
  // Otherwise use total stock
  return product.stock || 0;
}

/**
 * Validate if a single item can be added to cart
 * Checks against current cart quantity if provided
 */
export function validateSingleItem(
  product: Product,
  size: string | null,
  requestedQuantity: number,
  currentCartQuantity: number = 0
): StockValidationResult {
  const availableStock = getAvailableStock(product, size);
  const totalQuantity = currentCartQuantity + requestedQuantity;

  if (availableStock === 0) {
    return {
      valid: false,
      availableStock,
      message: 'This item is out of stock'
    };
  }

  if (totalQuantity > availableStock) {
    const remaining = availableStock - currentCartQuantity;
    if (remaining <= 0) {
      return {
        valid: false,
        availableStock,
        message: 'This item is already in your cart at maximum available quantity'
      };
    }
    return {
      valid: false,
      availableStock,
      message: `Only ${remaining} more available in stock`
    };
  }

  return {
    valid: true,
    availableStock
  };
}

/**
 * Validate all items in cart against current stock levels
 * Uses database-level validation for consistency
 */
export async function validateCartItems(
  cartItems: CartValidationItem[]
): Promise<{
  valid: boolean;
  outOfStockItems: any[];
  issues: string[];
}> {
  try {
    // Call database validation function for atomic check
    const validation = await productService.validateCartStock(cartItems);
    
    const issues: string[] = [];
    
    if (!validation.valid && validation.outOfStockItems.length > 0) {
      for (const item of validation.outOfStockItems) {
        const itemInfo = cartItems.find(ci => ci.product_id === item.product_id);
        const productName = itemInfo?.product?.name || 'Product';
        
        if (item.size) {
          issues.push(
            `${productName} (Size: ${item.size}) - Requested: ${item.requested}, Available: ${item.available}`
          );
        } else {
          issues.push(
            `${productName} - Requested: ${item.requested}, Available: ${item.available}`
          );
        }
      }
    }

    return {
      valid: validation.valid,
      outOfStockItems: validation.outOfStockItems,
      issues
    };
  } catch (error) {
    console.error('[CartValidation] Error validating cart:', error);
    throw new Error('Failed to validate cart stock. Please try again.');
  }
}

/**
 * Check if a product is available for the requested quantity
 * This is a lightweight check for UI validation
 */
export function isStockAvailable(
  product: Product,
  size: string | null,
  quantity: number
): boolean {
  const availableStock = getAvailableStock(product, size);
  return quantity <= availableStock && availableStock > 0;
}

/**
 * Get user-friendly stock message for display
 */
export function getStockMessage(
  product: Product,
  size: string | null
): string {
  const stock = getAvailableStock(product, size);
  
  if (stock === 0) {
    return 'Out of stock';
  }
  
  if (stock <= 5) {
    return `Only ${stock} left in stock`;
  }
  
  if (stock <= 20) {
    return `${stock} available`;
  }
  
  return 'In stock';
}

/**
 * Normalize size and color values for consistent comparison
 */
export function normalizeCartSelection(value: string | null): string {
  if (!value || value === 'default' || value === '') {
    return '';
  }
  return value;
}
