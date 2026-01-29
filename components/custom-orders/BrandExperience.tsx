import { Tag, Package, CheckCircle } from 'lucide-react';

const features = [
  {
    icon: Tag,
    title: 'Custom Tags & Labels',
    description: 'Your brand identity woven into every detail, from care labels to hang tags.',
  },
  {
    icon: Package,
    title: 'Branded Packaging',
    description: 'Retail-ready presentation that reinforces your brand from unboxing to wearing.',
  },
  {
    icon: CheckCircle,
    title: 'Quality Inspection',
    description: 'Every piece undergoes rigorous inspection to ensure it meets our premium standards.',
  },
];

export function BrandExperience() {
  return (
    <section className="py-12 md:py-20 bg-stone-900 text-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-5xl font-normal text-center mb-6">
          Complete Brand Experience
        </h2>
        <p className="text-center text-stone-300 mb-12 max-w-2xl mx-auto">
          Beyond printing—we deliver a holistic brand experience
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white text-stone-900 mb-6">
                <feature.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-medium mb-3">{feature.title}</h3>
              <p className="text-stone-300 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
