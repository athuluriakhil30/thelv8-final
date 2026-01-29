import { MessageSquare, Settings, Factory, Search, Truck } from 'lucide-react';

const steps = [
  {
    icon: MessageSquare,
    title: 'Consultation',
    description: 'Share your vision and requirements with our team',
  },
  {
    icon: Settings,
    title: 'Production Setup',
    description: 'We prepare designs, materials, and processes',
  },
  {
    icon: Factory,
    title: 'Manufacturing',
    description: 'Professional production with attention to detail',
  },
  {
    icon: Search,
    title: 'Quality Inspection',
    description: 'Rigorous checks to ensure perfection',
  },
  {
    icon: Truck,
    title: 'Delivery',
    description: 'Secure packaging and timely shipment',
  },
];

export function OurProcess() {
  return (
    <section className="py-12 md:py-20 bg-stone-50">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-5xl font-normal text-center mb-6 text-stone-900">
          Our Process
        </h2>
        <p className="text-center text-stone-600 mb-12 max-w-2xl mx-auto">
          A streamlined journey from concept to delivery
        </p>

        <div className="relative max-w-6xl mx-auto">
          {/* Desktop Timeline */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-stone-300 -translate-y-1/2" />
          
          <div className="grid md:grid-cols-5 gap-8 relative">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-stone-900 text-white mb-4 relative z-10 border-4 border-white shadow-md">
                  <step.icon className="h-9 w-9" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-stone-900">{step.title}</h3>
                <p className="text-sm text-stone-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
