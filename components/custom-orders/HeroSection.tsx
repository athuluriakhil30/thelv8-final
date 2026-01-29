'use client';

import Link from 'next/link';
import { ArrowRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      const navHeight = 80; // Approximate height of fixed navbar
      const targetPosition = contactSection.offsetTop - navHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/70 via-stone-900/50 to-stone-900/80 z-10" />
        <div 
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=2070')",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-6 text-center text-white max-w-4xl">
        <h1 className="text-5xl md:text-7xl font-normal mb-6 tracking-tight">
          Premium Custom Apparel Solutions
        </h1>
        
        <p className="text-xl md:text-2xl mb-10 text-stone-200 font-light max-w-3xl mx-auto leading-relaxed">
          Transform your vision into wearable art with professional-grade customization for brands, businesses, and creators.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={scrollToContact}
            size="lg"
            className="bg-white text-stone-900 hover:bg-stone-100 text-lg px-8 py-6 h-auto"
          >
            Request a Quote
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-2 border-white text-white hover:bg-white hover:text-stone-900 text-lg px-8 py-6 h-auto bg-transparent"
          >
            <a href="https://feitifnjvtipgkinmuhp.supabase.co/storage/v1/object/public/products/announcements/THE%20LV8%20CUSTOM.pdf" download>
              <Download className="mr-2 h-5 w-5" />
              Download Brochure
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
