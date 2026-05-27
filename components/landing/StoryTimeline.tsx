"use client";

import React from "react";
import { motion } from "framer-motion";
import { Cloud, Tag, Users, History } from "lucide-react";

export const StoryTimeline = () => {
  return (
    <section className="py-24 bg-dark-200 text-white relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-brand/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold mb-16 tracking-tight">
          Your files tell a story.
        </h2>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-7.5 md:left-1/2 top-4 bottom-4 w-px bg-white/10 md:-translate-x-1/2"></div>

          {[
            {
              title: "Upload",
              desc: "Drop any file format. Infinite scale.",
              icon: <Cloud className="w-4 h-4 text-brand" />,
            },
            {
              title: "AI Organizes",
              desc: "Auto-tagging and smart folders.",
              icon: <Tag className="w-4 h-4 text-brand" />,
            },
            {
              title: "Team Collaborates",
              desc: "Realtime edits, comments, sharing.",
              icon: <Users className="w-4 h-4 text-brand" />,
            },
            {
              title: "Files Evolve",
              desc: "Versioning and history tracking.",
              icon: <History className="w-4 h-4 text-brand" />,
            },
          ].map((step, idx) => (
            <motion.div
              key={idx}
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true, margin: "-100px" }}
              className={`flex flex-row md:flex-row items-center gap-6 md:gap-12 mb-12 ${idx % 2 === 0 ? "md:flex-row-reverse text-left md:text-right" : "text-left"}`}
            >
              <div className="hidden md:block md:w-1/2"></div>

              <div className="relative z-10 w-15 h-15 shrink-0 bg-dark-100 border border-white/20 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(250,114,117,0.2)]">
                {step.icon}
              </div>

              <div className="md:w-1/2">
                <h4 className="text-xl font-bold mb-2">{step.title}</h4>
                <p className="text-light-200 text-sm">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
