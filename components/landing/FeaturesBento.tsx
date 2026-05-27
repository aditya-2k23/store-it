"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Search,
  Shield,
  History,
  CheckCircle2,
  Users,
  ArrowRight,
  FileText,
  Tag,
  Globe,
  Lock,
} from "lucide-react";

export const FeaturesBento = () => {
  const features = [
    {
      title: "Deep Semantic Search",
      desc: "Find files not by name, but by meaning. Storey understands context, saving you hours of digging through folders.",
      icon: <Search className="w-5 h-5 text-brand" />,
      colSpan: "col-span-1 md:col-span-2",
      bgContent: (
        <div className="w-3/4 mx-auto mt-6 bg-[#FEECEE] rounded-t-xl border border-light-300 border-b-0 p-4 shadow-sm opacity-80 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm text-xs text-light-100 border border-light-300 mb-3">
            <Search className="w-3 h-3 text-brand" /> &quot;Q3 design assets for marketing&quot;
          </div>
          <div className="space-y-2">
            <div className="h-6 bg-brand/10 rounded-md w-full"></div>
            <div className="h-6 bg-brand/5 rounded-md w-4/5"></div>
          </div>
        </div>
      ),
    },
    {
      title: "Bank-Grade Security",
      desc: "Your data is encrypted at rest and in transit. Calm intelligence means peace of mind.",
      icon: <Shield className="w-5 h-5 text-dark-200" />,
      colSpan: "col-span-1",
      bgContent: (
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-light-300 rounded-full border-8 border-white flex items-center justify-center opacity-50 group-hover:scale-110 transition-transform">
          <Lock className="w-8 h-8 text-light-200" />
        </div>
      ),
    },
    {
      title: "File Versioning",
      desc: "Travel back in time. View document history, restore past versions, and track evolution effortlessly.",
      icon: <History className="w-5 h-5 text-white" />,
      iconBg: "bg-light-100",
      colSpan: "col-span-1",
      bgContent: (
        <div className="mt-8 px-6 space-y-2 relative">
          <div className="flex bg-light-300 rounded-md p-2 text-[10px] items-center text-light-100 opacity-60">
            <History className="w-3 h-3 mr-2 text-light-200" />
            v1.2 - 2 hrs ago
          </div>
          <div className="flex bg-light-300 rounded-md p-2 text-[10px] items-center text-light-100 opacity-80">
            <History className="w-3 h-3 mr-2 text-light-200" />
            v1.3 - 1 hr ago
          </div>
          <div className="flex bg-white shadow-sm border border-brand/20 rounded-md p-2 text-[10px] items-center text-brand font-bold absolute top-10 left-4 right-4 group-hover:-translate-y-1 transition-transform">
            <CheckCircle2 className="w-3 h-3 mr-2" />
            v1.4 - Latest
          </div>
        </div>
      ),
    },
    {
      title: "Frictionless Collaboration",
      desc: "Work together in real-time with granular permissions. See who is viewing, editing, or suggesting changes without leaving your calm workspace.",
      icon: <Users className="w-5 h-5 text-green" />,
      colSpan: "col-span-1 md:col-span-2",
      badge: "Live",
      bgContent: (
        <div className="absolute right-6 bottom-4 md:bottom-auto md:top-1/2 md:-translate-y-1/2 w-60 bg-white rounded-xl shadow-drop-1 border border-light-300 p-3 opacity-90 group-hover:-translate-y-6 transition-transform">
          <div className="flex -space-x-2 mb-3">
            {["A", "M", "K"].map((l, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white ${["bg-brand", "bg-blue", "bg-light-100"][i]}`}
              >
                {l}
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-light-300 rounded-full w-full mb-1"></div>
          <div className="h-1.5 bg-light-300 rounded-full w-2/3"></div>
          <div className="absolute right-2 bottom-2 bg-brand text-white text-[8px] font-bold px-1.5 py-0.5 rounded cursor-default">
            Alice |
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="features" className="py-24 bg-light-400/20">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-dark-100 mb-4 tracking-tight">
            Features designed to get <br />
            out of your way.
          </h2>
          <p className="text-light-100 text-lg">
            Focus on the work, let Storey handle the files.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className={`bg-white rounded-3xl p-8 shadow-sm border border-light-300 hover:shadow-drop-1 overflow-hidden relative group min-h-75 flex flex-col ${feature.colSpan}`}
            >
              <div className="relative z-10 grow">
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.iconBg || "bg-[#FEECEE]"}`}
                  >
                    {feature.icon}
                  </div>
                  {feature.badge && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green/10 text-green flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse"></span>{" "}
                      {feature.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-dark-100 mb-3">
                  {feature.title}
                </h3>
                <p className="text-light-100 text-sm leading-relaxed max-w-sm">
                  {feature.desc}
                </p>

                {feature.colSpan === "col-span-1 md:col-span-2" &&
                  idx === 3 && (
                    <Link
                      href="#"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-brand mt-6 hover:gap-2 transition-all"
                    >
                      Explore Team Features <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
              </div>

              {/* Background Art */}
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                {feature.bgContent}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-6">
          {[
            {
              title: "AI Summaries",
              icon: <FileText className="w-5 h-5 text-brand" />,
            },
            {
              title: "Smart Tags",
              icon: <Tag className="w-5 h-5 text-blue" />,
            },
            {
              title: "OCR Search",
              icon: <Search className="w-5 h-5 text-orange" />,
            },
            {
              title: "Universal File Support",
              icon: <Globe className="w-5 h-5 text-green" />,
            },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-light-300 flex items-center gap-4 hover:shadow-drop-1 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-light-400 shrink-0 flex items-center justify-center">
                {feature.icon}
              </div>
              <h4 className="font-bold text-dark-100 text-sm md:text-base">
                {feature.title}
              </h4>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
