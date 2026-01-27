'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingBag, Users, Settings, ArrowLeft, Loader2, Menu, X, Tag, Megaphone, Snowflake, ArrowUpDown, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Only redirect once loading is complete
    if (!loading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, isAdmin, loading, router]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-stone-900 mx-auto mb-4" />
          <p className="text-stone-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not admin
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-600">Redirecting...</p>
      </div>
    );
  }

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/product-order', label: 'Product Display Order', icon: ArrowUpDown },
    { href: '/admin/collections', label: 'Collections', icon: Package },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/verify-payment', label: 'Verify Payment', icon: CheckCircle },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/coupons', label: 'Coupons', icon: Tag },
    { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
    { href: '/admin/seasonal', label: 'Seasonal', icon: Snowflake },
    { href: '/admin/tickets', label: 'Support Tickets', icon: Megaphone },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-stone-900 text-white rounded-lg shadow-lg"
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside className={`w-64 bg-stone-900 text-white min-h-screen fixed left-0 top-0 z-40 transform transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-6">
            <h1 className="text-2xl font-light mb-8">
              the<span className="font-semibold italic">lv8</span> Admin
            </h1>
            
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-white text-stone-900'
                        : 'text-white hover:bg-stone-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-stone-800 transition-colors mt-8"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Store
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-0 pt-16 lg:pt-8">
          <div className="px-4 md:px-8 py-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
