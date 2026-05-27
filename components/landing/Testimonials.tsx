"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const StarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-4 h-4"
  >
    <path
      fillRule="evenodd"
      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
      clipRule="evenodd"
    />
  </svg>
);

export const Testimonials = () => {
  return (
    <section className="py-24 bg-light-400/20">
      <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-dark-100 mb-16 tracking-tight">
          Don&apos;t just take our word for it.
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              quote:
                "The semantic search is surprisingly useful. I stopped manually organizing folders entirely.",
              author: "Sarah J.",
              role: "Design Lead",
            },
            {
              quote:
                "Storey replaced Google Drive and Dropbox for our team. The AI summaries save us hours per week.",
              author: "Michael T.",
              role: "Product Manager",
            },
            {
              quote:
                "Incredibly fast. The UI is calm and stays out of your way until you need it.",
              author: "Elena R.",
              role: "Software Engineer",
            },
          ].map((t, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-3xl border border-light-300 shadow-sm text-left"
            >
              <div className="flex text-brand mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <StarIcon key={i} />
                ))}
              </div>
              <p className="text-light-100 mb-8 italic">
                &quot;{t.quote}&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-light-300 overflow-hidden relative">
                  <Image
                    src={`https://i.pravatar.cc/100?img=${idx + 40}`}
                    alt={t.author}
                    fill
                    sizes="40px"
                  />
                </div>
                <div>
                  <h5 className="font-bold text-dark-100 text-sm">
                    {t.author}
                  </h5>
                  <p className="text-xs text-light-200">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
