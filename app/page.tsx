import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesPreview } from '@/components/landing/features-preview';
import { HowItWorks } from '@/components/landing/how-it-works';
import { TrustSignals } from '@/components/landing/trust-signals';
import { Footer } from '@/components/landing/footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesPreview />
        <HowItWorks />
        <TrustSignals />
      </main>
      <Footer />
    </>
  );
}
