/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  output: 'standalone', // Drastically reduces Docker image size by pruning node_modules
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://api-gateway:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
