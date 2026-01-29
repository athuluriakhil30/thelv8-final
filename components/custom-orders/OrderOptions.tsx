import { TrendingUp, Sparkle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function OrderOptions() {
  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-5xl font-normal text-center mb-6 text-stone-900">
          Flexible Order Options
        </h2>
        <p className="text-center text-stone-600 mb-12 max-w-2xl mx-auto">
          From small batches to large-scale production, we've got you covered
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          <Card className="border-stone-200 hover:shadow-md transition-shadow">
            <CardContent className="pt-8 pb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-stone-900 text-white flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-normal text-stone-900">Bulk Orders</h3>
              </div>
              <p className="text-stone-600 leading-relaxed mb-4">
                Perfect for brands, corporates, and resale. Scalable production with competitive pricing 
                that gets better as your volume grows.
              </p>
              <ul className="space-y-2 text-stone-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                  <span>100+ units: Volume discounts</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                  <span>Dedicated account manager</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                  <span>Priority production scheduling</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-stone-200 hover:shadow-md transition-shadow">
            <CardContent className="pt-8 pb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-stone-900 text-white flex items-center justify-center">
                  <Sparkle className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-normal text-stone-900">Small Batch Orders</h3>
              </div>
              <p className="text-stone-600 leading-relaxed mb-4">
                Ideal for prototypes, limited drops, and sample testing. Same premium quality, 
                no matter the quantity.
              </p>
              <ul className="space-y-2 text-stone-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                  <span>Minimum 10 pieces</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                  <span>Fast turnaround times</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                  <span>Test before scaling up</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <blockquote className="text-center text-xl md:text-2xl font-light text-stone-700 max-w-3xl mx-auto italic border-l-4 border-stone-900 pl-6">
          "Whether you need 10 pieces or 10,000, the quality remains the same."
        </blockquote>
      </div>
    </section>
  );
}
