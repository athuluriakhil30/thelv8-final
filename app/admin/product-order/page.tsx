'use client';

import { useEffect, useState } from 'react';
import { productService } from '@/services/product.service';
import { Product } from '@/types';
import { GripVertical, Save, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/helpers';

type DisplayType = 'shop' | 'new_arrivals';

export default function ProductOrderManagement() {
  const [displayType, setDisplayType] = useState<DisplayType>('shop');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  useEffect(() => {
    loadProducts();
  }, [displayType]);

  async function loadProducts() {
    try {
      setLoading(true);
      let data: Product[];
      
      if (displayType === 'shop') {
        const result = await productService.getProducts({ limit: 100 });
        data = result.products;
      } else {
        data = await productService.getNewArrivals();
      }
      
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === index) return;

    const newProducts = [...products];
    const draggedProduct = newProducts[draggedItem];
    
    // Remove dragged item
    newProducts.splice(draggedItem, 1);
    // Insert at new position
    newProducts.splice(index, 0, draggedProduct);
    
    setProducts(newProducts);
    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleManualOrderChange = (productId: string, newOrder: number) => {
    const updatedProducts = products.map(p => 
      p.id === productId 
        ? { ...p, [displayType === 'shop' ? 'shop_display_order' : 'new_arrival_display_order']: newOrder }
        : p
    );
    
    // Sort by the new order
    updatedProducts.sort((a, b) => {
      const orderA = displayType === 'shop' 
        ? (a.shop_display_order || 0) 
        : (a.new_arrival_display_order || 0);
      const orderB = displayType === 'shop' 
        ? (b.shop_display_order || 0) 
        : (b.new_arrival_display_order || 0);
      return orderA - orderB;
    });
    
    setProducts(updatedProducts);
  };

  const handleSaveOrder = async () => {
    try {
      setSaving(true);
      
      // Create updates array with new positions
      const updates = products.map((product, index) => ({
        id: product.id,
        order: index + 1, // Start from 1
      }));

      if (displayType === 'shop') {
        await productService.bulkUpdateShopDisplayOrders(updates);
      } else {
        await productService.bulkUpdateNewArrivalDisplayOrders(updates);
      }

      toast.success('Display order saved successfully!');
      await loadProducts(); // Reload to confirm
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save display order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-light text-stone-900 mb-2">Product Display Order</h1>
        <p className="text-stone-600">Drag and drop to reorder products or enter manual order numbers</p>
      </div>

      {/* Display Type Toggle */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setDisplayType('shop')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            displayType === 'shop'
              ? 'bg-stone-900 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          Shop Page Order
        </button>
        <button
          onClick={() => setDisplayType('new_arrivals')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            displayType === 'new_arrivals'
              ? 'bg-stone-900 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          New Arrivals Order
        </button>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider w-12">
                  Drag
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider w-20">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider w-20">
                  Image
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                  SKU
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {products.map((product, index) => (
                <tr
                  key={product.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`hover:bg-stone-50 transition-colors cursor-move ${
                    draggedItem === index ? 'opacity-50' : ''
                  }`}
                >
                  <td className="px-4 py-4">
                    <GripVertical className="w-5 h-5 text-stone-400" />
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="number"
                      min="1"
                      value={
                        displayType === 'shop'
                          ? product.shop_display_order || index + 1
                          : product.new_arrival_display_order || index + 1
                      }
                      onChange={(e) => handleManualOrderChange(product.id, parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <img
                      src={product.image_url || product.images[0]}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-stone-900">{product.name}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-stone-600">{formatPrice(product.price)}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-stone-500">{product.sku}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <button
          onClick={loadProducts}
          className="px-6 py-3 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={handleSaveOrder}
          disabled={saving}
          className="px-6 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Display Order'}
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-medium text-amber-900 mb-2">Instructions:</h3>
        <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
          <li>Drag and drop rows to reorder products</li>
          <li>Or manually enter order numbers in the "Order" column</li>
          <li>Lower numbers appear first (1 appears before 2, etc.)</li>
          <li>Products with order 0 will appear in chronological order at the end</li>
          <li>Click "Save Display Order" to apply changes</li>
        </ul>
      </div>
    </div>
  );
}
