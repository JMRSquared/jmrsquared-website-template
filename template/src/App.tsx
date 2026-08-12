import {
  CtaSection,
  FeaturesSection,
  FooterSection,
  HeaderSection,
  HeroSection,
  ShowcaseSection,
} from './features/site-template';
import { DemoPreviewBanner } from './shared/components/DemoPreviewBanner';
import { JmrSquaredAttribution } from './shared/components/JmrSquaredAttribution';

export function App() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <DemoPreviewBanner />
      <HeaderSection />
      <HeroSection />
      <FeaturesSection />
      <ShowcaseSection />
      <CtaSection />
      <FooterSection />
      <JmrSquaredAttribution />
    </div>
  );
}
