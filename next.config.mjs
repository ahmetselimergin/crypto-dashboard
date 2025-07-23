/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/external/:path*",
        destination: "http://162.55.100.111:8000/:path*",
      },
    ];
  },
};

export default nextConfig;
