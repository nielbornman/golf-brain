/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // IMPORTANT:
  // Do NOT use `output: "export"` for this app.
  // You have auth + server routes (e.g. /auth/callback) and a PWA;
  // Vercel is built for SSR/Edge and doesn't need static export.
  //
  // output: "export",

  // Optional: keep builds strict
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;