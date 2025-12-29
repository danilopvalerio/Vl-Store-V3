"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCog } from "@fortawesome/free-solid-svg-icons";

// Importação dos Componentes
import StoreSettingsForm from "../../../features/settings/StoreSettingsForm";
import UserSettingsForm from "../../../features/settings/UserSettingsForm";
import CreateStoreForm from "../../../features/settings/CreateStoreForm";

const SettingsPage = () => {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Verificação de Autenticação Básica
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    setCheckingAuth(false);
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center">
        <div className="spinner-border text-secondary" />
      </div>
    );
  }

  return (
    <div
      className="d-flex flex-column min-vh-100"
      style={{ backgroundColor: "#e9e9e9ff" }}
    >
      {/* Header Panel (Padrão das outras páginas) */}
      <header className="header-panel bg-gradient-vl d-flex align-items-center bg-dark px-2">
        <button
          className="btn btn-link text-white ms-0"
          onClick={() => router.push("/dashboard")}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="fs-4" />
        </button>
      </header>

      <div className="container my-5 flex-grow-1">
        {/* Título da Página */}
        <div className="bg-white border rounded-4 shadow-sm mb-4 overflow-hidden">
          <div className="bg-gradient-vl p-4 text-center text-white">
            <h3 className="fw-bold m-0">
              <FontAwesomeIcon icon={faCog} className="me-2" />
              Configurações
            </h3>
            <p className="m-0 opacity-75 small">
              Gerencie dados da loja, perfil e crie novas unidades.
            </p>
          </div>
        </div>

        <div className="row g-4">
          {/* Coluna Esquerda: Formulários de Edição */}
          <div className="col-lg-8">
            <StoreSettingsForm />
            <UserSettingsForm />
          </div>

          {/* Coluna Direita: Criação de Loja (Ações Especiais) */}
          <div className="col-lg-4">
            <CreateStoreForm />

            <div className="mt-4 text-center text-muted small">
              <p className="mb-1">Precisa de ajuda?</p>
              <button className="btn btn-link text-secondary text-decoration-none fw-bold p-0">
                Contatar Suporte
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center py-3 text-muted small">
        © 2025 Sistema VL. Configurações.
      </footer>
    </div>
  );
};

export default SettingsPage;
