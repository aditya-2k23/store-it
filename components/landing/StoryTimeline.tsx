"use client";

import { motion } from "framer-motion";
import { Cloud, Tag, Users, History } from "lucide-react";
import { cn } from "@/lib/utils";

export const StoryTimeline = () => {
  const steps = [
    {
      title: "Upload",
      desc: "Drop any file format. Infinite scale.",
      icon: <Cloud className="w-5 h-5 text-[#56B8FF]" />,
      color: "#56B8FF",
      visual: (
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-2 mt-2">
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-semibold text-slate-300">
              pitch_deck_v2.key
            </span>
            <span className="text-[#56B8FF]">74%</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#56B8FF] h-full rounded-full w-[74%] animate-pulse"></div>
          </div>
        </div>
      ),
    },
    {
      title: "AI Organizes",
      desc: "Auto-tagging and smart folders.",
      icon: <Tag className="w-5 h-5 text-[#F9AB72]" />,
      color: "#F9AB72",
      visual: (
        <div className="flex flex-wrap gap-2 mt-3">
          {["#Q3Marketing", "#Invoice", "#Design", "#PDF"].map((tag, i) => (
            <span
              key={i}
              className="text-[9px] font-bold px-2.5 py-1 rounded-full border"
              style={{
                backgroundColor: `${["#F9AB72", "#FA7275", "#56B8FF", "#3DD9B3"][i % 4]}15`,
                color: ["#F9AB72", "#FA7275", "#56B8FF", "#3DD9B3"][i % 4],
                borderColor: `${["#F9AB72", "#FA7275", "#56B8FF", "#3DD9B3"][i % 4]}25`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      ),
    },
    {
      title: "Team Collaborates",
      desc: "Realtime edits, comments, sharing.",
      icon: <Users className="w-5 h-5 text-[#3DD9B3]" />,
      color: "#3DD9B3",
      visual: (
        <div className="flex items-center gap-3 mt-3">
          <div className="flex -space-x-1.5">
            {["#FA7275", "#56B8FF", "#3DD9B3"].map((color, i) => (
              <div
                key={i}
                className="w-5.5 h-5.5 rounded-full border border-dark-200 flex items-center justify-center text-[8px] font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {["A", "M", "K"][i]}
              </div>
            ))}
          </div>
          <span className="text-[10px] text-green font-semibold animate-pulse flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green"></span> 3 active
            editors
          </span>
        </div>
      ),
    },
    {
      title: "Files Evolve",
      desc: "Versioning and history tracking.",
      icon: <History className="w-5 h-5 text-brand" />,
      color: "#FA7275",
      visual: (
        <div className="space-y-1.5 mt-3 border-l border-white/10 pl-3">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-brand font-bold">v1.4 - Latest</span>
            <span className="text-light-200">Just now</span>
          </div>
          <div className="flex items-center justify-between text-[10px] opacity-60">
            <span className="text-slate-300 font-medium">v1.3 - Edited</span>
            <span className="text-light-200">1 hr ago</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="py-24 bg-dark-200 text-white relative overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-blue/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-brand/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-brand/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold mb-12 tracking-tight">
          Your files tell a story.
        </h2>

        <div className="relative">
          {/* Vertical timeline line with gradient glow */}
          <div className="absolute left-8 md:left-1/2 top-4 bottom-4 w-[2px] bg-linear-to-b from-blue/40 via-brand/40 to-[#FA7275]/40 md:-translate-x-1/2"></div>

          {steps.map((step, idx) => (
            <div
              key={idx}
              className={cn(
                "flex flex-row items-start gap-6 mb-8 relative group",
                idx % 2 === 0 ? "md:flex-row-reverse" : "",
              )}
            >
              {/* Spacer for desktop layout alignment */}
              <div className="hidden md:block md:w-1/2"></div>

              {/* Timeline Center Point / Icon Box */}
              <div className="relative z-20 shrink-0 md:translate-x-px">
                {/* Glow ring behind icon */}
                <div
                  className="absolute inset-0 rounded-full blur-md opacity-25 group-hover:opacity-60 transition-opacity duration-300"
                  style={{ backgroundColor: step.color }}
                ></div>
                <div
                  className="relative z-10 w-16 h-16 bg-dark-100/90 border rounded-full flex items-center justify-center transition-all duration-300 transform group-hover:scale-110 shadow-lg"
                  style={{
                    borderColor: `${step.color}30`,
                    boxShadow: `0 0 20px ${step.color}15`,
                  }}
                >
                  {step.icon}
                </div>
              </div>

              {/* Glassmorphic step card */}
              <div className="w-full md:w-1/2">
                <motion.div
                  whileInView={{ opacity: 1, x: 0 }}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -40 : 40 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  whileHover={{ y: -5, scale: 1.01 }}
                  className="backdrop-blur-md bg-white/5 border border-white/10 rounded-[24px] p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-xl text-left"
                >
                  <h4 className="text-xl font-bold mb-2 flex items-center gap-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300 select-none">
                      0{idx + 1}
                    </span>
                    <span style={{ color: step.color }}>{step.title}</span>
                  </h4>
                  <p className="text-light-200 text-sm mb-4 leading-relaxed">
                    {step.desc}
                  </p>
                  {step.visual}
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
