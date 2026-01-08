'use client';

import Link from 'next/link';
import { ShoppingBag, Search, Menu, X, User, Heart, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { LoginModal } from './auth/LoginModal';
import { SignupModal } from './auth/SignupModal';
import { SearchModal } from './SearchModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  const { user, profile, signOut, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="relative inline-flex items-center gap-2 group">
              <span className="text-2xl font-semibold tracking-tight text-stone-900 logo-fill-animation group-hover:animate-micro-bounce">
                thelv8
              </span>
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-amber-600 cart-dot-slide"></div>
                <svg 
                  className="absolute top-0 left-0 w-2 h-2 text-green-600 opacity-0 group-hover:animate-tick-pulse" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/shop" className="text-stone-700 hover:text-stone-900 transition-colors font-medium">
                Shop
              </Link>
              <Link href="/collections" className="text-stone-700 hover:text-stone-900 transition-colors font-medium">
                Collections
              </Link>
              <Link href="/new-arrivals" className="text-stone-700 hover:text-stone-900 transition-colors font-medium">
                New Arrivals
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-amber-700 hover:text-amber-900 transition-colors font-medium">
                  Admin
                </Link>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button 
                className="p-2 hover:bg-stone-100 rounded-full transition-colors hidden md:block"
                onClick={() => setShowSearchModal(true)}
              >
                <Search className="w-5 h-5 text-stone-700" />
              </button>
              
              {user ? (
                <>
                  <Link href="/wishlist" className="p-2 hover:bg-stone-100 rounded-full transition-colors relative hidden md:block">
                    <Heart className="w-5 h-5 text-stone-700" />
                    {wishlist.length > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-amber-600 rounded-full text-xs text-white flex items-center justify-center">
                        {wishlist.length}
                      </span>
                    )}
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full hidden md:flex">
                        <User className="w-5 h-5 text-stone-700" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">{profile?.full_name || 'My Account'}</p>
                          <p className="text-xs text-stone-500">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/account">My Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/orders">My Orders</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/addresses">Addresses</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/wishlist">Wishlist</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/support">AI Support</Link>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/admin">Admin Dashboard</Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hidden md:flex"
                  onClick={() => setShowLoginModal(true)}
                >
                  <User className="w-5 h-5 text-stone-700" />
                </Button>
              )}

              <Link href="/cart" className="p-2 hover:bg-stone-100 rounded-full transition-colors relative">
                <ShoppingBag className="w-5 h-5 text-stone-700" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-amber-600 rounded-full text-xs text-white flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              <button
                className="md:hidden p-2 hover:bg-stone-100 rounded-full transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {isMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-stone-200 animate-slide-down">
              <div className="flex flex-col gap-4">
                <button 
                  className="text-left text-stone-700 hover:text-stone-900 transition-colors font-medium py-2 flex items-center gap-2"
                  onClick={() => {
                    setShowSearchModal(true);
                    setIsMenuOpen(false);
                  }}
                >
                  <Search className="w-5 h-5" />
                  Search Products
                </button>
                <Link href="/shop" className="text-stone-700 hover:text-stone-900 transition-colors font-medium py-2">
                  Shop
                </Link>
                <Link href="/collections" className="text-stone-700 hover:text-stone-900 transition-colors font-medium py-2">
                  Collections
                </Link>
                <Link href="/new-arrivals" className="text-stone-700 hover:text-stone-900 transition-colors font-medium py-2">
                  New Arrivals
                </Link>
                {user ? (
                  <>
                    <Link href="/account" className="text-stone-700 hover:text-stone-900 transition-colors font-medium py-2">
                      My Account
                    </Link>
                    <Link href="/wishlist" className="text-stone-700 hover:text-stone-900 transition-colors font-medium py-2">
                      Wishlist
                    </Link>
                    <Link href="/support" className="text-stone-700 hover:text-stone-900 transition-colors font-medium py-2">
                      AI Support
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="text-amber-700 hover:text-amber-900 transition-colors font-medium py-2">
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="text-left text-red-600 hover:text-red-700 transition-colors font-medium py-2"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="text-left text-stone-700 hover:text-stone-900 transition-colors font-medium py-2"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          setShowSignupModal(true);
        }}
      />

      <SignupModal
        open={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={() => {
          setShowSignupModal(false);
          setShowLoginModal(true);
        }}
      />

      <SearchModal
        open={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </>
  );
}
