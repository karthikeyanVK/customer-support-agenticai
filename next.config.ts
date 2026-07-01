import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Explicitly set the workspace root so Next.js doesn't pick up the
  // package-lock.json from a parent directory.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
