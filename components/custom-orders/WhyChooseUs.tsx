import { Sparkles, Shield, Cpu } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Sparkles,
    title: 'Premium Materials & Inks',
    description: 'Top-tier fabrics combined with vibrant, long-lasting colors that bring your designs to life.',
  },
  {
    icon: Shield,
    title: 'Wash-Tested Durability',
    description: 'Our prints never fade, crack, or peel. Built for long-term wear with complete confidence.',
  },
  {
    icon: Cpu,
    title: 'Advanced Technology',
    description: 'Professional-grade machines ensure precision and consistency at any scale.',
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-5xl font-normal text-center mb-12 text-stone-900">
          Why Choose THE LV8
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="border-stone-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-10 pb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone-900 text-white mb-6">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-medium mb-3 text-stone-900">{feature.title}</h3>
                <p className="text-stone-600 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
