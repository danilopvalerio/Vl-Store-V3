// Nenhum "use client" aqui! Este agora é um Componente de Servidor.
import LoginForm from "./LoginForm"; // Importamos o nosso novo componente interativo

export default function LoginPage() {
  // A única responsabilidade desta página é montar a estrutura.
  return (
    <div className="d-flex justify-content-between flex-column min-vh-100">
      <header className="w-100">
        <div className="header-panel">
          {/* MELHOR PRÁTICA: Envolva a imagem com um Link */}
          <img
            className="img logo"
            // O caminho correto, absoluto a partir da pasta public
            src="/images/vl-store-logo.svg"
            alt="VL Store Logo"
            style={{ cursor: "pointer" }}
          />
        </div>
      </header>

      <main className="flex-grow-1 d-flex align-items-center">
        {/* Aqui é onde o componente de cliente é renderizado */}
        <LoginForm />
      </main>

      <footer className="footer-panel w-100">
        <p className="royal-blue-text m-0">
          © 2025 Danilo Valério. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
