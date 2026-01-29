import { Store, Calendar, Briefcase, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const clients = [
  {
    icon: Store,
    title: 'Clothing Brands',
    description: 'Launch and scale your apparel line with premium manufacturing and retail-ready packaging.',
  },
  {
    icon: Calendar,
    title: 'Event Organizers',
    description: 'Create memorable branded merchandise for festivals, concerts, sports events, and conferences.',
  },
  {
    icon: Briefcase,
    title: 'Corporate Clients',
    description: 'Elevate your company culture with professional branded uniforms and corporate gifts.',
  },
  {
    icon: Users,
    title: 'Resellers & Creators',
    description: 'Build your business with reliable production, fast turnarounds, and consistent quality.',
  },
];

export function WhoWeServe() {
  return (
    <section className="py-12 md:py-20 bg-stone-50">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-5xl font-normal text-center mb-12 text-stone-900">
          Who We Serve
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {clients.map((client, index) => (
            <Card key={index} className="border-stone-200 bg-white hover:shadow-md transition-shadow">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-stone-100 text-stone-900 mb-4">
                  <client.icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-stone-900">{client.title}</h3>
                <p className="text-sm text-stone-600 leading-relaxed">{client.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
