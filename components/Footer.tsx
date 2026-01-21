import Link from 'next/link';
import { Instagram, Facebook, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <h3 className="text-2xl font-light mb-4">
              the<span className="font-semibold italic">lv8</span>
            </h3>
            <p className="text-stone-400 leading-relaxed">
              Elevating fashion through timeless design and exceptional quality.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-4">Shop</h4>
            <ul className="space-y-3">
              <li><Link href="/new-arrivals" className="text-stone-400 hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link href="/collections" className="text-stone-400 hover:text-white transition-colors">Collections</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4">Support</h4>
            <ul className="space-y-3">
              <li><Link href="/contact-us" className="text-stone-400 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/shipping-policy" className="text-stone-400 hover:text-white transition-colors">Shipping Policy</Link></li>
              <li><Link href="/cancelation-policy" className="text-stone-400 hover:text-white transition-colors">Cancelation Policy</Link></li>
              <li><Link href="/faq" className="text-stone-400 hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-4">Connect</h4>
            <div className="flex gap-4 mb-6">
              <a href="https://www.instagram.com/the_lv8" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-stone-400 text-sm">
              © 2026 thelv8. All rights reserved.
            </p>
            <p className="text-stone-500 text-xs">
              Designed & Maintained by{' '}
              <a 
                href="https://github.com/akhilathuluri" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-500 hover:text-amber-400 transition-colors font-medium"
              >
                Athuluri Akhil
              </a>
            </p>
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy-policy" className="text-stone-400 hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms-conditions" className="text-stone-400 hover:text-white transition-colors">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
