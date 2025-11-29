// Nenhum "use client" aqui! Este agora é um Componente de Servidor.
import LoginForm from "./LoginForm";
import "../../styles/login.css";

export default function LoginPage() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="row flex-fill m-0">
        <div className="col-12 col-md-6 p-3 bg-gradient-vl d-flex flex-column justify-content-center align-items-center p-0 m-0 text-white">
          <h1 className="mb-3 login-big-title">
            Acesso <br />
            ao VL Store.
          </h1>
          <p className="login-subtitle">
            Acesse seu ambiente de administração e continue <br />
            suas atividades.
          </p>
        </div>

        <div className="col-12 col-md-6 d-flex align-items-center justify-content-center bg-light">
          <LoginForm />
        </div>
      </div>

      <footer>
        <p className="m-0">
          © 2025 Danilo Valério. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
