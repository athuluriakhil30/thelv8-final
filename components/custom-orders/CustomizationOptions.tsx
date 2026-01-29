import { Shirt, Layers, Palette } from 'lucide-react';

const placements = [
  'Front Print',
  'Back Print',
  'Chest Logo',
  'Oversized Print',
  'Sleeve Print',
  'Neck Branding',
];

const techniques = [
  'Screen Printing',
  'Puff Print',
  'Embroidery',
  'Sublimation',
  'Mixed Techniques',
];

export function CustomizationOptions() {
  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-5xl font-normal text-center mb-6 text-stone-900">
          Endless Creative Possibilities
        </h2>
        <p className="text-center text-stone-600 mb-12 max-w-2xl mx-auto">
          Express your unique vision with our comprehensive customization options
        </p>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Print Placement Options */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-stone-900 text-white flex items-center justify-center">
                <Shirt className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-normal text-stone-900">Print Placement</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {placements.map((placement, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-stone-900" />
                  <span className="text-stone-700 font-medium">{placement}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Printing Techniques */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-stone-900 text-white flex items-center justify-center">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-normal text-stone-900">Decoration Techniques</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {techniques.map((technique, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-stone-900" />
                  <span className="text-stone-700 font-medium">{technique}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
