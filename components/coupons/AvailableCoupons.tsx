"use client";

import { useState, useEffect } from 'react';
import { Copy, Check, Tag, Gift, Percent, Info } from 'lucide-react';
import { couponService } from '@/services/coupon.service';
import type { Coupon } from '@/types';
import { Button } from '@/components/ui/button';

interface AvailableCouponsProps {
  onCouponSelect?: (code: string) => void;
  variant?: 'default' | 'compact';
  className?: string;
}

export default function AvailableCoupons({ 
  onCouponSelect,
  variant = 'default',
  className = ''
}: AvailableCouponsProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const activeCoupons = await couponService.getActiveCoupons();
      setCoupons(activeCoupons);
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      
      if (onCouponSelect) {
        onCouponSelect(code);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% OFF`;
    } else if (coupon.discount_type === 'fixed') {
      return `₹${coupon.discount_value} OFF`;
    }
    return 'SPECIAL OFFER';
  };

  const getCouponDescription = (coupon: Coupon) => {
    // Check if there's a rule with description
    if (coupon.rules && coupon.rules.length > 0 && coupon.rules[0].description) {
      return coupon.rules[0].description;
    }
    
    // Fallback to coupon description or generate one
    if (coupon.description) {
      return coupon.description;
    }

    // Generate description based on coupon type
    let desc = formatDiscount(coupon);
    if (coupon.min_purchase_amount && coupon.min_purchase_amount > 0) {
      desc += ` on orders above ₹${coupon.min_purchase_amount}`;
    }
    return desc;
  };

  const getCouponIcon = (coupon: Coupon) => {
    // Check if it's a free item coupon (B2G1 type)
    if (coupon.rules && coupon.rules.length > 0) {
      const rule = coupon.rules[0];
      if (rule.benefit_type === 'free_items') {
        return <Gift className="h-5 w-5" />;
      }
    }
    
    // Check discount type
    if (coupon.discount_type === 'percentage') {
      return <Percent className="h-5 w-5" />;
    }
    
    return <Tag className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <div className={`animate-pulse space-y-3 ${className}`}>
        <div className="h-24 bg-stone-100 dark:bg-stone-800 rounded-lg"></div>
        <div className="h-24 bg-stone-100 dark:bg-stone-800 rounded-lg"></div>
      </div>
    );
  }

  if (coupons.length === 0) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div className={`space-y-2 ${className}`}>
        <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-2">
          Available Coupons
        </h3>
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className="flex items-center justify-between gap-2 p-3 bg-gradient-to-r from-amber-50 to-stone-50 dark:from-amber-950/20 dark:to-stone-900 border border-amber-200 dark:border-amber-900 rounded-lg"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="text-amber-700 dark:text-amber-400">
                {getCouponIcon(coupon)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono font-bold text-sm text-stone-900 dark:text-stone-100 tracking-wider">
                  {coupon.code}
                </div>
              </div>
            </div>
            
            {/* Info Icon with Tooltip */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowTooltip(coupon.id)}
                onMouseLeave={() => setShowTooltip(null)}
                onClick={() => setShowTooltip(showTooltip === coupon.id ? null : coupon.id)}
                className="p-1.5 text-stone-500 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-400 transition-colors"
              >
                <Info className="h-4 w-4" />
              </button>
              
              {showTooltip === coupon.id && (
                <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs rounded-lg shadow-xl z-10">
                  <div className="absolute -bottom-1 right-4 w-2 h-2 bg-stone-900 dark:bg-stone-100 transform rotate-45"></div>
                  {getCouponDescription(coupon)}
                </div>
              )}
            </div>
            <Button
              onClick={() => handleCopy(coupon.code)}
              size="sm"
              variant={copiedCode === coupon.code ? "default" : "outline"}
              className={copiedCode === coupon.code ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {copiedCode === coupon.code ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Tag className="h-5 w-5 text-amber-700 dark:text-amber-400" />
        <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          Available Coupons
        </h3>
      </div>
      
      <div className="grid gap-3">
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className="relative overflow-hidden bg-gradient-to-br from-white to-stone-50 dark:from-stone-900 dark:to-stone-800 border-2 border-amber-200 dark:border-amber-900 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Decorative corner */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-bl-full opacity-50"></div>
            
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                {/* Icon and Discount */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-700 dark:text-amber-400">
                    {getCouponIcon(coupon)}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-amber-700 dark:text-amber-400">
                      {formatDiscount(coupon)}
                    </div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                      Valid until {new Date(coupon.valid_until).toLocaleDateString('en-IN', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-stone-600 dark:text-stone-300">
                  {getCouponDescription(coupon)}
                </p>

                {/* Coupon Code */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 border border-dashed border-stone-300 dark:border-stone-600 rounded">
                    <span className="font-mono font-bold text-stone-900 dark:text-stone-100 text-sm tracking-wider">
                      {coupon.code}
                    </span>
                  </div>
                </div>
              </div>

              {/* Copy Button */}
              <Button
                onClick={() => handleCopy(coupon.code)}
                variant={copiedCode === coupon.code ? "default" : "outline"}
                className={`shrink-0 ${
                  copiedCode === coupon.code 
                    ? "bg-green-600 hover:bg-green-700 border-green-600" 
                    : "border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                }`}
              >
                {copiedCode === coupon.code ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Usage hint */}
      <p className="text-xs text-center text-stone-500 dark:text-stone-400">
        Copy the code and apply it at checkout to get your discount
      </p>
    </div>
  );
}
