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
  FinalCTA,
  Footer,
} from "@/components/landing";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("ref") !== "internal") {
        const previousWorkspace = localStorage.getItem("storey_previous_workspace");
        if (previousWorkspace) {
          // If we have a previous workspace in local storage, redirect to dashboard.
          // The server layout uses active_workspace_id cookie to route correctly.
          router.push("/dashboard");
        } else {
          router.push("/workspaces");
        }
      }
    }
  }, [isLoaded, isSignedIn, router]);

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
      <FinalCTA />
      <Footer />
    </main>
  );
}
