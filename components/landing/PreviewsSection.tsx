"use client";

import { motion } from "framer-motion";
import { ImageIcon, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export const PreviewsSection = () => {
  const files = [
    {
      name: "Brand_Guidelines.pdf",
      bg: "bg-white",
      border: "border-light-300",
      modifiedAt: "Modified 2 hours ago",
      preview: (
        <div className="w-full h-full p-4 flex flex-col justify-between bg-white relative overflow-hidden select-none">
          {/* PDF header */}
          <div className="flex items-center justify-between border-b border-light-300 pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded bg-brand/10 flex items-center justify-center text-brand font-bold text-[8px]">
                PDF
              </div>
              <span className="text-[8px] font-bold text-dark-100 uppercase tracking-wider">
                Guidelines
              </span>
            </div>
            <span className="text-[6px] text-light-100">Page 1 of 12</span>
          </div>
          {/* PDF Page content */}
          <div className="space-y-2 grow">
            <div className="h-2.5 bg-brand/20 rounded w-2/3"></div>
            <div className="h-1.5 bg-dark-100/10 rounded w-1/2"></div>
            {/* Color swatches */}
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              <div className="h-8 rounded bg-brand flex flex-col items-center justify-center text-[5px] text-white font-bold shadow-sm">
                <span>Primary</span>
                <span>#FA7275</span>
              </div>
              <div className="h-8 rounded bg-blue flex flex-col items-center justify-center text-[5px] text-white font-bold shadow-sm">
                <span>Accent</span>
                <span>#56B8FF</span>
              </div>
              <div className="h-8 rounded bg-green flex flex-col items-center justify-center text-[5px] text-white font-bold shadow-sm">
                <span>Success</span>
                <span>#3DD9B3</span>
              </div>
            </div>
            {/* Mock text lines */}
            <div className="space-y-1 mt-2">
              <div className="h-1 bg-dark-100/5 rounded w-full"></div>
              <div className="h-1 bg-dark-100/5 rounded w-[95%]"></div>
              <div className="h-1 bg-dark-100/5 rounded w-[80%]"></div>
            </div>
          </div>
        </div>
      ),
    },
    {
      name: "Landing_Vector.svg",
      bg: "bg-white",
      border: "border-light-300",
      modifiedAt: "Modified 12 mins ago",
      preview: (
        <div className="w-full h-full bg-light-400 p-3 flex flex-col justify-between relative overflow-hidden select-none">
          {/* SVG Header */}
          <div className="flex items-center justify-between text-[8px] text-light-100 mb-2 border-b border-light-300 pb-1.5">
            <span className="font-semibold text-orange uppercase tracking-wider">
              Vector Canvas
            </span>
            <span>800 x 600</span>
          </div>
          {/* Vector shape scene */}
          <div className="grow relative bg-white rounded-lg border border-light-300 overflow-hidden flex items-center justify-center">
            <div className="absolute top-2 left-2 w-12 h-12 rounded-full bg-orange/15 border border-orange/30"></div>
            <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-blue/10 border border-blue/20"></div>
            <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-brand/10 border border-brand/20"></div>
            <div className="absolute w-10 h-10 border-2 border-dashed border-orange/30 rotate-45"></div>
            <ImageIcon className="w-6 h-6 text-orange opacity-45 relative z-10" />
          </div>
        </div>
      ),
    },
    {
      name: "Intro_Video.mp4",
      bg: "bg-white",
      border: "border-light-300",
      modifiedAt: "Modified 3 days ago",
      preview: (
        <div className="w-full h-full relative overflow-hidden bg-slate-900 group select-none">
          {/* Video poster and mesh background */}
          <div className="absolute inset-0 bg-linear-to-tr from-slate-950 via-slate-800 to-brand/30 flex items-center justify-center">
            {/* Play Button Overlay */}
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
          {/* Player controls */}
          <div className="absolute bottom-0 inset-x-0 p-3 bg-linear-to-t from-black/90 to-transparent flex flex-col gap-2">
            {/* Timeline progress */}
            <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
              <div className="bg-brand h-full rounded-full w-[45%]"></div>
            </div>
            {/* Info and timing */}
            <div className="flex justify-between items-center text-[8px] text-white/80 font-mono">
              <span className="font-semibold text-brand">01:24 / 03:00</span>
              <span>1080p</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      name: "utils.ts",
      bg: "bg-dark-100",
      border: "border-dark-100",
      dark: true,
      modifiedAt: "Modified Just now",
      preview: (
        <div className="w-full h-full bg-dark-200 p-4 font-mono text-[9px] leading-relaxed text-slate-300 relative overflow-hidden select-none">
          {/* Editor Header tabs */}
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
            <div className="flex items-center gap-1.5">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand/80"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-orange/80"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-green/80"></span>
              </div>
              <span className="text-[7px] text-light-200">TypeScript</span>
            </div>
            <span className="text-[7px] text-light-200">UTF-8</span>
          </div>
          {/* Code Body */}
          <div className="flex gap-2">
            <div className="text-light-200 opacity-30 select-none text-right pr-1 border-r border-white/5 space-y-0.5">
              <div>1</div>
              <div>2</div>
              <div>3</div>
              <div>4</div>
              <div>5</div>
            </div>
            <div className="space-y-0.5 grow">
              <div>
                <span className="text-blue font-bold">const</span>{" "}
                <span className="text-brand">formatSize</span> = (
              </div>
              <div className="pl-3">
                <span className="text-orange">bytes</span>:{" "}
                <span className="text-green">number</span>
              </div>
              <div>
                ): <span className="text-green">string</span> =&gt; &#123;
              </div>
              <div className="pl-3">
                <span className="text-blue font-bold">return</span>{" "}
                <span className="text-brand">prettyBytes</span>(bytes);
              </div>
              <div>&#125;;</div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="py-24 bg-light-400 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-dark-100 tracking-tight">
          <span className="font-medium font-dynapuff text-brand">
            Everything
          </span>{" "}
          in its right place.
        </h2>
        <p className="text-lg text-light-100 mt-4">
          Native previews for every file format you care about.
        </p>
      </div>

      <div className="relative max-w-350 mx-auto pb-10">
        <div className="flex items-center justify-center flex-wrap gap-6 md:gap-8 px-4">
          {files.map((file, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10, rotate: i % 2 === 0 ? 1 : -1 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "w-52 h-64 md:w-68 md:h-76 rounded-3xl overflow-hidden group flex flex-col border shadow-sm hover:shadow-drop-2 bg-white",
                file.border,
              )}
            >
              {/* File Preview Container */}
              <div className="flex-2 overflow-hidden relative border-b border-light-300">
                <div className="w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out">
                  {file.preview}
                </div>
              </div>
              {/* Card Footer Details */}
              <div
                className={cn(
                  "flex-1 p-4 flex flex-col justify-center",
                  file.dark
                    ? "bg-dark-100 border-t-0"
                    : "bg-white border-t border-light-300",
                )}
              >
                <p
                  className={cn(
                    "text-xs md:text-sm font-semibold truncate",
                    file.dark ? "text-white" : "text-dark-100",
                  )}
                >
                  {file.name}
                </p>
                <p
                  className={cn(
                    "text-[10px] md:text-xs mt-0.5",
                    file.dark ? "text-light-200" : "text-light-100",
                  )}
                >
                  {file.modifiedAt}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
