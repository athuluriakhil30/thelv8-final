import { supabase } from '@/lib/supabase/client';
import { couponRulesService } from './coupon-rules.service';
import type { CartItem, Product, Coupon } from '@/types';

// Re-export advanced types
export type { 
  CouponValidationResult, 
  CouponWithRules, 
  CouponRule,
  AppliedCouponRule,
  CouponBreakdown,
  Coupon
} from '@/types';

interface CartItemWithProduct extends CartItem {
  product: Product;
}

export const couponService = {
  // Get all coupons (admin)
  async getAllCoupons() {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Coupon[];
  },

  // Get active coupons (public)
  async getActiveCoupons() {
    const now = new Date().toISOString();
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .lte('valid_from', now)
      .gte('valid_until', now)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!coupons) return [];
    
    // Fetch rules for all coupons
    const couponIds = coupons.map(c => c.id);
    const { data: rules, error: rulesError } = await supabase
      .from('coupon_rules')
      .select('*')
      .in('coupon_id', couponIds)
      .eq('is_active', true);
    
    if (rulesError) console.error('Error fetching coupon rules:', rulesError);
    
    // Merge rules into coupons
    const couponsWithRules = coupons.map(coupon => ({
      ...coupon,
      rules: rules?.filter(rule => rule.coupon_id === coupon.id) || []
    }));
    
    return couponsWithRules as Coupon[];
  },

  // Validate and calculate coupon discount
  // Enhanced to support advanced rules while maintaining backward compatibility
  async validateCoupon(
    code: string, 
    subtotal: number,
    cartItems?: CartItemWithProduct[]
  ): Promise<import('@/types').CouponValidationResult> {
    try {
      // If cart items provided, use advanced validation
      if (cartItems && cartItems.length > 0) {
        return await couponRulesService.validateAdvancedCoupon(code, cartItems, subtotal);
      }

      // Otherwise use simple validation (backward compatibility)
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (error || !data) {
        return { valid: false, message: 'Invalid coupon code' };
      }

      const coupon = data as Coupon;

      // Check if active
      if (!coupon.is_active) {
        return { valid: false, message: 'This coupon is no longer active' };
      }

      // Check date validity
      const now = new Date();
      
      if (coupon.valid_from) {
        const validFrom = new Date(coupon.valid_from);
        if (now < validFrom) {
          return { valid: false, message: 'This coupon is not yet valid' };
        }
      }

      if (coupon.valid_until) {
        const validUntil = new Date(coupon.valid_until);
        if (now > validUntil) {
          return { valid: false, message: 'This coupon has expired' };
        }
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        return { valid: false, message: 'This coupon has reached its usage limit' };
      }

      // Check minimum purchase amount
      if (coupon.min_purchase_amount && subtotal < coupon.min_purchase_amount) {
        return {
          valid: false,
          message: `Minimum purchase amount of ₹${coupon.min_purchase_amount} required`,
        };
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = (subtotal * coupon.discount_value) / 100;
        if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
          discount = coupon.max_discount_amount;
        }
      } else {
        discount = coupon.discount_value;
      }

      // Ensure discount doesn't exceed subtotal
      discount = Math.min(discount, subtotal);

      return {
        valid: true,
        message: 'Coupon applied successfully',
        discount: Math.round(discount * 100) / 100,
        coupon: coupon as any,
        totalSavings: Math.round(discount * 100) / 100,
        breakdown: {
          originalAmount: subtotal,
          discountAmount: discount,
          finalAmount: subtotal - discount,
          appliedRuleCount: 0,
          explanation: `${coupon.discount_type === 'percentage' ? coupon.discount_value + '%' : '₹' + coupon.discount_value} discount applied`,
        },
      };
    } catch (error) {
      console.error('Error validating coupon:', error);
      return { valid: false, message: 'Error validating coupon' };
    }
  },

  // Create coupon (admin)
  async createCoupon(couponData: Omit<Coupon, 'id' | 'used_count' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('coupons')
      .insert({
        ...couponData,
        code: couponData.code.toUpperCase(),
        used_count: 0,
      } as any)
      .select()
      .single();

    if (error) throw error;
    return data as Coupon;
  },

  // Update coupon (admin)
  async updateCoupon(id: string, updates: Partial<Coupon>) {
    const updateData: any = { ...updates };
    if (updates.code) {
      updateData.code = updates.code.toUpperCase();
    }

    const { data, error } = await (supabase
      .from('coupons') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Coupon;
  },

  // Delete coupon (admin)
  async deleteCoupon(id: string) {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Increment usage count (called after successful order)
  async incrementUsageCount(code: string) {
    const { data, error: fetchError } = await supabase
      .from('coupons')
      .select('used_count')
      .eq('code', code.toUpperCase())
      .single();

    if (fetchError || !data) throw fetchError || new Error('Coupon not found');

    const coupon = data as { used_count: number };

    const { error } = await (supabase
      .from('coupons') as any)
      .update({ used_count: (coupon.used_count || 0) + 1 })
      .eq('code', code.toUpperCase());

    if (error) throw error;
  },
};
