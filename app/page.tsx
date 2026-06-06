import {
  Navbar,
  HeroSection,
  FeaturesBento,
  InteractiveAISearch,
  CollaborationSection,
  StoryTimeline,
  PreviewsSection,
  StatsSection,
  FinalCTA,
  Footer,
} from "@/components/landing";

import LandingRedirect from "@/components/landing/LandingRedirect";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <LandingRedirect />
      <Navbar />
      <HeroSection />
      <FeaturesBento />
      <InteractiveAISearch />
      <CollaborationSection />
      <StoryTimeline />
      <PreviewsSection />
      <StatsSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}
