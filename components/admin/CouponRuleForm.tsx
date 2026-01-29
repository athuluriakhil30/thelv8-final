'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { couponRulesService } from '@/services/coupon-rules.service';
import { productService } from '@/services/product.service';
import { categoryService } from '@/services/category.service';
import { toast } from 'sonner';
import type { CouponRule, Category } from '@/types';

interface CouponRuleFormProps {
  couponId: string;
  couponCode: string;
  existingRule?: CouponRule;
  onSave: () => void;
  onCancel: () => void;
}

export function CouponRuleForm({ couponId, couponCode, existingRule, onSave, onCancel }: CouponRuleFormProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Rule data
  const [ruleName, setRuleName] = useState(existingRule?.rule_name || '');
  const [ruleDescription, setRuleDescription] = useState(existingRule?.description || '');
  const [rulePriority, setRulePriority] = useState(existingRule?.rule_priority || 0);
  const [isActive, setIsActive] = useState(existingRule?.is_active ?? true);
  
  // Source conditions
  const [sourceType, setSourceType] = useState<string>(existingRule?.source_type || 'category');
  const [sourceCategoryId, setSourceCategoryId] = useState(existingRule?.source_category_id || '');
  const [sourceNewArrival, setSourceNewArrival] = useState<boolean | null>(
    existingRule?.source_new_arrival_required ?? null
  );
  const [sourceMinQuantity, setSourceMinQuantity] = useState(existingRule?.source_min_quantity || 1);
  const [sourceMinAmount, setSourceMinAmount] = useState(existingRule?.source_min_amount || 0);
  
  // Benefit type
  const [benefitType, setBenefitType] = useState<string>(existingRule?.benefit_type || 'free_items');
  
  // Free items benefit
  const [targetCategoryId, setTargetCategoryId] = useState(existingRule?.target_category_id || '');
  const [targetNewArrival, setTargetNewArrival] = useState<boolean | null>(
    existingRule?.target_new_arrival_required ?? null
  );
  const [freeQuantity, setFreeQuantity] = useState(existingRule?.free_quantity || 1);
  const [freeItemSelection, setFreeItemSelection] = useState(existingRule?.free_item_selection || 'cheapest');
  const [freeDiscountPercentage, setFreeDiscountPercentage] = useState(existingRule?.free_discount_percentage || 100);
  
  // Discount benefits
  const [discountAmount, setDiscountAmount] = useState(existingRule?.discount_amount || 0);
  const [discountPercentage, setDiscountPercentage] = useState(existingRule?.discount_percentage || 0);
  const [discountTargetType, setDiscountTargetType] = useState(existingRule?.discount_target_type || 'source');
  const [discountTargetCategoryId, setDiscountTargetCategoryId] = useState(
    existingRule?.discount_target_category_id || ''
  );
  const [discountTargetNewArrival, setDiscountTargetNewArrival] = useState<boolean | null>(
    existingRule?.discount_target_new_arrival ?? null
  );
  
  // Bundle pricing
  const [bundleFixedPrice, setBundleFixedPrice] = useState(existingRule?.bundle_fixed_price || 0);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const cats = await categoryService.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    }
  }

  async function handleSave() {
    if (!ruleName.trim()) {
      toast.error('Rule name is required');
      return;
    }

    setLoading(true);
    try {
      const ruleData = {
        coupon_id: couponId,
        rule_name: ruleName,
        rule_priority: rulePriority,
        is_active: isActive,
        description: ruleDescription || null,
        
        // Source conditions
        source_type: sourceType,
        source_category_id: sourceCategoryId || null,
        source_new_arrival_required: sourceNewArrival,
        source_min_quantity: sourceMinQuantity,
        source_min_amount: sourceMinAmount || null,
        
        // Benefit type
        benefit_type: benefitType,
        
        // Free items
        target_category_id: (targetCategoryId && targetCategoryId !== '__same__') ? targetCategoryId : null,
        target_new_arrival_required: targetNewArrival,
        free_quantity: freeQuantity || null,
        free_item_selection: freeItemSelection || null,
        free_discount_percentage: freeDiscountPercentage || null,
        
        // Discounts
        discount_amount: discountAmount || null,
        discount_percentage: discountPercentage || null,
        discount_target_type: discountTargetType || null,
        discount_target_category_id: (discountTargetCategoryId && discountTargetCategoryId !== '__any__') ? discountTargetCategoryId : null,
        discount_target_new_arrival: discountTargetNewArrival,
        
        // Bundle
        bundle_fixed_price: bundleFixedPrice || null,
      };

      if (existingRule) {
        await couponRulesService.updateCouponRule(existingRule.id, ruleData);
        toast.success('Rule updated successfully');
      } else {
        await couponRulesService.createCouponRule(ruleData);
        toast.success('Rule created successfully');
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error('Failed to save rule');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          {existingRule ? 'Edit Rule' : 'New Rule'} - {couponCode}
        </h3>

        {/* Basic Info */}
        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="ruleName">Rule Name *</Label>
            <Input
              id="ruleName"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="e.g., Buy 1 Get 1 Free"
            />
          </div>

          <div>
            <Label htmlFor="ruleDescription">Description</Label>
            <Textarea
              id="ruleDescription"
              value={ruleDescription}
              onChange={(e) => setRuleDescription(e.target.value)}
              placeholder="Explain what this rule does"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rulePriority">Priority</Label>
              <Input
                id="rulePriority"
                type="number"
                value={rulePriority}
                onChange={(e) => setRulePriority(Number(e.target.value))}
              />
              <p className="text-xs text-stone-500 mt-1">Higher priority rules are evaluated first</p>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Switch checked={isActive} onCheckedChange={setIsActive} id="isActive" />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Source Conditions */}
        <div className="space-y-4 mb-6">
          <h4 className="font-semibold">Source Conditions (What customer must buy)</h4>

          <div>
            <Label htmlFor="sourceType">Source Type *</Label>
            <Select value={sourceType} onValueChange={setSourceType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="new_arrival">New Arrival Status</SelectItem>
                <SelectItem value="category_new_arrival">Category + New Arrival</SelectItem>
                <SelectItem value="any">Any Product</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(sourceType === 'category' || sourceType === 'category_new_arrival') && (
            <div>
              <Label htmlFor="sourceCategoryId">Category</Label>
              <Select value={sourceCategoryId} onValueChange={setSourceCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(sourceType === 'new_arrival' || sourceType === 'category_new_arrival') && (
            <div>
              <Label htmlFor="sourceNewArrival">New Arrival Required</Label>
              <Select
                value={sourceNewArrival === null ? 'any' : sourceNewArrival ? 'true' : 'false'}
                onValueChange={(val) => setSourceNewArrival(val === 'any' ? null : val === 'true')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes (New Arrivals Only)</SelectItem>
                  <SelectItem value="false">No (Exclude New Arrivals)</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sourceMinQuantity">Minimum Quantity *</Label>
              <Input
                id="sourceMinQuantity"
                type="number"
                min="1"
                value={sourceMinQuantity}
                onChange={(e) => setSourceMinQuantity(Number(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="sourceMinAmount">Minimum Amount (₹)</Label>
              <Input
                id="sourceMinAmount"
                type="number"
                min="0"
                value={sourceMinAmount}
                onChange={(e) => setSourceMinAmount(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Target Benefit */}
        <div className="space-y-4">
          <h4 className="font-semibold">Target Benefit (What discount they receive)</h4>

          <div>
            <Label htmlFor="benefitType">Benefit Type *</Label>
            <Select value={benefitType} onValueChange={setBenefitType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free_items">Free Items (Buy X Get Y)</SelectItem>
                <SelectItem value="fixed_discount">Fixed Discount</SelectItem>
                <SelectItem value="percentage_discount">Percentage Discount</SelectItem>
                <SelectItem value="bundle_price">Bundle Fixed Price</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Free Items Fields */}
          {benefitType === 'free_items' && (
            <>
              <div>
                <Label htmlFor="targetCategoryId">Target Category (leave empty for same as source)</Label>
                <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Same as source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__same__">Same as source</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="targetNewArrival">Target New Arrival</Label>
                <Select
                  value={targetNewArrival === null ? 'any' : targetNewArrival ? 'true' : 'false'}
                  onValueChange={(val) => setTargetNewArrival(val === 'any' ? null : val === 'true')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes (New Arrivals Only)</SelectItem>
                    <SelectItem value="false">No (Exclude New Arrivals)</SelectItem>
                    <SelectItem value="any">Any</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="freeQuantity">Free Quantity</Label>
                  <Input
                    id="freeQuantity"
                    type="number"
                    min="1"
                    value={freeQuantity}
                    onChange={(e) => setFreeQuantity(Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="freeItemSelection">Selection</Label>
                  <Select value={freeItemSelection} onValueChange={(value) => setFreeItemSelection(value as typeof freeItemSelection)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cheapest">Cheapest</SelectItem>
                      <SelectItem value="most_expensive">Most Expensive</SelectItem>
                      <SelectItem value="customer_choice">Customer Choice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="freeDiscountPercentage">Discount %</Label>
                  <Input
                    id="freeDiscountPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={freeDiscountPercentage}
                    onChange={(e) => setFreeDiscountPercentage(Number(e.target.value))}
                  />
                </div>
              </div>
            </>
          )}

          {/* Fixed Discount Fields */}
          {benefitType === 'fixed_discount' && (
            <>
              <div>
                <Label htmlFor="discountAmount">Discount Amount (₹) *</Label>
                <Input
                  id="discountAmount"
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="discountTargetType">Apply Discount To</Label>
                <Select value={discountTargetType} onValueChange={(value) => setDiscountTargetType(value as typeof discountTargetType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="source">Source Items</SelectItem>
                    <SelectItem value="target">Specific Target Items</SelectItem>
                    <SelectItem value="cart">Entire Cart</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {discountTargetType === 'target' && (
                <>
                  <div>
                    <Label htmlFor="discountTargetCategoryId">Target Category</Label>
                    <Select value={discountTargetCategoryId} onValueChange={setDiscountTargetCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__any__">Any category</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="discountTargetNewArrival">Target New Arrival</Label>
                    <Select
                      value={discountTargetNewArrival === null ? 'any' : discountTargetNewArrival ? 'true' : 'false'}
                      onValueChange={(val) => setDiscountTargetNewArrival(val === 'any' ? null : val === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes (New Arrivals Only)</SelectItem>
                        <SelectItem value="false">No (Exclude New Arrivals)</SelectItem>
                        <SelectItem value="any">Any</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </>
          )}

          {/* Percentage Discount Fields */}
          {benefitType === 'percentage_discount' && (
            <>
              <div>
                <Label htmlFor="discountPercentage">Discount Percentage (%) *</Label>
                <Input
                  id="discountPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="discountTargetType">Apply Discount To</Label>
                <Select value={discountTargetType} onValueChange={(value) => setDiscountTargetType(value as typeof discountTargetType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="source">Source Items</SelectItem>
                    <SelectItem value="target">Specific Target Items</SelectItem>
                    <SelectItem value="cart">Entire Cart</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {discountTargetType === 'target' && (
                <>
                  <div>
                    <Label htmlFor="discountTargetCategoryId">Target Category</Label>
                    <Select value={discountTargetCategoryId} onValueChange={setDiscountTargetCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__any__">Any category</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="discountTargetNewArrival">Target New Arrival</Label>
                    <Select
                      value={discountTargetNewArrival === null ? 'any' : discountTargetNewArrival ? 'true' : 'false'}
                      onValueChange={(val) => setDiscountTargetNewArrival(val === 'any' ? null : val === 'true')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes (New Arrivals Only)</SelectItem>
                        <SelectItem value="false">No (Exclude New Arrivals)</SelectItem>
                        <SelectItem value="any">Any</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </>
          )}

          {/* Bundle Price Fields */}
          {benefitType === 'bundle_price' && (
            <div>
              <Label htmlFor="bundleFixedPrice">Bundle Fixed Price (₹) *</Label>
              <Input
                id="bundleFixedPrice"
                type="number"
                min="0"
                value={bundleFixedPrice}
                onChange={(e) => setBundleFixedPrice(Number(e.target.value))}
              />
              <p className="text-xs text-stone-500 mt-1">
                Total price for all source items combined
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Rule
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}
