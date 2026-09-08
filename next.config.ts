import type { NextConfig } from 'next';

/**
 * Hosting is not decided yet, so this config stays portable: Node runtime only,
 * no platform-specific features, and a standalone build so a container image is
 * one step away whichever host wins.
 *
 * Note that `next start` does not work with output: 'standalone'. The server is
 * started with `node .next/standalone/server.js` after
 * scripts/prepare-standalone.mjs places the static assets next to it; the `start`
 * script and the Playwright suite both do exactly that.
 *
 * See docs/adr/0005-rendering-strategy-and-hosting.md.
 */
const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
