import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // puppeteer-core and @sparticuz/chromium use native binaries that cannot
  // go through Next.js's Webpack bundler. Mark them external so Node.js
  // resolves them directly at runtime.
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium", "puppeteer"],
};

export default nextConfig;
