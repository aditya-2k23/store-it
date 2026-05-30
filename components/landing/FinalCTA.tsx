"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

/* ─── Inline SVG Illustrations ─── */

const PdfIcon = () => (
  <svg
    width="90"
    height="110"
    viewBox="0 0 90 110"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Page body */}
    <rect
      x="5"
      y="10"
      width="70"
      height="90"
      rx="8"
      fill="#FFF"
      stroke="#F9C5C0"
      strokeWidth="2"
    />
    {/* Folded corner */}
    <path d="M55 10V30H75" fill="#FDE8E4" />
    <path
      d="M55 10L75 30"
      stroke="#F9C5C0"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M55 10V30H75"
      stroke="#F9C5C0"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* PDF badge */}
    <rect x="0" y="0" width="46" height="28" rx="8" fill="#FA7275" />
    <text
      x="23"
      y="19"
      textAnchor="middle"
      fill="#FFF"
      fontWeight="800"
      fontSize="14"
      fontFamily="Inter, system-ui, sans-serif"
    >
      PDF
    </text>
    {/* Text lines */}
    <rect x="18" y="50" width="44" height="4" rx="2" fill="#F4D0CC" />
    <rect x="18" y="60" width="36" height="4" rx="2" fill="#F4D0CC" />
    <rect x="18" y="70" width="40" height="4" rx="2" fill="#F4D0CC" />
    <rect x="18" y="80" width="28" height="4" rx="2" fill="#F4D0CC" />
  </svg>
);

const VideoIcon = () => (
  <svg
    width="100"
    height="80"
    viewBox="0 0 100 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Card */}
    <rect width="100" height="80" rx="14" fill="#FA7275" />
    {/* Inner screen */}
    <rect x="8" y="8" width="84" height="50" rx="8" fill="#F9A8A8" />
    {/* Play triangle */}
    <path d="M43 24L60 33L43 42V24Z" fill="#FFF" fillOpacity="0.95" />
    {/* Bottom bar area */}
    <rect
      x="12"
      y="64"
      width="30"
      height="4"
      rx="2"
      fill="#FFF"
      fillOpacity="0.4"
    />
    <rect
      x="46"
      y="64"
      width="16"
      height="4"
      rx="2"
      fill="#FFF"
      fillOpacity="0.25"
    />
  </svg>
);

const ImageFileIcon = () => (
  <svg
    width="110"
    height="100"
    viewBox="0 0 110 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer frame — rotated slightly */}
    <rect
      x="8"
      y="4"
      width="94"
      height="88"
      rx="12"
      fill="#FA7275"
      transform="rotate(-3 55 50)"
    />
    {/* Inner white card */}
    <rect
      x="14"
      y="10"
      width="82"
      height="74"
      rx="8"
      fill="#FFF"
      transform="rotate(-3 55 50)"
    />
    {/* Sky gradient */}
    <rect
      x="18"
      y="14"
      width="74"
      height="40"
      rx="6"
      fill="#D4EDFC"
      transform="rotate(-3 55 50)"
    />
    {/* Mountains */}
    <path
      d="M18 50L38 30L55 45L68 34L92 54H18Z"
      fill="#8EC5E8"
      transform="rotate(-3 55 50)"
    />
    {/* Sun */}
    <circle cx="76" cy="24" r="7" fill="#FFD97A" transform="rotate(-3 55 50)" />
    {/* Green ground */}
    <rect
      x="18"
      y="54"
      width="74"
      height="24"
      rx="0 0 6 6"
      fill="#B0DFA4"
      transform="rotate(-3 55 50)"
    />
  </svg>
);

const SearchBarIcon = () => (
  <svg
    width="200"
    height="46"
    viewBox="0 0 200 46"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Pill background */}
    <rect width="200" height="46" rx="23" fill="#E3EFF8" />
    <rect
      x="1"
      y="1"
      width="198"
      height="44"
      rx="22"
      stroke="#C8DCE8"
      strokeWidth="1"
      fill="none"
    />
    {/* Magnifying glass icon */}
    <circle
      cx="26"
      cy="23"
      r="7"
      stroke="#8EAFC3"
      strokeWidth="2.2"
      fill="none"
    />
    <line
      x1="31"
      y1="28"
      x2="36"
      y2="33"
      stroke="#8EAFC3"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    {/* Placeholder text */}
    <text
      x="46"
      y="28"
      fill="#8EAFC3"
      fontWeight="500"
      fontSize="14"
      fontFamily="Inter, system-ui, sans-serif"
    >
      Search your files...
    </text>
  </svg>
);

/* ─── Floating items configuration ─── */
const floatingItems = [
  {
    id: "pdf",
    element: <PdfIcon />,
    top: "8%",
    left: "6%",
    delay: 0,
    yRange: [0, -14, 0],
    rotateRange: [-6, 4, -6],
    scale: 1.35,
  },
  {
    id: "video",
    element: <VideoIcon />,
    top: "10%",
    right: "8%",
    delay: 1.4,
    yRange: [0, -18, 0],
    rotateRange: [4, -8, 4],
    scale: 1.4,
  },
  {
    id: "image",
    element: <ImageFileIcon />,
    bottom: "14%",
    left: "8%",
    delay: 0.7,
    yRange: [0, -12, 0],
    rotateRange: [-4, 10, -4],
    scale: 1.3,
  },
  {
    id: "search",
    element: <SearchBarIcon />,
    bottom: "16%",
    right: "5%",
    delay: 2,
    yRange: [0, -10, 0],
    rotateRange: [6, -4, 6],
    scale: 1.3,
  },
];

/* ─── Component ─── */

export const FinalCTA = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const },
    },
  } as const;

  return (
    <section
      id="pricing"
      className="py-32 bg-light-400 relative overflow-hidden"
    >
      {/* Background decorative pulsing blobs */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-0 -translate-y-1/2 w-150 h-150 bg-brand/5 rounded-full blur-[100px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute top-1/2 right-0 -translate-y-1/2 w-150 h-150 bg-blue/5 rounded-full blur-[100px] pointer-events-none"
      />

      {/* Floating SVG Illustrations */}
      {floatingItems.map((item) => (
        <motion.div
          key={item.id}
          animate={{
            y: item.yRange,
            rotate: item.rotateRange,
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: item.delay,
          }}
          style={{
            position: "absolute",
            top: item.top,
            left: item.left,
            right: item.right,
            bottom: item.bottom,
            scale: item.scale,
          }}
          className="hidden md:block select-none pointer-events-none z-0 drop-shadow-lg"
        >
          {item.element}
        </motion.div>
      ))}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-4xl mx-auto px-6 text-center relative z-10"
      >
        <motion.h2
          variants={itemVariants}
          className="text-4xl md:text-6xl font-bold text-dark-100 tracking-tight mb-8"
        >
          Your files deserve <br />{" "}
          <span className="font-dynapuff text-brand">better</span> than folders.
        </motion.h2>
        <motion.p
          variants={itemVariants}
          className="text-xl text-light-100 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Join thousands of teams moving at the speed of thought. Ditch the
          manual organization and let Storey handle it.
        </motion.p>
        <motion.div variants={itemVariants} className="flex justify-center">
          <Link href="/sign-up">
            <Button className="group bg-brand hover:bg-brand-100 text-white rounded-full px-10 py-7 text-lg font-medium shadow-drop-2 hover:shadow-drop-4 transition-all w-full sm:w-auto flex items-center gap-2 cursor-pointer font-dynapuff">
              Start Using Storey{" "}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
};
