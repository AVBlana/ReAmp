/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "i.scdn.co",
      "i.ytimg.com",
      "yt3.ggpht.com",
      "via.placeholder.com",
    ],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
