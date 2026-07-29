import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.oasisportal.tech';
    return [
      {
        source: '/admin',
        destination: `${backendUrl}/admin/`,
        permanent: false,
      },
      {
        source: '/admin/:path*',
        destination: `${backendUrl}/admin/:path*`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
