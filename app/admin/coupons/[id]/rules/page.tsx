'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CouponRuleForm } from '@/components/admin/CouponRuleForm';
import { couponRulesService } from '@/services/coupon-rules.service';
import { couponService } from '@/services/coupon.service';
import { toast } from 'sonner';
import type { CouponRule, Coupon } from '@/types';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CouponRulesPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [rules, setRules] = useState<CouponRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<CouponRule | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      setLoading(true);
      
      // Load coupon details
      const coupons = await couponService.getAllCoupons();
      const foundCoupon = coupons.find((c) => c.id === id);
      
      if (!foundCoupon) {
        toast.error('Coupon not found');
        router.push('/admin/coupons');
        return;
      }
      
      setCoupon(foundCoupon);
      
      // Load rules
      const couponRules = await couponRulesService.getCouponRules(id);
      setRules(couponRules);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load coupon rules');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteRule(ruleId: string) {
    if (!confirm('Are you sure you want to delete this rule?')) {
      return;
    }

    try {
      await couponRulesService.deleteCouponRule(ruleId);
      toast.success('Rule deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete rule');
    }
  }

  function handleNewRule() {
    setEditingRule(undefined);
    setShowForm(true);
  }

  function handleEditRule(rule: CouponRule) {
    setEditingRule(rule);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingRule(undefined);
    loadData();
  }

  function getBenefitBadgeColor(type: string) {
    switch (type) {
      case 'free_items':
        return 'bg-green-100 text-green-800';
      case 'fixed_discount':
        return 'bg-blue-100 text-blue-800';
      case 'percentage_discount':
        return 'bg-purple-100 text-purple-800';
      case 'bundle_price':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getSourceDescription(rule: CouponRule): string {
    const parts: string[] = [];
    
    if (rule.source_min_quantity > 1) {
      parts.push(`Buy ${rule.source_min_quantity}`);
    } else {
      parts.push('Buy 1');
    }

    if (rule.source_type === 'category') {
      parts.push('from category');
    } else if (rule.source_type === 'new_arrival') {
      parts.push(rule.source_new_arrival_required ? 'new arrivals' : 'non-new-arrivals');
    } else if (rule.source_type === 'category_new_arrival') {
      parts.push('from category');
      parts.push(rule.source_new_arrival_required ? '(new arrivals)' : '(non-new-arrivals)');
    }

    if (rule.source_min_amount && rule.source_min_amount > 0) {
      parts.push(`(min ₹${rule.source_min_amount})`);
    }

    return parts.join(' ');
  }

  function getBenefitDescription(rule: CouponRule): string {
    switch (rule.benefit_type) {
      case 'free_items':
        return `Get ${rule.free_quantity} free (${rule.free_item_selection}) at ${rule.free_discount_percentage}% off`;
      case 'fixed_discount':
        return `Get ₹${rule.discount_amount} off`;
      case 'percentage_discount':
        return `Get ${rule.discount_percentage}% off`;
      case 'bundle_price':
        return `Bundle price: ₹${rule.bundle_fixed_price}`;
      default:
        return 'Unknown benefit';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="p-6">
        <CouponRuleForm
          couponId={id}
          couponCode={coupon?.code || ''}
          existingRule={editingRule}
          onSave={handleFormClose}
          onCancel={handleFormClose}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/coupons">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Coupons
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Advanced Rules: {coupon?.code}</h1>
            <p className="text-stone-600 text-sm">{coupon?.description}</p>
          </div>
        </div>
        <Button onClick={handleNewRule}>
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {/* Info Card */}
      <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">About Advanced Coupon Rules</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Rules enable complex scenarios like Buy X Get Y, category-based, and new arrival discounts</li>
          <li>• If no rules are defined, the coupon uses simple discount logic (backward compatible)</li>
          <li>• Multiple rules can be created; they're evaluated by priority</li>
          <li>• All rules are configured here and automatically applied when customers use the coupon code</li>
        </ul>
      </Card>

      {/* Rules List */}
      {rules.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-stone-600 mb-4">No advanced rules configured for this coupon</p>
          <p className="text-sm text-stone-500 mb-6">
            This coupon will use simple discount logic based on discount_type and discount_value
          </p>
          <Button onClick={handleNewRule}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Rule
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold">{rule.rule_name}</h3>
                    <Badge className={getBenefitBadgeColor(rule.benefit_type)}>
                      {rule.benefit_type.replace('_', ' ')}
                    </Badge>
                    {!rule.is_active && (
                      <Badge variant="outline" className="bg-gray-100">
                        Inactive
                      </Badge>
                    )}
                    <Badge variant="outline">Priority: {rule.rule_priority}</Badge>
                  </div>

                  {rule.description && (
                    <p className="text-sm text-stone-600 mb-3">{rule.description}</p>
                  )}

                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="font-medium text-stone-700">Condition: </span>
                      <span className="text-stone-600">{getSourceDescription(rule)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-stone-700">Benefit: </span>
                      <span className="text-stone-600">{getBenefitDescription(rule)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRule(rule)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
