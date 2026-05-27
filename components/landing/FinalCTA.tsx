"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const FinalCTA = () => {
  return (
    <section
      id="pricing"
      className="py-32 bg-light-400 relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-150 h-150 bg-brand/5 rounded-full blur-[100px]"></div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-150 h-150 bg-blue/5 rounded-full blur-[100px]"></div>
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-4xl md:text-6xl font-bold text-dark-100 tracking-tight mb-8">
          Your files deserve <br /> better than folders.
        </h2>
        <p className="text-xl text-light-100 mb-12 max-w-2xl mx-auto">
          Join thousands of teams moving at the speed of thought. Ditch the
          manual organization and let Storey handle it.
        </p>
        <div className="flex justify-center">
          <Link href="/sign-up">
            <Button className="bg-brand hover:bg-brand-100 text-white rounded-full px-10 py-7 text-lg font-medium shadow-drop-2 hover:shadow-drop-1 transition-all w-full sm:w-auto flex items-center gap-2 cursor-pointer">
              Start Using Storey <ArrowRight />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
