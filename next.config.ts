import type { NextConfig } from "next";

const supabaseHost = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;

  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  experimental: { serverActions: { bodySizeLimit: "100MB" } },
  images: {
    remotePatterns: [
      { protocol: "https" as const, hostname: "www.istockphoto.com" },
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost }]
        : []),
      { protocol: "https" as const, hostname: "img.clerk.com" },
      { protocol: "https" as const, hostname: "images.clerk.dev" },
      { protocol: "https" as const, hostname: "i.pravatar.cc" },
    ],
  },
};

export default nextConfig;
