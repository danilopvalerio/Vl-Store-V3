import "bootstrap/dist/css/bootstrap.min.css";
import "./../styles/global.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <title>VL Store</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
