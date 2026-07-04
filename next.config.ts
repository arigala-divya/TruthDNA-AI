import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // keep native/heavyweight server deps out of the serverless bundle
  serverExternalPackages: ["jsdom", "@prisma/client", "prisma"],
};

export default nextConfig;
