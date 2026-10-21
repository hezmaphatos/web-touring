import type { NextConfig } from "next";

const apiUrl = process.env.API_URL ?? "http://localhost:8000/api/v1";
const backendOrigin = new URL(apiUrl).origin;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Same-origin access to public image variants, needed for WebGL textures (no CORS on /storage).
      { source: "/media/:path*", destination: `${backendOrigin}/storage/:path*` },
    ];
  },
};

export default nextConfig;
