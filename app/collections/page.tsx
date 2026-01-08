'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Package, Loader2 } from 'lucide-react';
import { collectionService } from '@/services/collection.service';
import { Collection } from '@/types';
import { toast } from 'sonner';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      loadCollections();
    }
  }, []);

  async function loadCollections() {
    try {
      setLoading(true);
      const data = await collectionService.getPublishedCollections();
      setCollections(data);
    } catch (error) {
      console.error('Error loading collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-6 py-12 pt-24 md:pt-28">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-light text-stone-900 mb-4">Our Collections</h1>
          <p className="text-stone-600 text-lg max-w-2xl mx-auto">
            Explore our curated collections of premium clothing and accessories
          </p>
        </div>

        {/* Collections Grid */}
        {collections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug}`}
                className="group"
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                  {/* Collection Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-stone-200">
                    {collection.image_url ? (
                      <img
                        src={collection.image_url}
                        alt={collection.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-stone-400" />
                      </div>
                    )}
                    {collection.featured && (
                      <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Featured
                      </div>
                    )}
                  </div>

                  {/* Collection Info */}
                  <div className="p-6">
                    <h2 className="text-2xl font-light text-stone-900 mb-2 group-hover:text-amber-700 transition-colors">
                      {collection.name}
                    </h2>
                    {collection.description && (
                      <p className="text-stone-600 line-clamp-2">
                        {collection.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center text-amber-700 font-medium">
                      View Collection
                      <svg
                        className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Package className="w-20 h-20 text-stone-300 mx-auto mb-6" />
            <h2 className="text-2xl font-light text-stone-900 mb-2">No Collections Yet</h2>
            <p className="text-stone-600">
              Check back soon for our curated collections
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
