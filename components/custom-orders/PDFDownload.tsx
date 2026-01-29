'use client';

import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PDFDownload() {
  return (
    <section className="py-12 md:py-16 bg-stone-900 text-white">
      <div className="container mx-auto px-6 text-center">
        <h3 className="text-2xl font-normal mb-4">
          Want a Detailed Overview?
        </h3>
        <p className="text-stone-300 mb-6 max-w-2xl mx-auto">
          Download our comprehensive Custom Apparel Brochure for complete information about our services, 
          processes, and pricing guidelines.
        </p>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="border-2 border-white text-white hover:bg-white hover:text-stone-900 inline-flex items-center gap-2"
        >
          <a href="/custom-apparel-brochure.pdf" download className="inline-flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            <span>Download PDF Brochure</span>
          </a>
        </Button>
      </div>
    </section>
  );
}
