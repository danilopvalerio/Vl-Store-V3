import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VL Store',
  description: 'Descrição do meu App Next',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}