"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileText, ImageIcon, Play, FileCode } from "lucide-react";

export const PreviewsSection = () => {
  return (
    <section className="py-24 bg-light-400 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-dark-100 tracking-tight">
          Everything in its right place.
        </h2>
        <p className="text-lg text-light-100 mt-4">
          Native previews for every file format you care about.
        </p>
      </div>

      <div className="relative max-w-350 mx-auto pb-10">
        <div className="flex items-center justify-center flex-wrap gap-4 md:gap-8 px-4">
          {[
            {
              name: "Brand_Guidelines.pdf",
              icon: <FileText className="w-8 h-8 text-brand" />,
              bg: "bg-white",
              border: "border-light-300",
            },
            {
              name: "Landing_Vector.svg",
              icon: <ImageIcon className="w-8 h-8 text-orange" />,
              bg: "bg-white",
              border: "border-light-300",
            },
            {
              name: "Intro_Video.mp4",
              icon: <Play className="w-8 h-8 text-blue" />,
              bg: "bg-white",
              border: "border-light-300",
            },
            {
              name: "utils.ts",
              icon: <FileCode className="w-8 h-8 text-green" />,
              bg: "bg-dark-100",
              border: "border-dark-100",
              dark: true,
            },
          ].map((file, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10, rotate: i % 2 === 0 ? 2 : -2 }}
              className={`w-50 h-60 md:w-65 md:h-75 rounded-2xl ${file.bg} shadow-drop-1 border ${file.border} overflow-hidden group flex flex-col`}
            >
              <div
                className={`flex-2 flex flex-col items-center justify-center gap-4 ${file.dark ? "bg-dark-200" : "bg-light-400/50"} group-hover:scale-105 transition-transform duration-500`}
              >
                {file.icon}
              </div>
              <div
                className={`flex-1 p-4 flex flex-col justify-center border-t ${file.border}`}
              >
                <p
                  className={`text-xs md:text-sm font-semibold truncate ${file.dark ? "text-white" : "text-dark-100"}`}
                >
                  {file.name}
                </p>
                <p
                  className={`text-[10px] md:text-xs ${file.dark ? "text-light-200" : "text-light-100"}`}
                >
                  Modified 2 hours ago
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
