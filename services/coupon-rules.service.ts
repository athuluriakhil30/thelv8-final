/**
 * Advanced Coupon Rules Service
 * Handles complex coupon validation with Buy X Get Y, category-based, and new arrival-based rules
 * Maintains backward compatibility with simple coupons
 */

import { supabase } from '@/lib/supabase/client';
import {
  CouponRule,
  CouponWithRules,
  CouponValidationResult,
  AppliedCouponRule,
  CouponBreakdown,
  CartItem,
  Product,
  Database,
} from '@/types';

type CouponRuleInsert = Database['public']['Tables']['coupon_rules']['Insert'];
type CouponRuleUpdate = Database['public']['Tables']['coupon_rules']['Update'];

interface CartItemWithProduct extends CartItem {
  product: Product;
}

interface EvaluatedRule {
  rule: CouponRule;
  sourceItems: CartItemWithProduct[];
  targetItems: CartItemWithProduct[];
  discountAmount: number;
  canApply: boolean;
  reason?: string;
}

export const couponRulesService = {
  // ============================================
  // ADMIN: COUPON RULE MANAGEMENT
  // ============================================

  /**
   * Get all rules for a coupon
   */
  async getCouponRules(couponId: string): Promise<CouponRule[]> {
    const { data, error } = await supabase
      .from('coupon_rules')
      .select('*')
      .eq('coupon_id', couponId)
      .order('rule_priority', { ascending: false });

    if (error) throw error;
    return (data || []) as CouponRule[];
  },

  /**
   * Create a new coupon rule
   */
  async createCouponRule(ruleData: CouponRuleInsert): Promise<CouponRule> {
    const { data, error } = await supabase
      .from('coupon_rules')
      .insert(ruleData)
      .select()
      .single();

    if (error) throw error;
    return data as CouponRule;
  },

  /**
   * Update an existing coupon rule
   */
  async updateCouponRule(ruleId: string, updates: CouponRuleUpdate): Promise<CouponRule> {
    const { data, error } = await supabase
      .from('coupon_rules')
      .update(updates)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    return data as CouponRule;
  },

  /**
   * Delete a coupon rule
   */
  async deleteCouponRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('coupon_rules')
      .delete()
      .eq('id', ruleId);

    if (error) throw error;
  },

  /**
   * Get coupon with all its rules
   */
  async getCouponWithRules(couponId: string): Promise<CouponWithRules | null> {
    // Get coupon
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', couponId)
      .single();

    if (couponError || !coupon) return null;

    // Get rules
    const rules = await this.getCouponRules(couponId);

    return {
      ...coupon,
      rules,
    } as CouponWithRules;
  },

  // ============================================
  // COUPON VALIDATION WITH ADVANCED RULES
  // ============================================

  /**
   * Validate and apply coupon with advanced rules
   * Maintains backward compatibility with simple coupons
   */
  async validateAdvancedCoupon(
    code: string,
    cartItems: CartItemWithProduct[],
    subtotal: number
  ): Promise<CouponValidationResult> {
    try {
      // Get coupon with rules
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (error || !coupon) {
        return { valid: false, message: 'Invalid coupon code' };
      }

      const couponData = coupon as any;

      // Basic validation
      if (!couponData.is_active) {
        return { valid: false, message: 'This coupon is no longer active' };
      }

      // Date validation
      const now = new Date();
      if (couponData.valid_from && now < new Date(couponData.valid_from)) {
        return { valid: false, message: 'This coupon is not yet valid' };
      }
      if (couponData.valid_until && now > new Date(couponData.valid_until)) {
        return { valid: false, message: 'This coupon has expired' };
      }

      // Usage limit validation
      if (couponData.usage_limit && couponData.used_count >= couponData.usage_limit) {
        return { valid: false, message: 'This coupon has reached its usage limit' };
      }

      // Get coupon rules
      const rules = await this.getCouponRules(couponData.id);

      // If no rules exist, use simple coupon logic (backward compatibility)
      if (!rules || rules.length === 0) {
        return this.applySimpleCoupon(couponData, subtotal);
      }

      // Apply advanced rules
      return this.applyAdvancedRules(couponData, rules, cartItems, subtotal);
    } catch (error) {
      console.error('[CouponRulesService] Validation error:', error);
      return { valid: false, message: 'Error validating coupon' };
    }
  },

  /**
   * Apply simple coupon logic (backward compatibility)
   */
  applySimpleCoupon(coupon: any, subtotal: number): CouponValidationResult {
    // Check minimum purchase
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
      if (coupon.max_discount_amount) {
        discount = Math.min(discount, coupon.max_discount_amount);
      }
    } else {
      discount = coupon.discount_value;
    }

    return {
      valid: true,
      message: 'Coupon applied successfully',
      discount,
      coupon: { ...coupon, rules: [] },
      totalSavings: discount,
      breakdown: {
        originalAmount: subtotal,
        discountAmount: discount,
        finalAmount: subtotal - discount,
        appliedRuleCount: 0,
        explanation: `${coupon.discount_type === 'percentage' ? coupon.discount_value + '%' : '₹' + coupon.discount_value} discount applied`,
      },
    };
  },

  /**
   * Apply advanced rules to cart
   */
  async applyAdvancedRules(
    coupon: any,
    rules: CouponRule[],
    cartItems: CartItemWithProduct[],
    subtotal: number
  ): Promise<CouponValidationResult> {
    const activeRules = rules.filter((r) => r.is_active);
    
    if (activeRules.length === 0) {
      return this.applySimpleCoupon(coupon, subtotal);
    }

    // Sort by priority
    activeRules.sort((a, b) => b.rule_priority - a.rule_priority);

    // Evaluate each rule
    const evaluatedRules: EvaluatedRule[] = [];
    
    for (const rule of activeRules) {
      const evaluation = this.evaluateRule(rule, cartItems);
      evaluatedRules.push(evaluation);
    }

    // Filter rules that can apply
    const applicableRules = evaluatedRules.filter((r) => r.canApply);

    if (applicableRules.length === 0) {
      const reasons = evaluatedRules
        .filter((r) => r.reason)
        .map((r) => r.reason)
        .join('; ');
      return {
        valid: false,
        message: reasons || 'Cart does not meet coupon requirements',
      };
    }

    // Apply rules (respect max_applications_per_order)
    const maxApplications = coupon.max_applications_per_order || 1;
    const rulesToApply = applicableRules.slice(0, maxApplications);

    // Calculate total discount
    let totalDiscount = 0;
    const appliedRules: AppliedCouponRule[] = [];

    for (const evaluated of rulesToApply) {
      totalDiscount += evaluated.discountAmount;
      appliedRules.push({
        ruleId: evaluated.rule.id,
        ruleName: evaluated.rule.rule_name,
        ruleDescription: evaluated.rule.description || '',
        discountAmount: evaluated.discountAmount,
        sourceItems: evaluated.sourceItems.map((item) => item.product_id),
        targetItems: evaluated.targetItems.map((item) => item.product_id),
        benefitType: evaluated.rule.benefit_type,
      });
    }

    // Build explanation
    const explanation = appliedRules
      .map((r) => `${r.ruleName}: ₹${r.discountAmount.toFixed(2)} saved`)
      .join('; ');

    return {
      valid: true,
      message: 'Coupon applied successfully',
      discount: totalDiscount,
      coupon: { ...coupon, rules },
      appliedRules,
      totalSavings: totalDiscount,
      breakdown: {
        originalAmount: subtotal,
        discountAmount: totalDiscount,
        finalAmount: subtotal - totalDiscount,
        appliedRuleCount: appliedRules.length,
        explanation,
      },
    };
  },

  /**
   * Evaluate a single rule against cart items
   */
  evaluateRule(rule: CouponRule, cartItems: CartItemWithProduct[]): EvaluatedRule {
    // Find source items (items that satisfy the condition)
    const sourceItems = this.findSourceItems(rule, cartItems);

    // Calculate total quantity of source items
    const totalSourceQuantity = sourceItems.reduce((sum, item) => sum + item.quantity, 0);

    // Check if source condition is met
    if (totalSourceQuantity < rule.source_min_quantity) {
      return {
        rule,
        sourceItems: [],
        targetItems: [],
        discountAmount: 0,
        canApply: false,
        reason: `Need ${rule.source_min_quantity} ${this.getSourceDescription(rule)}, but only ${totalSourceQuantity} in cart`,
      };
    }

    // Check maximum quantity if specified
    if (rule.source_max_quantity && totalSourceQuantity > rule.source_max_quantity) {
      return {
        rule,
        sourceItems: [],
        targetItems: [],
        discountAmount: 0,
        canApply: false,
        reason: `Maximum ${rule.source_max_quantity} ${this.getSourceDescription(rule)} allowed for this offer, but you have ${totalSourceQuantity}`,
      };
    }

    // Check minimum amount if specified
    if (rule.source_min_amount) {
      const sourceTotal = sourceItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      if (sourceTotal < rule.source_min_amount) {
        return {
          rule,
          sourceItems: [],
          targetItems: [],
          discountAmount: 0,
          canApply: false,
          reason: `Minimum purchase of ₹${rule.source_min_amount} required for ${this.getSourceDescription(rule)}`,
        };
      }
    }

    // Find target items and calculate discount
    const result = this.calculateRuleDiscount(rule, sourceItems, cartItems);

    return {
      rule,
      sourceItems,
      targetItems: result.targetItems,
      discountAmount: result.discount,
      canApply: true,
    };
  },

  /**
   * Find items that satisfy source condition
   */
  findSourceItems(rule: CouponRule, cartItems: CartItemWithProduct[]): CartItemWithProduct[] {
    return cartItems.filter((item) => {
      const product = item.product;

      switch (rule.source_type) {
        case 'category':
          return product.category_id === rule.source_category_id;

        case 'new_arrival':
          return product.new_arrival === rule.source_new_arrival_required;

        case 'category_new_arrival':
          return (
            product.category_id === rule.source_category_id &&
            product.new_arrival === rule.source_new_arrival_required
          );

        case 'any':
          return true;

        default:
          return false;
      }
    });
  },

  /**
   * Calculate discount for a rule
   */
  calculateRuleDiscount(
    rule: CouponRule,
    sourceItems: CartItemWithProduct[],
    allCartItems: CartItemWithProduct[]
  ): { discount: number; targetItems: CartItemWithProduct[] } {
    switch (rule.benefit_type) {
      case 'free_items':
        return this.calculateFreeItemsDiscount(rule, sourceItems, allCartItems);

      case 'fixed_discount':
        return this.calculateFixedDiscount(rule, sourceItems, allCartItems);

      case 'percentage_discount':
        return this.calculatePercentageDiscount(rule, sourceItems, allCartItems);

      case 'bundle_price':
        return this.calculateBundlePrice(rule, sourceItems);

      default:
        return { discount: 0, targetItems: [] };
    }
  },

  /**
   * Calculate free items discount (Buy X Get Y)
   */
  calculateFreeItemsDiscount(
    rule: CouponRule,
    sourceItems: CartItemWithProduct[],
    allCartItems: CartItemWithProduct[]
  ): { discount: number; targetItems: CartItemWithProduct[] } {
    // Find eligible target items
    let eligibleItems = allCartItems.filter((item) => {
      const product = item.product;

      // If target category specified
      if (rule.target_category_id && product.category_id !== rule.target_category_id) {
        return false;
      }

      // If target new_arrival specified
      if (rule.target_new_arrival_required !== null && rule.target_new_arrival_required !== undefined) {
        if (product.new_arrival !== rule.target_new_arrival_required) {
          return false;
        }
      }

      return true;
    });

    // If no specific target, use source items
    if (!rule.target_category_id && rule.target_new_arrival_required === null) {
      eligibleItems = sourceItems;
    }

    if (eligibleItems.length === 0) {
      return { discount: 0, targetItems: [] };
    }

    // Select items based on selection rule
    const freeQuantity = rule.free_quantity || 1;
    const selectedItems = this.selectFreeItems(eligibleItems, freeQuantity, rule.free_item_selection || 'cheapest');

    // Calculate discount (default 100% off)
    const discountPercentage = rule.free_discount_percentage || 100;
    const discount = selectedItems.reduce((sum, item) => {
      return sum + (item.product.price * Math.min(item.quantity, freeQuantity) * discountPercentage) / 100;
    }, 0);

    return { discount, targetItems: selectedItems };
  },

  /**
   * Select free items based on selection rule
   */
  selectFreeItems(
    items: CartItemWithProduct[],
    quantity: number,
    selection: string
  ): CartItemWithProduct[] {
    const sorted = [...items].sort((a, b) => {
      if (selection === 'cheapest') {
        return a.product.price - b.product.price;
      } else if (selection === 'most_expensive') {
        return b.product.price - a.product.price;
      }
      return 0;
    });

    return sorted.slice(0, quantity);
  },

  /**
   * Calculate fixed discount
   */
  calculateFixedDiscount(
    rule: CouponRule,
    sourceItems: CartItemWithProduct[],
    allCartItems: CartItemWithProduct[]
  ): { discount: number; targetItems: CartItemWithProduct[] } {
    const targetItems = this.findDiscountTargetItems(rule, sourceItems, allCartItems);
    const discount = rule.discount_amount || 0;
    return { discount, targetItems };
  },

  /**
   * Calculate percentage discount
   */
  calculatePercentageDiscount(
    rule: CouponRule,
    sourceItems: CartItemWithProduct[],
    allCartItems: CartItemWithProduct[]
  ): { discount: number; targetItems: CartItemWithProduct[] } {
    const targetItems = this.findDiscountTargetItems(rule, sourceItems, allCartItems);
    const targetTotal = targetItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discount = (targetTotal * (rule.discount_percentage || 0)) / 100;
    return { discount, targetItems };
  },

  /**
   * Calculate bundle price
   */
  calculateBundlePrice(
    rule: CouponRule,
    sourceItems: CartItemWithProduct[]
  ): { discount: number; targetItems: CartItemWithProduct[] } {
    const originalTotal = sourceItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const bundlePrice = rule.bundle_fixed_price || 0;
    const discount = Math.max(0, originalTotal - bundlePrice);
    return { discount, targetItems: sourceItems };
  },

  /**
   * Find items that should receive discount
   */
  findDiscountTargetItems(
    rule: CouponRule,
    sourceItems: CartItemWithProduct[],
    allCartItems: CartItemWithProduct[]
  ): CartItemWithProduct[] {
    switch (rule.discount_target_type) {
      case 'source':
        return sourceItems;

      case 'target':
        return allCartItems.filter((item) => {
          const product = item.product;
          if (rule.discount_target_category_id && product.category_id !== rule.discount_target_category_id) {
            return false;
          }
          if (rule.discount_target_new_arrival !== null && product.new_arrival !== rule.discount_target_new_arrival) {
            return false;
          }
          return true;
        });

      case 'cart':
        return allCartItems;

      default:
        return sourceItems;
    }
  },

  /**
   * Get human-readable source description
   */
  getSourceDescription(rule: CouponRule): string {
    switch (rule.source_type) {
      case 'category':
        return 'items from specified category';
      case 'new_arrival':
        return rule.source_new_arrival_required ? 'new arrival items' : 'non-new-arrival items';
      case 'category_new_arrival':
        return 'items from specified category and new arrival status';
      case 'any':
        return 'items';
      default:
        return 'items';
    }
  },

  // ============================================
  // COUPON APPLICATION TRACKING
  // ============================================

  /**
   * Log coupon application for analytics
   */
  async logCouponApplication(data: {
    couponId: string;
    orderId?: string;
    userId?: string;
    ruleId?: string;
    discountAmount: number;
    originalAmount: number;
    finalAmount: number;
    sourceItems?: string[];
    targetItems?: string[];
    ruleDescription?: string;
  }): Promise<void> {
    try {
      await supabase.from('coupon_applications').insert({
        coupon_id: data.couponId,
        order_id: data.orderId,
        user_id: data.userId,
        rule_id: data.ruleId,
        discount_amount: data.discountAmount,
        original_amount: data.originalAmount,
        final_amount: data.finalAmount,
        source_items: data.sourceItems,
        target_items: data.targetItems,
        rule_description: data.ruleDescription,
      });
    } catch (error) {
      console.error('[CouponRulesService] Error logging application:', error);
    }
  },
};
