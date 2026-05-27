"use client";

import Link from "next/link";
import Image from "next/image";

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-light-300 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Image
              src="/assets/icons/logo_brand.png"
              alt="Storey Logo"
              width={200}
              height={200}
            />
          </div>
          <p className="text-sm text-light-200 max-w-xs">
            The smart workspace that organizes, summarizes, and connects your
            digital life automatically.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-dark-100 mb-4">Product</h4>
          <ul className="space-y-2 text-sm text-light-100">
            <li>
              <Link href="#" className="hover:text-brand transition-colors">
                Features
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-brand transition-colors">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-brand transition-colors">
                Security
              </Link>
            </li>
            <li>
              <Link
                href="/sign-up"
                className="hover:text-brand transition-colors"
              >
                Sign Up
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-dark-100 mb-4">Resources</h4>
          <ul className="space-y-2 text-sm text-light-100">
            <li>
              <Link href="#" className="hover:text-brand transition-colors">
                Documentation
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-brand transition-colors">
                Help Center
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-brand transition-colors">
                Blog
              </Link>
            </li>
            <li>
              <Link
                href="https://github.com/aditya-2k23/store-it"
                className="hover:text-brand transition-colors"
              >
                GitHub
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-dark-100 mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-light-100">
            <li>
              <Link href="#" className="hover:text-brand transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-brand transition-colors">
                Careers
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-brand transition-colors">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-brand transition-colors">
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 border-t border-light-300 text-center text-sm text-light-200">
        © {new Date().getFullYear()} Storey. All rights reserved.
      </div>
    </footer>
  );
};
