"use client";

import React from "react";

export const StatsSection = () => {
  return (
    <section className="py-20 border-y border-light-300 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { num: "99.9%", label: "Uptime SLA" },
          { num: "250M+", label: "Files Managed" },
          { num: "<50ms", label: "Search Latency" },
          { num: "Zero", label: "Knowledge Leak" },
        ].map((stat, i) => (
          <div key={i} className="text-center">
            <h4 className="text-4xl md:text-5xl font-black text-brand mb-2">
              {stat.num}
            </h4>
            <p className="text-sm font-medium text-light-100 uppercase tracking-widest">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
