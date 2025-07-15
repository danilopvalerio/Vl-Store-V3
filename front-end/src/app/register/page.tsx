// app/register/page.tsx
// Nenhum "use client" aqui! Este agora é um Componente de Servidor.
import RegisterForm from "./RegisterForm"; // Importamos o nosso novo componente interativo
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  // A única responsabilidade desta página é montar a estrutura.
  return (
    <div className="d-flex justify-content-between flex-column min-vh-100">
      <header className="w-100">
        <div className="header-panel">
          {/* MELHOR PRÁTICA: Envolva a imagem com um Link para navegação */}
          <Link href="/initialPage">
            <Image
              src="/images/vl-store-logo.svg"
              alt="Logo"
              width={180}
              height={40}
              className="img logo"
              style={{ cursor: "pointer" }}
              priority // Adicionado para otimizar o carregamento da logo
            />
          </Link>
        </div>
      </header>

      <main className="flex-grow-1 d-flex align-items-center justify-content-center">
        {/* Aqui é onde o componente de cliente com o formulário é renderizado */}
        <RegisterForm />
      </main>

      <footer className="footer-panel w-100">
        <p className="royal-blue-text m-0">
          © 2025 Danilo Valério. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
