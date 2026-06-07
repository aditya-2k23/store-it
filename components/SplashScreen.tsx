"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const SplashScreen = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Show splash screen for at least 2.5s (2600ms total + exit animation)
    const timer = setTimeout(() => {
      setShow(false);
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-99999 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md overflow-hidden"
        >
          {/* Ambient background blur elements */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff6b6b]/10 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue/10 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse" style={{ animationDelay: "1s" }} />

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center justify-center relative"
          >
            {/* The Logo Graphic */}
            <motion.div
              animate={{
                y: [0, -12, 0],
              }}
              transition={{
                duration: 2.5,
                ease: "easeInOut",
                repeat: Infinity
              }}
              className="relative"
            >
              <Image
                src="/assets/icons/logo-brand.svg"
                alt="Storey Icon"
                width={88}
                height={88}
                className="drop-shadow-[0_8px_16px_rgba(250,114,117,0.3)] mb-4"
                priority
                loading="eager"
              />
              <motion.div
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-2 bg-brand/20 rounded-full blur-xs"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0.2, 0.5]
                }}
                transition={{
                  duration: 2.5,
                  ease: "easeInOut",
                  repeat: Infinity
                }}
              />
            </motion.div>

            {/* The Full Brand Name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-6"
            >
              <Image
                src="/assets/icons/logo_brand.png"
                alt="Storey"
                width={150}
                height={48}
                className="object-contain h-auto w-37.5"
                priority
                loading="eager"
              />
            </motion.div>

            {/* A loader line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="w-48 h-1 bg-light-300 rounded-full mt-10 overflow-hidden relative shadow-inner"
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  ease: "easeInOut"
                }}
                className="absolute top-0 bottom-0 w-1/3 bg-brand rounded-full shadow-[0_0_8px_rgba(250,114,117,0.8)]"
              />
            </motion.div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="absolute bottom-12 text-light-100/70 font-medium text-sm tracking-widest font-dynapuff uppercase"
          >
            Preparing Workspace
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;