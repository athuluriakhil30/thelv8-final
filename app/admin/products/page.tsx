'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, Loader2, Package, Image as ImageIcon } from 'lucide-react';
import { productService } from '@/services/product.service';
import { categoryService } from '@/services/category.service';
import { formatPrice } from '@/lib/helpers';
import { toast } from 'sonner';
import { MultiImageUpload } from '@/components/admin/MultiImageUpload';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    compare_at_price: '',
    category_id: '',
    sku: '',
    stock: '',
    stockBySize: {} as Record<string, number>,
    stockByColorSize: {} as Record<string, Record<string, number>>, // New field
    image_url: '',
    images: [''],
    sizes: [''],
    colors: [''],
    new_arrival: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        productService.getAllProducts(),
        categoryService.getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      price: '',
      compare_at_price: '',
      category_id: '',
      sku: '',
      stock: '',
      stockBySize: {},
      stockByColorSize: {}, // Reset new field
      image_url: '',
      images: [''],
      sizes: [''],
      colors: [''],
      new_arrival: false,
    });
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      // Generate slug from product name
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Build images array - start with main image_url, then add additional images
      const imagesArray = [
        formData.image_url,
        ...formData.images.filter(img => img.trim())
      ].filter(img => img);
      
      // Determine which stock system to use
      const hasColors = formData.colors.filter(c => c.trim()).length > 0;
      const hasSizes = formData.sizes.filter(s => s.trim()).length > 0;
      
      let stockData: any = {};
      if (hasColors && hasSizes && Object.keys(formData.stockByColorSize).length > 0) {
        // Use color+size stock tracking
        stockData.stock_by_color_size = formData.stockByColorSize;
        // Stock and stock_by_size will be auto-calculated by trigger
      } else if (hasSizes && Object.keys(formData.stockBySize).length > 0) {
        // Use size-only stock tracking (legacy)
        const totalStock = Object.values(formData.stockBySize).reduce((sum, qty) => sum + (qty || 0), 0);
        stockData.stock = totalStock;
        stockData.stock_by_size = formData.stockBySize;
      } else {
        // Use simple stock tracking
        stockData.stock = parseInt(formData.stock) || 0;
      }
      
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        category_id: formData.category_id || null,
        sku: formData.sku,
        slug: slug,
        ...stockData,
        images: imagesArray,
        sizes: formData.sizes.filter(s => s.trim()),
        colors: formData.colors.filter(c => c.trim()),
        published: true,
        new_arrival: formData.new_arrival,
      };

      if (editingId) {
        await productService.updateProduct(editingId, productData);
        toast.success('Product updated successfully');
      } else {
        await productService.createProduct(productData);
        toast.success('Product created successfully');
      }
      
      await loadData();
      resetForm();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await productService.deleteProduct(id);
      toast.success('Product deleted successfully');
      await loadData();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  }

  function handleEdit(product: any) {
    // Extract main image and additional images separately
    const mainImage = product.images?.[0] || '';
    const additionalImages = product.images?.length > 1 ? product.images.slice(1) : [''];
    
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      compare_at_price: product.compare_at_price ? product.compare_at_price.toString() : '',
      category_id: product.category_id,
      sku: product.sku || '',
      stock: product.stock.toString(),
      stockBySize: product.stock_by_size || {},
      stockByColorSize: product.stock_by_color_size || {}, // Load color+size stock
      image_url: mainImage,
      images: additionalImages,
      sizes: product.sizes && product.sizes.length > 0 ? product.sizes : [''],
      colors: product.colors && product.colors.length > 0 ? product.colors : [''],
      new_arrival: product.new_arrival || false,
    });
    setEditingId(product.id);
    setShowForm(true);
  }

  // Category Management Functions
  function openCategoryModal(category?: any) {
    if (category) {
      setCategoryFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
      });
      setEditingCategoryId(category.id);
    } else {
      setCategoryFormData({ name: '', slug: '', description: '' });
      setEditingCategoryId(null);
    }
    setShowCategoryModal(true);
  }

  function closeCategoryModal() {
    setShowCategoryModal(false);
    setCategoryFormData({ name: '', slug: '', description: '' });
    setEditingCategoryId(null);
  }

  async function handleCategorySubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const slug = categoryFormData.slug || categoryFormData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const categoryData = {
        name: categoryFormData.name,
        slug,
        description: categoryFormData.description,
      };

      if (editingCategoryId) {
        await categoryService.updateCategory(editingCategoryId, categoryData);
        toast.success('Category updated successfully');
      } else {
        await categoryService.createCategory(categoryData);
        toast.success('Category created successfully');
      }

      await loadData();
      closeCategoryModal();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Failed to save category');
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    if (!confirm('Are you sure you want to delete this category? Products using this category will be unlinked.')) return;
    
    try {
      await categoryService.deleteCategory(categoryId);
      toast.success('Category deleted successfully');
      await loadData();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.message || 'Failed to delete category');
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  return (
    <div className="pt-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-light text-stone-900 mb-2">Products Management</h1>
          <p className="text-stone-600">{products.length} total products</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors font-medium w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-4 md:p-8 shadow-md mb-8">
          <h2 className="text-xl md:text-2xl font-medium text-stone-900 mb-6">
            {editingId ? 'Edit Product' : 'Add New Product'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                  placeholder="Product SKU"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-stone-700">
                    Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => openCategoryModal()}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add Category
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="flex-1 px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {formData.category_id && (
                    <button
                      type="button"
                      onClick={() => {
                        const cat = categories.find(c => c.id === formData.category_id);
                        if (cat) openCategoryModal(cat);
                      }}
                      className="px-4 py-3 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                      title="Edit category"
                    >
                      <Edit2 className="w-4 h-4 text-stone-600" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Compare At Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.compare_at_price}
                  onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                  placeholder="0.00"
                />
                <p className="text-xs text-stone-500 mt-1">
                  Original price to show as strikethrough (optional)
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Stock Management *
                </label>
                
                {/* Show total stock */}
                <div className="text-xs text-stone-500 mb-3">
                  {(() => {
                    const colors = formData.colors.filter(c => c.trim());
                    const sizes = formData.sizes.filter(s => s.trim());
                    
                    if (colors.length > 0 && sizes.length > 0) {
                      // Calculate from stockByColorSize
                      const total = Object.values(formData.stockByColorSize).reduce((sum, sizeObj) => {
                        return sum + Object.values(sizeObj).reduce((s, qty) => s + (qty || 0), 0);
                      }, 0);
                      return `Total Stock: ${total} units (tracked by Color + Size)`;
                    } else if (sizes.length > 0) {
                      // Calculate from stockBySize
                      const total = Object.values(formData.stockBySize).reduce((sum, qty) => sum + (qty || 0), 0);
                      return `Total Stock: ${total} units (tracked by Size only)`;
                    } else {
                      return `Total Stock: ${formData.stock || 0} units`;
                    }
                  })()}
                </div>

                {/* Stock by Color + Size (if both exist) */}
                {formData.colors.filter(c => c.trim()).length > 0 && 
                 formData.sizes.filter(s => s.trim()).length > 0 ? (
                  <div className="space-y-4">
                    {formData.colors.filter(c => c.trim()).map((color, colorIdx) => (
                      <div key={colorIdx} className="border border-stone-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-stone-700 mb-3 capitalize">
                          {color} - Stock by Size
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {formData.sizes.filter(s => s.trim()).map((size, sizeIdx) => (
                            <div key={sizeIdx} className="flex flex-col">
                              <label className="text-xs font-medium text-stone-600 mb-1">
                                {size.toUpperCase()}
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={formData.stockByColorSize[color]?.[size] || 0}
                                onChange={(e) => {
                                  const newStock = { ...formData.stockByColorSize };
                                  if (!newStock[color]) newStock[color] = {};
                                  newStock[color][size] = parseInt(e.target.value) || 0;
                                  setFormData({ ...formData, stockByColorSize: newStock });
                                }}
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm"
                                placeholder="0"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : formData.sizes.filter(s => s.trim()).length > 0 ? (
                  /* Stock by Size only (legacy) */
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {formData.sizes.filter(s => s.trim()).map((size, idx) => (
                      <div key={idx} className="flex flex-col">
                        <label className="text-xs font-medium text-stone-600 mb-1">
                          {size.toUpperCase()}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.stockBySize[size] || 0}
                          onChange={(e) => {
                            const newStockBySize = { ...formData.stockBySize };
                            newStockBySize[size] = parseInt(e.target.value) || 0;
                            setFormData({ ...formData, stockBySize: newStockBySize });
                          }}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 text-sm"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Simple stock input */
                  <div className="text-sm text-stone-500 italic p-4 bg-stone-50 rounded-lg">
                    Please enter sizes and/or colors first to enable advanced stock tracking
                  </div>
                )}
              </div>

            </div>

            {/* Image Upload Section - Replaces manual URL input */}
            <div className="mb-6">
              <MultiImageUpload
                values={[formData.image_url, ...formData.images].filter(img => img.trim())}
                onChange={(urls) => {
                  // First URL is main image, rest are additional
                  const [mainImage = '', ...additionalImages] = urls;
                  setFormData({ 
                    ...formData, 
                    image_url: mainImage,
                    images: additionalImages 
                  });
                }}
                maxImages={10}
                label="Product Images"
                folder="products"
              />
              <p className="text-xs text-stone-500 mt-2">
                💡 Tip: Upload images directly or paste image URLs. First image will be the main product image.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                placeholder="Product description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Sizes (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.sizes.join(', ')}
                  onChange={(e) => setFormData({ ...formData, sizes: e.target.value.split(',').map(s => s.trim()) })}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                  placeholder="S, M, L, XL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Colors (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.colors.join(', ')}
                  onChange={(e) => setFormData({ ...formData, colors: e.target.value.split(',').map(c => c.trim()) })}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                  placeholder="Red, Blue, Green"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.new_arrival}
                  onChange={(e) => setFormData({ ...formData, new_arrival: e.target.checked })}
                  className="w-4 h-4 text-stone-900 border-stone-300 rounded focus:ring-stone-900"
                />
                <span className="text-sm font-medium text-stone-700">Mark as New Arrival</span>
              </label>
              <p className="text-xs text-stone-500 ml-6 mt-1">
                This product will appear in the New Arrivals section
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                className="px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors font-medium w-full sm:w-auto"
              >
                {editingId ? 'Update Product' : 'Create Product'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-8 py-3 bg-stone-200 text-stone-900 rounded-full hover:bg-stone-300 transition-colors font-medium w-full sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <>
          <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
            <div className="flex items-center gap-4">
              <Search className="w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="flex-1 px-4 py-2 border-0 focus:outline-none"
              />
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredProducts.map((product) => {
              const category = categories.find(c => c.id === product.category_id);
              return (
                <div key={product.id} className="bg-white rounded-lg shadow-md p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-stone-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-stone-900 truncate">{product.name}</h3>
                      <p className="text-xs text-stone-500 mt-1">{category?.name || 'N/A'}</p>
                      <p className="text-sm font-semibold text-stone-900 mt-1">₹{product.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-stone-500">SKU</p>
                      <p className="font-medium">{product.sku || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Stock</p>
                      <p className="font-medium">{product.stock || 0}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="flex-1 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">SKU</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-stone-700 whitespace-nowrap">Stock</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-stone-700 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredProducts.map((product) => {
                  const category = categories.find(c => c.id === product.category_id);
                  return (
                    <tr key={product.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <div className="flex items-center gap-2 md:gap-4">
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-stone-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-stone-900">{product.name}</p>
                            <p className="text-sm text-stone-500 line-clamp-1">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-stone-600">{product.sku || 'N/A'}</td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-stone-600">{category?.name || 'N/A'}</td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium text-stone-900">{formatPrice(product.price)}</td>
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          product.stock === 0 
                            ? 'bg-red-100 text-red-700'
                            : product.stock < 10
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {product.stock === 0 ? 'Out of Stock' : `${product.stock} units`}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <div className="flex justify-end gap-1 md:gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-600">
                  {searchTerm ? 'No products found matching your search' : 'No products yet'}
                </p>
              </div>
            )}
            </div>
          </div>
        </>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-medium text-stone-900 mb-4">
              {editingCategoryId ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                  placeholder="e.g., T-Shirts, Hoodies"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Slug (optional)
                </label>
                <input
                  type="text"
                  value={categoryFormData.slug}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                  placeholder="Auto-generated from name"
                />
                <p className="text-xs text-stone-500 mt-1">
                  Leave empty to auto-generate from name
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                  placeholder="Brief description of category"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors font-medium"
                >
                  {editingCategoryId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  className="px-6 py-3 bg-stone-200 text-stone-900 rounded-lg hover:bg-stone-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                {editingCategoryId && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteCategory(editingCategoryId);
                      closeCategoryModal();
                    }}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
