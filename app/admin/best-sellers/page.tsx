'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Trash2, GripVertical, Loader2, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { bestSellerService } from '@/services/bestseller.service';
import { productService } from '@/services/product.service';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/helpers';
import type { Product, BestSeller } from '@/types';

export default function BestSellersAdmin() {
  const [loading, setLoading] = useState(true);
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [addingProduct, setAddingProduct] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [bestSellersData, productsData] = await Promise.all([
        bestSellerService.getAllBestSellers(),
        productService.getProducts({ limit: 1000 })
      ]);
      
      setBestSellers(bestSellersData);
      setAllProducts(productsData.products);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load best sellers');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddProduct() {
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }

    try {
      setAddingProduct(true);
      const maxOrder = bestSellers.length > 0 
        ? Math.max(...bestSellers.map(bs => bs.display_order)) 
        : -1;
      
      await bestSellerService.addBestSeller(selectedProductId, maxOrder + 1);
      toast.success('Product added to best sellers');
      setSelectedProductId('');
      await loadData();
    } catch (error: any) {
      console.error('Error adding product:', error);
      if (error?.message?.includes('duplicate')) {
        toast.error('Product is already in best sellers');
      } else {
        toast.error('Failed to add product');
      }
    } finally {
      setAddingProduct(false);
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('Remove this product from best sellers?')) return;

    try {
      await bestSellerService.removeBestSeller(id);
      toast.success('Product removed from best sellers');
      await loadData();
    } catch (error) {
      console.error('Error removing product:', error);
      toast.error('Failed to remove product');
    }
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    try {
      await bestSellerService.toggleBestSeller(id, !currentStatus);
      toast.success(currentStatus ? 'Best seller deactivated' : 'Best seller activated');
      await loadData();
    } catch (error) {
      console.error('Error toggling best seller:', error);
      toast.error('Failed to update status');
    }
  }

  async function handleMoveUp(index: number) {
    if (index === 0) return;

    const newBestSellers = [...bestSellers];
    [newBestSellers[index - 1], newBestSellers[index]] = [newBestSellers[index], newBestSellers[index - 1]];

    try {
      await bestSellerService.reorderBestSellers(
        newBestSellers.map((bs, idx) => ({ id: bs.id, display_order: idx }))
      );
      setBestSellers(newBestSellers);
      toast.success('Order updated');
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to update order');
    }
  }

  async function handleMoveDown(index: number) {
    if (index === bestSellers.length - 1) return;

    const newBestSellers = [...bestSellers];
    [newBestSellers[index], newBestSellers[index + 1]] = [newBestSellers[index + 1], newBestSellers[index]];

    try {
      await bestSellerService.reorderBestSellers(
        newBestSellers.map((bs, idx) => ({ id: bs.id, display_order: idx }))
      );
      setBestSellers(newBestSellers);
      toast.success('Order updated');
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to update order');
    }
  }

  // Get products not already in best sellers
  const availableProducts = allProducts.filter(
    p => !bestSellers.some(bs => bs.product_id === p.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <button className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Best Sellers</h1>
            <p className="text-stone-600 mt-1">Manage featured best selling products on homepage</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Add Product to Best Sellers
          </CardTitle>
          <CardDescription>
            Manually curate best sellers or leave empty to auto-calculate from order data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - {formatPrice(product.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddProduct} disabled={addingProduct || !selectedProductId}>
              {addingProduct ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add Product
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Best Sellers ({bestSellers.length})</CardTitle>
          <CardDescription>
            {bestSellers.length === 0 
              ? 'No manual best sellers set. Homepage will show auto-calculated best sellers from order data.'
              : 'Drag to reorder. These will be shown on the homepage.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bestSellers.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-stone-300" />
              <p>No manual best sellers configured</p>
              <p className="text-sm">Add products above or let the system auto-calculate from sales data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bestSellers.map((bestSeller, index) => (
                <div 
                  key={bestSeller.id} 
                  className="flex items-center gap-4 p-4 border rounded-lg bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 hover:bg-stone-100 rounded disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === bestSellers.length - 1}
                      className="p-1 hover:bg-stone-100 rounded disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>

                  <GripVertical className="w-5 h-5 text-stone-400" />

                  <div className="flex-shrink-0 w-16 h-16 bg-stone-100 rounded-lg overflow-hidden">
                    {bestSeller.product?.image_url ? (
                      <img 
                        src={bestSeller.product.image_url} 
                        alt={bestSeller.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-stone-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-stone-900">
                      {bestSeller.product?.name || 'Unknown Product'}
                    </h3>
                    <p className="text-sm text-stone-600">
                      {bestSeller.product?.price ? formatPrice(bestSeller.product.price) : 'N/A'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-stone-500">Order: {index + 1}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={bestSeller.is_active}
                      onCheckedChange={() => handleToggleActive(bestSeller.id, bestSeller.is_active)}
                    />
                    <span className="text-sm text-stone-600">
                      {bestSeller.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleRemove(bestSeller.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
