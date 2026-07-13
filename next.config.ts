import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Static export doesn't serve index.html at "/" through the dev server's
  // routing, so the navigation shell must be precached explicitly or an
  // offline reload of "/" has nothing to serve from cache.
  additionalPrecacheEntries: [{ url: "/", revision: Date.now().toString() }],
});

const nextConfig: NextConfig = {
  output: "export",
};

export default withSerwist(nextConfig);
