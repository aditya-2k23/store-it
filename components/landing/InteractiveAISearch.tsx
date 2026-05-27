"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckCircle2, ImageIcon, FileText, ChevronRight } from "lucide-react";

export const InteractiveAISearch = () => {
  const [searchValue, setSearchValue] = useState("");
  const fullText = "internship resume pdf";
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const delay = (ms: number) =>
      new Promise<void>((resolve) => {
        if (!isMounted) return;
        timeoutId = setTimeout(resolve, ms);
      });

    const runLoop = async () => {
      while (isMounted) {
        // Reset state
        setSearchValue("");
        setShowResults(false);

        // Wait 1s before starting typing
        await delay(1000);
        if (!isMounted) break;

        // Type search text forward
        for (let i = 1; i <= fullText.length; i++) {
          setSearchValue(fullText.slice(0, i));
          await delay(100);
          if (!isMounted) break;
        }
        if (!isMounted) break;

        // Show search results after 400ms
        await delay(400);
        if (!isMounted) break;
        setShowResults(true);

        // Keep results visible for 5s before starting boomerang erase
        await delay(5000);
        if (!isMounted) break;

        // Smoothly fade out search results first
        setShowResults(false);
        await delay(400); // Wait for the fade-out exit animation to complete
        if (!isMounted) break;

        // Backspace search text character by character (boomerang)
        for (let i = fullText.length - 1; i >= 0; i--) {
          setSearchValue(fullText.slice(0, i));
          await delay(50); // Faster delete cadence
          if (!isMounted) break;
        }
        if (!isMounted) break;
      }
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        runLoop();
        observer.disconnect();
      }
    });

    const el = document.getElementById("ai-search");
    if (el) observer.observe(el);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <section
      id="ai-search"
      className="py-24 bg-white border-y border-light-300 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl md:text-5xl font-bold text-dark-100 mb-6 tracking-tight">
            AI Search that just works.
          </h2>
          <p className="text-lg text-light-100 mb-8 max-w-md">
            Stop remembering file names. Ask Storey naturally and it retrieves
            exactly what you need by understanding the content of every file.
          </p>
          <ul className="space-y-4 text-light-100">
            {[
              "Contextual understanding",
              "OCR inside images & PDFs",
              "Auto-tagging & categorization",
              "Instant results <50ms",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded bg-brand/10 text-brand flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          {/* Decorative glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 h-100 bg-brand/5 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="bg-white rounded-2xl border border-light-300 shadow-drop-1 p-6 relative z-10">
            <div className="flex items-center bg-light-300/50 rounded-xl px-4 py-3 mb-6 border border-light-300 focus-within:border-brand/50 transition-colors">
              <Search className="w-5 h-5 text-brand mr-3" />
              <div className="text-dark-100 font-medium text-lg w-full flex items-center h-6">
                {searchValue}
                <span className="w-0.5 h-6 bg-brand animate-caret-blink ml-1"></span>
              </div>
            </div>

            <div className="h-[250px] overflow-hidden relative">
              <AnimatePresence mode="wait">
                {!showResults ? (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-light-300 rounded-xl bg-light-400/10"
                  >
                    <Search className="w-8 h-8 text-light-200/80 mb-3 animate-pulse" />
                    <p className="text-xs font-semibold text-slate-500 mb-1">
                      Search naturally by content
                    </p>
                    <p className="text-[10px] text-light-200 mb-4 max-w-[240px]">
                      Storey indexes files, OCR texts, and metadata automatically.
                    </p>
                    <div className="flex gap-2 justify-center">
                      {["invoice", "notes.txt", "design png"].map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full border border-slate-200/50 font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                  >
                    <div className="text-xs font-semibold text-light-200 mb-4 tracking-wider uppercase">
                      Best Matches
                    </div>
                    {[
                      {
                        n: "David_Internship_Resume_2024.pdf",
                        ext: "pdf",
                        type: "Document",
                        color: "text-brand",
                        bg: "bg-brand/10",
                      },
                      {
                        n: "Resume_Draft_V2.docx",
                        ext: "docx",
                        type: "Document",
                        color: "text-blue",
                        bg: "bg-blue/10",
                      },
                      {
                        n: "Scan_Resume_Old.png",
                        ext: "png",
                        type: "Image (OCR)",
                        color: "text-orange",
                        bg: "bg-orange/10",
                      },
                    ].map((res, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-light-400 group cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-lg ${res.bg} flex items-center justify-center`}
                          >
                            {res.ext === "png" ? (
                              <ImageIcon className={`w-5 h-5 ${res.color}`} />
                            ) : (
                              <FileText className={`w-5 h-5 ${res.color}`} />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-dark-100 group-hover:text-brand transition-colors">
                              {res.n}
                            </p>
                            <p className="text-xs text-light-200">
                              {res.type} • 2.4 MB
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-light-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
