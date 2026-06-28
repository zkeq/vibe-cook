import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['192.168.1.5'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cos.onmicrosoft.cn',
        pathname: '/cook/**',
      },
    ],
  },
};

export default nextConfig;
