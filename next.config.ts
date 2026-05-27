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
      { protocol: "https", hostname: "www.istockphoto.com" },
      ...(supabaseHost ? [{ protocol: "https", hostname: supabaseHost }] : []),
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
};

export default nextConfig;
