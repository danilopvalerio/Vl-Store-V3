/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // Adicione esta linha temporariamente
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3333",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
