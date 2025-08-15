"use client";
import { useRouter } from "next/navigation";
import Head from "next/head";
import axios from "axios";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox, // Produtos
  faUsers, // Funcionários
  faShoppingCart, // Vendas
  faCashRegister, // Caixas
  faChartBar, // Relatórios
  faUser, // Conta
} from "@fortawesome/free-solid-svg-icons";

import styles from "../../styles/products.module.css";

// Interface para os dados da loja que virão do backend
interface LojaData {
  id_loja: string;
  nome: string;
  email: string;
}

const MenuPage: React.FC = () => {
  const router = useRouter();
  const [lojaData, setLojaData] = useState<LojaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isViewOnly = false;

  useEffect(() => {
    const verifyTokensAndFetchProfile = async () => {
      const accessToken = sessionStorage.getItem("accessToken");

      try {
        const response = await axios.get(
          "http://localhost:3000/api/sessions/profile",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            withCredentials: true,
          }
        );

        if (response.status === 200 && response.data.loja) {
          setLojaData(response.data.loja);
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          try {
            const refreshResponse = await axios.post(
              "http://localhost:3000/api/sessions/refresh",
              {},
              { withCredentials: true }
            );

            const newAccessToken = refreshResponse.data.accessToken;
            sessionStorage.setItem("accessToken", newAccessToken);

            const retryResponse = await axios.get(
              "http://localhost:3000/api/sessions/profile",
              {
                headers: {
                  Authorization: `Bearer ${newAccessToken}`,
                },
                withCredentials: true,
              }
            );

            if (retryResponse.status === 200 && retryResponse.data.loja) {
              setLojaData(retryResponse.data.loja);
            }
          } catch (refreshError) {
            console.error("Refresh token inválido. Redirecionando para login.");
            router.push("/login");
          }
        } else {
          console.error("Erro inesperado ao buscar perfil:", error);
          router.push("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyTokensAndFetchProfile();
  }, [router]);

  const handleLogout = async () => {
    try {
      await axios.delete("http://localhost:3000/api/sessions/logout", {
        withCredentials: true,
      });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      sessionStorage.removeItem("accessToken");
      router.push("/login");
    }
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  if (isLoading) {
    return (
      <div
        className={`d-flex vh-100 justify-content-center align-items-center`}
      >
        Carregando...
      </div>
    );
  }

  return (
    <div
      className={`menu-container d-flex justify-content-between align-items-center flex-column min-vh-100`}
    >
      <header className={`w-100`}>
        <div className={`header-panel `}>
          <img
            src="/images/vl-store-logo.svg"
            alt="VL Store Logo"
            className={`img logo`}
          />
        </div>
      </header>

      <div className={`row w-75 dark-shadow overflow-hidden rounded-5`}>
        <div
          className={`col-md-6 d-flex flex-column justify-content-center align-items-center text-center p-2 terciary`}
        >
          <h4 className={`m-3 royal-blue-text`}>
            Bem-vindo, {lojaData?.nome || "Usuário"}!
          </h4>
          <p className={`w-75 royal-blue-text`}>
            VL Store - Sistema de Gestão Comercial
          </p>
        </div>

        <div className="col-md-6 secondary pt-3 d-flex flex-column justify-content-center align-items-center text-center p-1 pt-4 pb-4">
          <div className="position-relative col-9 col-lg-5 mb-3">
            <button
              className="css-button-fully-rounded--white w-100 ps-5 text-start"
              onClick={() => navigateTo("/products")}
            >
              <FontAwesomeIcon
                icon={faBox}
                className="position-absolute top-50 start-0 translate-middle-y ms-3"
              />
              Produtos
            </button>
          </div>

          <div className="position-relative col-9 col-lg-5 mb-3">
            <button
              className="css-button-fully-rounded--white w-100 ps-5 text-start"
              onClick={() => navigateTo("/employeesPage")}
            >
              <FontAwesomeIcon
                icon={faUsers}
                className="position-absolute top-50 start-0 translate-middle-y ms-3"
              />
              Funcionários
            </button>
          </div>

          <div className="position-relative col-9 col-lg-5 mb-3">
            <button
              className="css-button-fully-rounded--white w-100 ps-5 text-start"
              onClick={() => navigateTo("/salesPage")}
            >
              <FontAwesomeIcon
                icon={faShoppingCart}
                className="position-absolute top-50 start-0 translate-middle-y ms-3"
              />
              Vendas
            </button>
          </div>

          <div className="position-relative col-9 col-lg-5 mb-3">
            <button
              className="css-button-fully-rounded--white w-100 ps-5 text-start"
              onClick={() => navigateTo("/cashierPage")}
            >
              <FontAwesomeIcon
                icon={faCashRegister}
                className="position-absolute top-50 start-0 translate-middle-y ms-3"
              />
              Caixas
            </button>
          </div>

          <div className="position-relative col-9 col-lg-5 mb-3">
            <button
              className="css-button-fully-rounded--white w-100 ps-5 text-start"
              onClick={() => navigateTo("/reportsPage")}
            >
              <FontAwesomeIcon
                icon={faChartBar}
                className="position-absolute top-50 start-0 translate-middle-y ms-3"
              />
              Relatórios
            </button>
          </div>

          <div className="position-relative col-9 col-lg-5 mb-3">
            <button
              className="css-button-fully-rounded--white w-100 ps-5 text-start"
              onClick={() => navigateTo("/accountPage")}
              disabled={isViewOnly}
            >
              <FontAwesomeIcon
                icon={faUser}
                className="position-absolute top-50 start-0 translate-middle-y ms-3"
              />
              Conta
            </button>
          </div>
        </div>
      </div>

      <footer className="footer-panel w-100">
        <button
          className={`logout-btn css-button-fully-rounded--white col-3 mx-auto d-flex justify-content-center align-items-center`}
          onClick={handleLogout}
        >
          Sair
        </button>
      </footer>
    </div>
  );
};

export default MenuPage;
