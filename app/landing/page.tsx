"use client";

import {
  Navbar,
  HeroSection,
  FeaturesBento,
  InteractiveAISearch,
  CollaborationSection,
  StoryTimeline,
  PreviewsSection,
  StatsSection,
  Testimonials,
  FinalCTA,
  Footer,
} from "@/components/landing";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <FeaturesBento />
      <InteractiveAISearch />
      <CollaborationSection />
      <StoryTimeline />
      <PreviewsSection />
      <StatsSection />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </main>
  );
}
