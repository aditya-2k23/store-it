"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, ArrowRight, Search, MousePointer2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeIn, staggerChildren } from "./animations";

export const HeroSection = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-light-400/30">
      <div className="absolute top-0 right-0 -z-10 translate-x-1/3 -translate-y-1/4">
        <div className="w-150 h-150 rounded-full bg-[#FEECEE] blur-[100px] opacity-70" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="max-w-2xl"
        >
          <motion.div
            variants={fadeIn}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-sm font-semibold mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>Introducing Storey AI 1.0</span>
          </motion.div>

          <motion.h1
            variants={fadeIn}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-dark-100 leading-[1.1] mb-6"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Storage that <br className="hidden md:block" />
            <span className="text-brand font-dynapuff font-medium">
              understands
            </span>{" "}
            your files.
          </motion.h1>

          <motion.p
            variants={fadeIn}
            className="text-lg md:text-xl text-light-100 mb-8 leading-relaxed max-w-lg"
          >
            The smart workspace that organizes, summarizes, and connects your
            digital life automatically using advanced AI.
          </motion.p>

          <motion.div
            variants={fadeIn}
            className="flex flex-wrap items-center gap-4"
          >
            <Link href="/sign-up">
              <Button className="bg-brand hover:bg-brand-100 text-white rounded-full px-8 py-6 text-lg font-medium shadow-drop-2 hover:shadow-drop-4 transition-all flex items-center gap-2 cursor-pointer font-dynapuff">
                Get Started for Free <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, x: 50, y: 20, rotateX: 5, rotateY: -10 }}
          animate={{
            opacity: 1,
            x: 0,
            y: [0, -12, 0],
            rotateX: [5, 2, 5],
            rotateY: [-10, -5, -10],
          }}
          transition={{
            y: {
              repeat: Infinity,
              duration: 6,
              ease: "easeInOut",
            },
            rotateX: {
              repeat: Infinity,
              duration: 6,
              ease: "easeInOut",
            },
            rotateY: {
              repeat: Infinity,
              duration: 6,
              ease: "easeInOut",
            },
            default: { duration: 0.8, delay: 0.2, ease: "easeOut" },
          }}
          className="relative perspective-distant z-10 w-full lg:-mr-12"
        >
          <div className="relative rounded-2xl bg-white border border-light-300 shadow-drop-1 p-4 md:p-6 w-full">
            {/* Fake Dashboard Top */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Image
                  src="/assets/icons/logo_brand.png"
                  alt="Storey Logo"
                  width={100}
                  height={100}
                  loading="eager"
                />
              </div>
              <div className="flex items-center bg-light-400 rounded-full px-3 py-1.5 w-1/2 justify-between">
                <div className="flex items-center gap-2 text-light-200">
                  <Search className="w-4 h-4" />
                  <span className="text-xs">Ask everything...</span>
                </div>
                <div className="h-5 w-5 bg-white rounded-full flex items-center justify-center text-xs font-bold text-light-100 shadow-sm border border-light-300">
                  ⌘K
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand text-xs font-bold">
                AB
              </div>
            </div>

            {/* Fake Dashboard Main Area */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="col-span-2 bg-brand rounded-xl p-5 text-white shadow-drop-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
                <h3 className="font-medium font-dynapuff mb-1 opacity-90">
                  Available Storage
                </h3>
                <div className="text-3xl font-medium font-dynapuff mb-4">
                  67.3%
                </div>
                <div className="w-full bg-white/20 rounded-full h-1.5 mb-2">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "67.3%" }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.8 }}
                    className="bg-white rounded-full h-1.5"
                  />
                </div>
                <p className="text-xs opacity-70">1.34GB / 2.00GB Used</p>
              </div>

              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="bg-[#FEECEE] rounded-xl p-5 border border-white shadow-sm flex flex-col justify-between relative group cursor-pointer"
              >
                <h3 className="font-medium font-dynapuff text-brand text-sm">
                  AI Insights
                </h3>
                <p className="text-xs text-brand/70 leading-relaxed">
                  12 duplicate files found. Clean up workspace?
                </p>
                <div className="mt-2 text-xs font-bold text-brand flex items-center gap-1">
                  Review{" "}
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            </div>

            <h4 className="text-sm font-semibold text-dark-100 mb-3">
              Continue Working
            </h4>
            <div className="grid grid-cols-4 gap-3">
              {[
                {
                  t: "Project_Alpha.pdf",
                  i: "/assets/images/project_alpha.jpg",
                },
                {
                  t: "Q3_Report.xlsx",
                  i: "/assets/images/q3_report.jpg",
                },
                {
                  t: "Hero_Design.png",
                  i: "/assets/images/hero_section.jpg",
                },
                {
                  t: "server.ts",
                  i: "/assets/images/server.jpg",
                },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  whileHover={{
                    y: -4,
                    boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
                  }}
                  className="bg-light-400 rounded-lg p-3 cursor-pointer hidden md:block group"
                >
                  <div className="bg-white w-full h-16 rounded-md shadow-sm border border-light-300 mb-2 flex items-center justify-center overflow-hidden">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 2 }}
                      className="w-full h-full"
                    >
                      <Image src={f.i} alt={f.t} width={200} height={200} />
                    </motion.div>
                  </div>
                  <p className="text-[10px] font-medium text-dark-100 truncate">
                    {f.t}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Floating Cursors / collaboration */}
            <motion.div
              animate={{
                x: [0, 20, -10, 0],
                y: [0, -15, 10, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 8,
                ease: "easeInOut",
              }}
              className="absolute top-1/2 left-1/4 hidden md:flex items-center gap-1 drop-shadow-md z-20"
            >
              <MousePointer2 className="w-4 h-4 text-blue fill-blue transform -scale-x-100 z-10" />
              <div className="bg-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-0 translate-y-1">
                Alice
              </div>
            </motion.div>

            {/* AI Summary Notification */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9, rotate: -2 }}
              animate={{
                opacity: 1,
                y: [0, -6, 0],
                scale: 1,
                rotate: [-2, -1, -2],
              }}
              transition={{
                y: {
                  repeat: Infinity,
                  duration: 4,
                  ease: "easeInOut",
                },
                rotate: {
                  repeat: Infinity,
                  duration: 4,
                  ease: "easeInOut",
                },
                default: { duration: 0.6, delay: 1.2, ease: "easeOut" },
              }}
              whileHover={{ scale: 1.05, rotate: 0 }}
              className="absolute -right-6 top-1/4 bg-white rounded-xl shadow-drop-2 border border-light-300 p-4 max-w-50 z-20 cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-brand" />
                <span className="text-xs font-bold text-dark-100">
                  AI Summary
                </span>
              </div>
              <p className="text-xs text-light-100 leading-relaxed">
                3 duplicate files found in Q1 Reports. Optimized 45MB.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
