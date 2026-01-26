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
        {/* Header - Enhanced */}
        <div className="text-center mb-16 md:mb-20">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-stone-900 mb-5 tracking-tight">Our Collections</h1>
          <p className="text-stone-600 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
            Explore our curated collections of premium clothing and accessories
          </p>
        </div>

        {/* Collections Grid - Enhanced */}
        {collections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug}`}
                className="group"
              >
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 border border-stone-100 hover:border-stone-200">
                  {/* Collection Image - Enhanced */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-stone-100 to-amber-50">
                    {collection.image_url ? (
                      <img
                        src={collection.image_url}
                        alt={collection.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-stone-400" />
                      </div>
                    )}
                    
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {collection.featured && (
                      <div className="absolute top-5 right-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-amber-500/30">
                        Featured
                      </div>
                    )}
                  </div>

                  {/* Collection Info - Enhanced */}
                  <div className="p-7">
                    <h2 className="text-2xl md:text-3xl font-light text-stone-900 mb-3 group-hover:text-amber-600 transition-colors tracking-tight">
                      {collection.name}
                    </h2>
                    {collection.description && (
                      <p className="text-stone-600 line-clamp-2 leading-relaxed mb-4">
                        {collection.description}
                      </p>
                    )}
                    <div className="mt-5 flex items-center text-amber-600 font-semibold text-sm tracking-wide">
                      View Collection
                      <svg
                        className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300"
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
          <div className="text-center py-24">
            <Package className="w-24 h-24 text-stone-300 mx-auto mb-6" />
            <h2 className="text-3xl font-light text-stone-900 mb-3 tracking-tight">No Collections Yet</h2>
            <p className="text-stone-600 text-lg leading-relaxed">
              Check back soon for our curated collections
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
