/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    domains: ['localhost', 'taskmindai.vercel.app'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'taskmindai.vercel.app'],
    },
  },
};

export default nextConfig;
