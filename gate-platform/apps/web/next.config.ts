import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standalone output gives the Docker image a self-contained server.js with
  // only the files it needs. The tracing root is the monorepo root so pnpm's
  // hoisted dependencies are included.
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
