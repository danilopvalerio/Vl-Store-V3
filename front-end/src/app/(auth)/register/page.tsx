// app/register/page.tsx
// Nenhum "use client" aqui! Este agora é um Componente de Servidor.
import Link from "next/link";
import RegisterForm from "./../../../features/auth/components/RegisterForm"; // Importamos o nosso novo componente interativo

export default function RegisterPage() {
  // A única responsabilidade desta página é montar a estrutura.
  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="row flex-fill m-0">
        <div className="col-12 col-md-12 col-lg-6 bg-gradient-vl d-flex flex-column justify-content-center align-items-center p-0 m-0 text-white">
          <h4 className="mb-3 mt-4 login-big-title">Bem-vindo!</h4>
          <p className="login-subtitle">
            Já possui conta?{" "}
            <Link className="grey-link-text fw-bold text-white" href="/login">
              Entrar
            </Link>
          </p>
        </div>

        <div className="col-12 col-md-12 col-lg-6 d-flex align-items-center justify-content-center bg-light">
          <RegisterForm />
        </div>
      </div>

      <footer className="footer-panel w-100">
        <p className="royal-blue-text m-0">
          © 2025 Danilo Valério. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
