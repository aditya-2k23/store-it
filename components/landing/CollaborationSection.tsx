"use client";

import React from "react";
import { motion } from "framer-motion";
import { MousePointer2, FileText } from "lucide-react";

export const CollaborationSection = () => {
  return (
    <section id="collaboration" className="py-24 bg-white overflow-hidden text-center">
      <div className="max-w-4xl mx-auto px-6 mb-16 relative">
        <h2 className="text-3xl md:text-5xl font-bold text-dark-100 mb-6 tracking-tight">
          Built for teams, not just storage.
        </h2>
        <p className="text-lg text-light-100 max-w-2xl mx-auto">
          Work seamlessly with granular permissions, live cursors, and unified
          activity streams.
        </p>
      </div>

      <div className="max-w-5xl mx-auto relative h-120 flex justify-center items-center px-4">
        {/* Abstract collaborative workspace */}
        <div className="w-full max-w-3xl aspect-video bg-light-400/30 rounded-3xl border border-light-300 relative shadow-inner overflow-hidden flex flex-col pt-14">
          
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 h-14 border-b border-light-300 bg-white/70 backdrop-blur flex justify-between items-center px-6 z-30">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red/80"></div>
              <div className="w-3 h-3 rounded-full bg-orange/80"></div>
              <div className="w-3 h-3 rounded-full bg-green/80"></div>
            </div>
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-white bg-brand text-white flex items-center justify-center text-xs font-bold shrink-0">
                AL
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-blue text-white flex items-center justify-center text-xs font-bold shrink-0">
                JD
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-dark-100 text-white flex items-center justify-center text-xs font-bold shrink-0">
                +3
              </div>
            </div>
          </div>

          {/* Main workspace layout */}
          <div className="flex-1 p-6 flex gap-6 relative z-10 text-left h-full">
            
            {/* Left side: Simulated Markdown Editor */}
            <div className="flex-[2] bg-white rounded-2xl p-5 shadow-sm border border-light-300 relative overflow-hidden flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-light-300 pb-3">
                  <FileText className="w-4 h-4 text-brand" />
                  <span className="font-bold text-slate-800 text-xs tracking-tight">Q3_Marketing_Campaign.md</span>
                </div>
                
                {/* Simulated Paragraph Lines */}
                <div className="space-y-2.5">
                  <div className="h-3.5 bg-slate-100 rounded w-11/12 relative overflow-hidden">
                    {/* Simulated Selection Highlight by Alex */}
                    <motion.div
                      animate={{
                        width: ["0%", "0%", "90%", "90%", "0%", "0%"],
                        opacity: [0, 0, 0.15, 0.15, 0, 0],
                      }}
                      transition={{
                        duration: 12,
                        repeat: Infinity,
                        times: [0, 0.08, 0.2, 0.916, 0.958, 1.0],
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 bg-[#FA7275]"
                    />
                  </div>
                  <div className="h-3.5 bg-slate-100 rounded w-full"></div>
                  <div className="h-3.5 bg-slate-100 rounded w-4/5"></div>
                </div>
              </div>

              {/* Collaborative Comment box that pops up dynamically */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{
                  opacity: [0, 0, 1, 1, 0, 0],
                  scale: [0.9, 0.9, 1, 1, 0.9, 0.9],
                  y: [10, 10, 0, 0, 10, 10],
                }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  times: [0, 0.1, 0.22, 0.916, 0.958, 1.0],
                  ease: "easeInOut",
                }}
                className="absolute top-1/2 left-6 right-6 bg-[#FA7275] text-white p-3.5 rounded-xl shadow-drop-2 border border-brand/20 text-[11px] z-20"
              >
                <div className="font-bold mb-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Alex L. added a comment:
                </div>
                <p className="opacity-90 leading-relaxed">&quot;Let&apos;s update this title to sound more user-focused!&quot;</p>
              </motion.div>
            </div>

            {/* Right side: Interactive Task list Sidebar */}
            <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-light-300 flex flex-col h-full">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tasks</h4>
              <div className="space-y-2">
                
                {/* Simulated task items */}
                <motion.div
                  animate={{
                    borderColor: ["#F2F5F9", "#F2F5F9", "#56B8FF", "#56B8FF", "#F2F5F9", "#F2F5F9"],
                    backgroundColor: ["rgba(255,255,255,1)", "rgba(255,255,255,1)", "rgba(86,184,255,0.08)", "rgba(86,184,255,0.08)", "rgba(255,255,255,1)", "rgba(255,255,255,1)"],
                  }}
                  transition={{
                    duration: 12,
                    repeat: Infinity,
                    times: [0, 0.5, 0.625, 0.916, 0.958, 1.0],
                    ease: "easeInOut",
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-light-300 text-[11px] text-slate-700 font-medium w-full"
                >
                  {/* Checkbox animation */}
                  <motion.div
                    animate={{
                      backgroundColor: ["#ffffff", "#ffffff", "#56B8FF", "#56B8FF", "#ffffff", "#ffffff"],
                      borderColor: ["#A3B2C7", "#A3B2C7", "#56B8FF", "#56B8FF", "#A3B2C7", "#A3B2C7"],
                    }}
                    transition={{
                      duration: 12,
                      repeat: Infinity,
                      times: [0, 0.625, 0.66, 0.916, 0.958, 1.0],
                      ease: "easeInOut",
                    }}
                    className="w-3.5 h-3.5 rounded border border-light-200 flex items-center justify-center shrink-0"
                  >
                    <motion.svg
                      animate={{ opacity: [0, 0, 1, 1, 0, 0] }}
                      transition={{
                        duration: 12,
                        repeat: Infinity,
                        times: [0, 0.64, 0.68, 0.916, 0.958, 1.0],
                      }}
                      className="w-2 h-2 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="4"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </motion.svg>
                  </motion.div>
                  
                  {/* Task Text Strikethrough Animation */}
                  <motion.span
                    animate={{
                      textDecoration: ["none", "none", "line-through", "line-through", "none", "none"],
                      opacity: [1, 1, 0.5, 0.5, 1, 1]
                    }}
                    transition={{
                      duration: 12,
                      repeat: Infinity,
                      times: [0, 0.64, 0.68, 0.916, 0.958, 1.0]
                    }}
                    className="truncate"
                  >
                    Review copy
                  </motion.span>
                </motion.div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-light-300 text-[11px] text-slate-400 font-medium line-through opacity-60">
                  <div className="w-3.5 h-3.5 rounded bg-slate-200 flex items-center justify-center shrink-0">
                    <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="truncate">Create layout</span>
                </div>
              </div>
            </div>

            {/* Simulated Live Cursor 1: Alex L. */}
            <motion.div
              initial={{ left: "20%", top: "70%" }}
              animate={{
                left: ["20%", "10%", "52%", "52%", "20%", "20%"],
                top: ["70%", "22%", "22%", "22%", "70%", "70%"],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                times: [0, 0.08, 0.2, 0.42, 0.54, 1.0],
                ease: "easeInOut",
              }}
              className="absolute pointer-events-none z-30 flex flex-col items-start gap-1"
            >
              <MousePointer2 className="w-5 h-5 text-brand fill-brand transform -rotate-12 drop-shadow-sm" />
              <div className="bg-brand text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                Alex L.
              </div>
            </motion.div>

            {/* Simulated Live Cursor 2: Jane D. */}
            <motion.div
              initial={{ left: "80%", top: "70%" }}
              animate={{
                left: ["80%", "80%", "70%", "70%", "80%", "80%"],
                top: ["70%", "70%", "24%", "24%", "70%", "70%"],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                times: [0, 0.5, 0.625, 0.833, 0.958, 1.0],
                ease: "easeInOut",
              }}
              className="absolute pointer-events-none z-30 flex flex-col items-start gap-1"
            >
              <MousePointer2 className="w-5 h-5 text-blue fill-blue transform -scale-x-100 -rotate-12 drop-shadow-sm" />
              <div className="bg-blue text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                Jane D.
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
