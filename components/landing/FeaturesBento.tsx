"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Search,
  Shield,
  History,
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
      iconBg: "bg-brand/10",
      colSpan: "col-span-1 md:col-span-2",
      bgContent: (
        <div className="absolute right-6 -bottom-6 w-80 bg-white rounded-t-2xl border border-light-300 p-4 shadow-drop-2 group-hover:translate-y-[-6px] transition-all duration-300">
          <div className="flex items-center gap-2 bg-light-400 rounded-full px-3.5 py-2 shadow-sm text-xs text-dark-100 border border-light-300 mb-4">
            <Search className="w-3.5 h-3.5 text-brand shrink-0" />
            <span className="font-medium">
              &quot;Q3 marketing slides with branding logo&quot;
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-brand/5 border border-brand/10 rounded-xl p-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand font-bold text-xs shrink-0">
                PPT
              </div>
              <div className="grow space-y-1">
                <div className="h-3 bg-dark-100/10 rounded-full w-3/4"></div>
                <div className="text-[9px] text-brand font-semibold">
                  Semantic match: 98%
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-light-400/50 border border-light-300 rounded-xl p-2.5 opacity-60">
              <div className="w-8 h-8 rounded-lg bg-light-300 flex items-center justify-center text-light-100 font-bold text-xs shrink-0">
                PDF
              </div>
              <div className="grow space-y-1">
                <div className="h-3 bg-dark-100/10 rounded-full w-1/2"></div>
                <div className="text-[9px] text-light-100">
                  Semantic match: 45%
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Bank-Grade Security",
      desc: "Your data is encrypted at rest and in transit. Calm intelligence means peace of mind.",
      icon: <Shield className="w-5 h-5 text-blue" />,
      iconBg: "bg-blue/10",
      colSpan: "col-span-1",
      bgContent: (
        <div className="absolute right-6 -bottom-6 w-48 bg-white rounded-t-2xl border border-light-300 p-4 shadow-drop-1 space-y-3 group-hover:translate-y-[-6px] transition-all duration-300">
          <div className="flex items-center justify-between border-b border-light-300 pb-2">
            <span className="text-[10px] font-bold text-green uppercase tracking-wider">
              AES-256 Active
            </span>
            <div className="w-2 h-2 rounded-full bg-green animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-light-100">Key Rotation</span>
              <span className="font-semibold text-dark-100">Enforced</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-light-100">SSL/TLS 1.3</span>
              <span className="font-semibold text-dark-100">Secured</span>
            </div>
            <div className="h-8 rounded-lg bg-light-400 flex items-center justify-center gap-1.5 border border-dashed border-light-300">
              <Lock className="w-3.5 h-3.5 text-brand" />
              <span className="text-[9px] font-semibold text-dark-100">
                Zero-Knowledge
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "File Versioning",
      desc: "Travel back in time. View document history, restore past versions, and track evolution effortlessly.",
      icon: <History className="w-5 h-5 text-orange" />,
      iconBg: "bg-orange/10",
      colSpan: "col-span-1",
      bgContent: (
        <div className="absolute right-6 -bottom-4 w-[220px] bg-white rounded-t-2xl border border-light-300 p-4 shadow-drop-1 space-y-3 group-hover:translate-y-[-8px] transition-all duration-300">
          <div className="relative pl-4 space-y-3 border-l border-light-300">
            <div className="relative text-[11px]">
              <div className="absolute left-[-20.5px] top-1 w-2.5 h-2.5 rounded-full bg-brand border-2 border-white ring-2 ring-brand/20"></div>
              <div className="font-bold text-dark-100 flex items-center justify-between">
                <span>v1.4</span>
                <span className="text-[9px] font-semibold bg-brand/10 text-brand px-1 py-0.5 rounded">
                  Latest
                </span>
              </div>
              <div className="text-[9px] text-light-100">Updated 10m ago</div>
            </div>
            <div className="relative text-[11px] opacity-75">
              <div className="absolute left-[-19.5px] top-1 w-2 h-2 rounded-full bg-light-200 border border-white"></div>
              <div className="font-medium text-dark-200 flex items-center justify-between">
                <span>v1.3</span>
                <span className="text-[9px] text-light-200">1 hr ago</span>
              </div>
            </div>
            <div className="relative text-[11px] opacity-50">
              <div className="absolute left-[-19.5px] top-1 w-2 h-2 rounded-full bg-light-200 border border-white"></div>
              <div className="font-medium text-dark-200 flex items-center justify-between">
                <span>v1.2</span>
                <span className="text-[9px] text-light-200">2 hrs ago</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Frictionless Collaboration",
      desc: "Work together in real-time with granular permissions. See who is viewing, editing, or suggesting changes without leaving your calm workspace.",
      icon: <Users className="w-5 h-5 text-green" />,
      iconBg: "bg-green/10",
      colSpan: "col-span-1 md:col-span-2",
      badge: "Live",
      bgContent: (
        <div className="absolute right-6 bottom-6 w-64 bg-white rounded-xl shadow-drop-2 border border-light-300 p-4 group-hover:translate-y-[-6px] transition-all duration-300">
          <div className="flex items-center justify-between border-b border-light-300 pb-2 mb-3">
            <span className="text-[10px] font-bold text-light-100 uppercase">
              Collaboration
            </span>
            <div className="flex -space-x-1.5">
              {["#FA7275", "#56B8FF", "#3DD9B3"].map((color, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px] font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {["A", "M", "K"][i]}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2 relative overflow-hidden p-1">
            <div className="h-2 bg-light-300 rounded-full w-full"></div>
            <div className="h-2 bg-light-300 rounded-full w-[90%] relative">
              <span className="absolute left-[70%] top-[-4px] flex items-center">
                <span className="h-4 w-[2px] bg-brand animate-pulse"></span>
                <span className="bg-brand text-white text-[8px] font-semibold px-1 rounded ml-0.5 shadow-sm">
                  Alice
                </span>
              </span>
            </div>
            <div className="h-2 bg-light-300 rounded-full w-[65%]"></div>
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
                <div className="flex items-center gap-4 mb-5">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${feature.iconBg || "bg-[#FEECEE]"}`}
                  >
                    {feature.icon}
                  </div>
                  <div className="flex items-center justify-between grow min-w-0">
                    <h3 className="text-xl font-bold text-dark-100 truncate">
                      {feature.title}
                    </h3>
                    {feature.badge && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green/10 text-green flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse"></span>{" "}
                        {feature.badge}
                      </span>
                    )}
                  </div>
                </div>
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
