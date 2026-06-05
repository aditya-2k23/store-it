"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageSquare } from "lucide-react";

/* ─── Custom SVG Social Icons ─── */

const GithubIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const XTwitterIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-light-300 py-8 relative overflow-hidden">
      {/* Soft ambient background blurs */}
      <div className="absolute -bottom-10 left-10 w-72 h-72 bg-brand/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-72 h-72 bg-blue/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="flex flex-col md:flex-row flex-wrap gap-10">
          {/* Logo & Social Section */}
          <div className="shrink-0 md:basis-[28%]">
            <div className="flex items-center gap-2 mb-3 select-none">
              <Image
                src="/assets/icons/logo_brand.png"
                alt="Storey Logo"
                width={140}
                height={140}
                loading="eager"
                priority
              />
            </div>
            <p className="text-sm text-light-100 max-w-xs leading-relaxed">
              The smart workspace that organizes, summarizes, and connects your
              digital life automatically using advanced AI.
            </p>
            {/* Interactive Social Media Icons */}
            <div className="flex items-center gap-3 mt-5">
              {[
                {
                  icon: <GithubIcon className="w-4 h-4" />,
                  href: "https://github.com/aditya-2k23/store-it",
                },
                { icon: <XTwitterIcon className="w-4 h-4" />, href: "#" },
                { icon: <LinkedinIcon className="w-4 h-4" />, href: "#" },
                { icon: <MessageSquare className="w-4 h-4" />, href: "#" },
              ].map((social, i) => (
                <Link
                  key={i}
                  href={social.href}
                  className="w-8 h-8 rounded-full border border-light-300 flex items-center justify-center text-light-100 hover:text-brand hover:border-brand hover:bg-brand/5 hover:scale-110 transition-all duration-300 shadow-sm"
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Resources Links */}
          <div className="shrink-0">
            <h4 className="font-bold text-dark-100 mb-3 text-xs uppercase tracking-wider select-none">
              Resources
            </h4>
            <ul className="space-y-2 text-sm text-light-100">
              {["Documentation", "Help Center", "Blog"].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="hover:text-brand hover:translate-x-1 transition-all duration-200 inline-block"
                  >
                    {item}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="https://github.com/aditya-2k23/store-it"
                  className="hover:text-brand hover:translate-x-1 transition-all duration-200 inline-block font-semibold"
                >
                  GitHub
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="shrink-0">
            <h4 className="font-bold text-dark-100 mb-3 text-xs uppercase tracking-wider select-none">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-light-100">
              {["About Us", "Careers", "Privacy", "Terms of Service"].map(
                (item) => (
                  <li key={item}>
                    <Link
                      href="#"
                      className="hover:text-brand hover:translate-x-1 transition-all duration-200 inline-block"
                    >
                      {item}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Newsletter Subscription */}
          <div className="flex-1 min-w-60 md:ml-auto md:max-w-xs">
            <h4 className="font-bold text-dark-100 mb-4 text-xs uppercase tracking-wider select-none">
              Stay Updated
            </h4>
            <p className="text-sm text-light-100 mb-4 leading-relaxed max-w-sm">
              Subscribe to our newsletter to receive the latest product
              features, tips, and updates.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex gap-2 max-w-sm"
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-light-400 border border-light-300 rounded-full px-4 py-2 text-xs text-dark-100 placeholder-light-100 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand flex-1 min-w-0"
                required
              />
              <button
                type="submit"
                className="bg-brand hover:bg-brand-100 text-white text-xs font-medium px-5 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all shrink-0 cursor-pointer font-dynapuff"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Footer Copyright */}
        <div className="pt-4 border-t border-light-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-light-100 select-none">
          <p>© {currentYear} Storey. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-brand transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-brand transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-brand transition-colors">
              Cookie Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
