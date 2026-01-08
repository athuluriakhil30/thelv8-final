'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Loader2, Package, Image as ImageIcon, Grid } from 'lucide-react';
import { collectionService } from '@/services/collection.service';
import { productService } from '@/services/product.service';
import { Collection, Product } from '@/types';
import { toast } from 'sonner';

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [managingCollection, setManagingCollection] = useState<Collection | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [collectionProducts, setCollectionProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    featured: false,
    published: true,
  });

  useEffect(() => {
    loadCollections();
  }, []);

  async function loadCollections() {
    try {
      setLoading(true);
      const data = await collectionService.getAllCollections();
      setCollections(data);
    } catch (error) {
      console.error('Error loading collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(collection: Collection) {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      slug: collection.slug,
      description: collection.description || '',
      image_url: collection.image_url || '',
      featured: collection.featured,
      published: collection.published,
    });
    setShowModal(true);
  }

  function handleNew() {
    setEditingCollection(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image_url: '',
      featured: false,
      published: true,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingCollection) {
        await collectionService.updateCollection(editingCollection.id, formData);
        toast.success('Collection updated successfully');
      } else {
        await collectionService.createCollection(formData);
        toast.success('Collection created successfully');
      }
      
      await loadCollections();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving collection:', error);
      toast.error('Failed to save collection');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this collection? This will remove all product associations.')) {
      return;
    }

    try {
      await collectionService.deleteCollection(id);
      toast.success('Collection deleted successfully');
      await loadCollections();
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error('Failed to delete collection');
    }
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async function handleManageProducts(collection: Collection) {
    setManagingCollection(collection);
    setShowProductsModal(true);
    setProductsLoading(true);
    
    try {
      // Load all products and collection's current products
      const [products, collProducts] = await Promise.all([
        productService.getAllProducts(),
        collectionService.getCollectionProducts(collection.id)
      ]);
      
      setAllProducts(products);
      setCollectionProducts(collProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  }

  async function handleToggleProduct(productId: string) {
    if (!managingCollection) return;
    
    const isInCollection = collectionProducts.some(p => p.id === productId);
    
    try {
      if (isInCollection) {
        await collectionService.removeProductFromCollection(managingCollection.id, productId);
        setCollectionProducts(collectionProducts.filter(p => p.id !== productId));
        toast.success('Product removed from collection');
      } else {
        await collectionService.addProductToCollection(managingCollection.id, productId);
        const product = allProducts.find(p => p.id === productId);
        if (product) {
          setCollectionProducts([...collectionProducts, product]);
        }
        toast.success('Product added to collection');
      }
    } catch (error) {
      console.error('Error toggling product:', error);
      toast.error('Failed to update product');
    }
  }

  const filteredCollections = collections.filter(
    (collection) =>
      collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.slug.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-light text-stone-900 mb-2">Collections</h1>
        <p className="text-stone-600">Manage your product collections</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 flex items-center gap-4 border border-stone-300 rounded-lg px-4">
          <Search className="w-5 h-5 text-stone-400" />
          <input
            type="text"
            placeholder="Search collections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 py-3 outline-none"
          />
        </div>
        <button
          onClick={handleNew}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Collection
        </button>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredCollections.map((collection) => (
          <div key={collection.id} className="bg-white rounded-lg shadow-md p-4 space-y-3">
            <div className="flex gap-3">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0">
                {collection.image_url ? (
                  <img src={collection.image_url} alt={collection.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-stone-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-stone-900">{collection.name}</h3>
                <p className="text-xs text-stone-500 mt-1 truncate">{collection.slug}</p>
                {collection.description && (
                  <p className="text-xs text-stone-600 mt-1 line-clamp-2">{collection.description}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <span className={`px-2 py-1 rounded ${collection.featured ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-600'}`}>
                {collection.featured ? 'Featured' : 'Not Featured'}
              </span>
              <span className={`px-2 py-1 rounded ${collection.published ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-600'}`}>
                {collection.published ? 'Published' : 'Draft'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleManageProducts(collection)}
                className="flex-1 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors"
              >
                Products
              </button>
              <button
                onClick={() => handleEdit(collection)}
                className="flex-1 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(collection.id)}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left py-4 px-6 text-sm font-medium text-stone-700 whitespace-nowrap">Image</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-stone-700 whitespace-nowrap">Name</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-stone-700 whitespace-nowrap">Slug</th>
              <th className="text-center py-4 px-6 text-sm font-medium text-stone-700 whitespace-nowrap">Featured</th>
              <th className="text-center py-4 px-6 text-sm font-medium text-stone-700 whitespace-nowrap">Published</th>
              <th className="text-right py-4 px-6 text-sm font-medium text-stone-700 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCollections.map((collection) => (
              <tr key={collection.id} className="border-b border-stone-200 hover:bg-stone-50">
                <td className="py-4 px-6">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-200">
                    {collection.image_url ? (
                      <img
                        src={collection.image_url}
                        alt={collection.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-stone-400" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="font-medium text-stone-900">{collection.name}</div>
                  {collection.description && (
                    <div className="text-sm text-stone-500 line-clamp-1">{collection.description}</div>
                  )}
                </td>
                <td className="py-4 px-6 text-sm text-stone-600">{collection.slug}</td>
                <td className="py-4 px-6 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      collection.featured
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {collection.featured ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="py-4 px-6 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      collection.published
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {collection.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleManageProducts(collection)}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Manage Products"
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(collection)}
                      className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(collection.id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {filteredCollections.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-600">
              {searchTerm ? 'No collections found matching your search' : 'No collections yet'}
            </p>
          </div>
        )}
      </div>

      {/* Collection Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <h2 className="text-3xl font-light text-stone-900 mb-6">
                {editingCollection ? 'Edit Collection' : 'New Collection'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (!editingCollection) {
                        setFormData((prev) => ({ ...prev, slug: generateSlug(e.target.value) }));
                      }
                    }}
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                    placeholder="Summer Collection 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                    placeholder="summer-collection-2024"
                  />
                  <p className="text-xs text-stone-500 mt-1">
                    URL-friendly version of the name
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                    placeholder="Collection description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 text-stone-900 border-stone-300 rounded focus:ring-stone-900"
                    />
                    <span className="text-sm font-medium text-stone-700">Featured Collection</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.published}
                      onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                      className="w-4 h-4 text-stone-900 border-stone-300 rounded focus:ring-stone-900"
                    />
                    <span className="text-sm font-medium text-stone-700">Published</span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-full sm:flex-1 px-6 py-3 border border-stone-300 text-stone-700 rounded-full hover:bg-stone-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:flex-1 px-6 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors font-medium"
                  >
                    {editingCollection ? 'Update' : 'Create'} Collection
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Products Management Modal */}
      {showProductsModal && managingCollection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-8 border-b border-stone-200">
              <h2 className="text-3xl font-light text-stone-900">
                Manage Products - {managingCollection.name}
              </h2>
              <p className="text-stone-600 mt-2">
                Select products to add to this collection ({collectionProducts.length} selected)
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {productsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {allProducts.map((product) => {
                    const isSelected = collectionProducts.some(p => p.id === product.id);
                    return (
                      <label
                        key={product.id}
                        className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-stone-900 bg-stone-50'
                            : 'border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleProduct(product.id)}
                          className="w-5 h-5 text-stone-900 border-stone-300 rounded focus:ring-stone-900"
                        />
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-stone-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-stone-900">{product.name}</div>
                          <div className="text-sm text-stone-600">{product.sku}</div>
                          <div className="text-sm font-medium text-stone-900 mt-1">
                            ₹{product.price.toLocaleString()}
                          </div>
                        </div>
                        {!product.published && (
                          <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                            Draft
                          </span>
                        )}
                        {product.featured && (
                          <span className="px-3 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                            Featured
                          </span>
                        )}
                      </label>
                    );
                  })}
                  {allProducts.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                      <p className="text-stone-600">No products available</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-8 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowProductsModal(false)}
                className="w-full px-6 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
