/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@resvg/resvg-js', 'sharp'],
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },
};

module.exports = nextConfig;
