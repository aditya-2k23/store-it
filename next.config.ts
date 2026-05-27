import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  experimental: { serverActions: { bodySizeLimit: "100MB" } },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.istockphoto.com" },
      { protocol: "https", hostname: "cloud.appwrite.io" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
};

export default nextConfig;
