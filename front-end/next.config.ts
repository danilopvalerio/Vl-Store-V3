/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost", // Se estiver rodando local
        port: "3333", // A porta do seu BACK-END (onde estão as imagens)
        pathname: "/uploads/**",
      },
      // Adicione aqui o domínio do Contabo/Produção quando fizer deploy
      // {
      //   protocol: 'http', // ou https
      //   hostname: 'seu-ip-contabo-ou-dominio.com',
      //   port: '',
      //   pathname: '/uploads/**',
      // },
    ],
  },
};

export default nextConfig;
