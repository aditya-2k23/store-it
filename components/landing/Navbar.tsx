"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const lastScrollY = useRef(0);
  const isHiddenRef = useRef(false);
  const THRESHOLD = 80;

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;

      setScrolled(currentY > 20);

      if (currentY < THRESHOLD) {
        if (isHiddenRef.current) {
          setIsHidden(false);
          isHiddenRef.current = false;
        }
      } else if (diff > 4 && !isHiddenRef.current) {
        setIsHidden(true);
        isHiddenRef.current = true;
      } else if (diff < -4 && isHiddenRef.current) {
        setIsHidden(false);
        isHiddenRef.current = false;
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      animate={{ y: isHidden ? "-110%" : "0%" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-sm bg-white/10 dark:bg-transparent`}
    >
      <div className="max-w-7xl mx-auto pt-2 px-6 md:px-12 flex justify-between items-center">
        <Link href="/">
          <Image
            src="/assets/icons/logo_brand.png"
            alt="Storey Logo"
            width={180}
            height={180}
            loading="eager"
          />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {["Features", "AI Search", "Collaboration", "Pricing"].map((item) => (
            <Link
              key={item}
              href={`#${item.toLowerCase().replace(" ", "-")}`}
              className="text-sm font-semibold text-light-100 hover:text-brand transition-colors"
            >
              {item}
            </Link>
          ))}
          <Link
            href="https://github.com/aditya-2k23/store-it"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-light-100 hover:text-brand transition-colors"
          >
            GitHub
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/sign-in">
            <Button
              variant="ghost"
              className="text-brand font-medium font-dynapuff hover:text-brand-100 rounded-full cursor-pointer"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="bg-brand hover:bg-brand-100 text-white rounded-full px-6 shadow-lg cursor-pointer font-dynapuff">
              Get Started
            </Button>
          </Link>
        </div>

        <button
          className="md:hidden text-dark-100"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white p-6 flex flex-col gap-4 absolute w-full"
          >
            {["Features", "AI Search", "Collaboration", "Pricing"].map(
              (item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase().replace(" ", "-")}`}
                  className="text-lg font-medium text-light-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </Link>
              ),
            )}
            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-light-300">
              <Link href="/sign-in" className="w-full cursor-pointer">
                <Button variant="outline" className="w-full justify-center">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up" className="w-full cursor-pointer">
                <Button className="w-full bg-brand hover:bg-brand-100 text-white justify-center font-dynapuff">
                  Get Started
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};
