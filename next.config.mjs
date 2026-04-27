/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Do not bundle pdfjs-dist on the server — it dynamically imports pdf.worker.mjs
  // which Turbopack cannot trace, causing a runtime "Cannot find module" error.
  serverExternalPackages: ['pdfjs-dist'],
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
};

export default nextConfig;
