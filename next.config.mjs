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
  // Ensure pdfjs-dist's worker file is included in the serverless bundle.
  // The dynamic import in pdf.mjs isn't followed by the file tracer, so we include it explicitly.
  outputFileTracingIncludes: {
    '/pdf': ['./node_modules/.pnpm/pdfjs-dist@*/node_modules/pdfjs-dist/build/pdf.worker.mjs'],
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
};

export default nextConfig;
