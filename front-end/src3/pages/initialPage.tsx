import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import "../../public/css/general.css";

const InitialPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simula carregamento de recursos

    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const pushLoginPage = () => {
    router.push("/loginPage");
  };

  const pushRegisterPage = () => {
    router.push("/RegisterPage");
  };

  return (
    <div className="d-flex justify-content-between align-items-center flex-column min-vh-100">
      <Head>
        <title>Bem-vindo - VL Store</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preload" href="/css/general.css" as="style" />
        <link rel="preload" href="/css/menu.css" as="style" />
      </Head>

      <header className="w-100">
        <div className="header-panel">
          <img
            className="img logo"
            src="/vl-store-logo-white.svg"
            alt="VL Store Logo"
          />
        </div>
      </header>

      <div className="mx-auto fine-transparent-border white-light d-flex justify-content-center align-items-center overflow-hidden rounded-5">
        <div className="row w-100 shadow overflow-hidden">
          {/* Painel de Informações */}
          <div className="col-md-6 text-white d-flex flex-column justify-content-center align-items-center text-center p-4 quartenary">
            <h4 className="m-3">VL Store</h4>
            <p className="w-75">
              Seja bem-vindo à VL Store, a plataforma de gerenciamento
              empresarial da VL Company.
            </p>
          </div>

          {/* Painel de Ações */}
          <div className="col-md-6 p-4 terciary d-flex flex-column justify-content-center align-items-center">
            <img
              className="img mb-4"
              src="/vl-store-logo-white.svg"
              alt="VL Store Logo "
              style={{ height: "50px" }}
            />

            <button
              onClick={pushLoginPage}
              className="btn primaria col-11 col-lg-8 mx-auto mb-3"
            >
              Entrar com email e senha
            </button>
            <button
              onClick={pushRegisterPage}
              className="btn primaria col-11 col-lg-8 mx-auto"
            >
              Cadastrar
            </button>
          </div>
        </div>
      </div>

      <footer className="w-100">
        <div className="footer-panel">
          <p className="text-white mb-0">
            © 2025 VL Company - Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default InitialPage;
