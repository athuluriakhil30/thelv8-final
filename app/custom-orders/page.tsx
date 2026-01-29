import { Metadata } from 'next';
import { HeroSection } from '@/components/custom-orders/HeroSection';
import { TrustSection } from '@/components/custom-orders/TrustSection';
import { WhyChooseUs } from '@/components/custom-orders/WhyChooseUs';
import { WhoWeServe } from '@/components/custom-orders/WhoWeServe';
import { CustomizationOptions } from '@/components/custom-orders/CustomizationOptions';
import { BrandExperience } from '@/components/custom-orders/BrandExperience';
import { OrderOptions } from '@/components/custom-orders/OrderOptions';
import { OurProcess } from '@/components/custom-orders/OurProcess';
import { FinalCTA } from '@/components/custom-orders/FinalCTA';
import { PDFDownload } from '@/components/custom-orders/PDFDownload';

export const metadata: Metadata = {
  title: 'Custom Orders - Premium Apparel Customization | THE LV8',
  description: 'Transform your vision into wearable art with professional-grade customization for brands, businesses, and creators. Premium materials, advanced technology, and exceptional quality.',
};

export default function CustomOrdersPage() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <TrustSection />
      <WhyChooseUs />
      <WhoWeServe />
      <CustomizationOptions />
      <BrandExperience />
      <OrderOptions />
      <OurProcess />
      <FinalCTA />
      <PDFDownload />
    </div>
  );
}
