"use client";
import { useRouter } from "next/navigation";
import Head from "next/head";
import axios from "axios";
import { useEffect, useState } from "react";

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
        // 1. Tenta usar o access token
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
        // 2. Access token pode ter expirado. Tenta usar refresh token.
        if (error.response?.status === 401) {
          try {
            const refreshResponse = await axios.post(
              "http://localhost:3000/api/sessions/refresh",
              {},
              { withCredentials: true }
            );

            const newAccessToken = refreshResponse.data.accessToken;
            sessionStorage.setItem("accessToken", newAccessToken);

            // Retry o profile com o novo token
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
      <div className="d-flex vh-100 justify-content-center align-items-center">
        Carregando...
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-between align-items-center flex-column min-vh-100">
      <Head>
        <title>VL Store</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <header className="w-100">
        <div className="header-panel">
          <img
            src="/images/vl-store-logo.svg"
            alt="VL Store Logo"
            className="img logo"
          />
        </div>
      </header>

      <div className="menu row w-75 white-light overflow-hidden rounded-5">
        <div className="col-md-6 d-flex flex-column justify-content-center align-items-center text-center p-2 terciary">
          <h4 className="m-3">VL Store</h4>
          <h4 className="m-3">Bem-vindo, {lojaData?.nome || "Usuário"}!</h4>
          <p className="w-75">Sistema de Gestão Comercial</p>
        </div>

        <div className="col-md-6 secondary pt-3 d-flex flex-column justify-content-center align-items-center text-center p-1 pt-4 pb-4">
          <button
            className="btn primaria col-9 col-lg-5 mb-3"
            onClick={() => navigateTo("/products")}
          >
            Produtos
          </button>
          <button
            className="btn primaria col-9 col-lg-5 mb-3"
            onClick={() => navigateTo("/employeesPage")}
          >
            Funcionários
          </button>
          <button
            className="btn primaria col-9 col-lg-5 mb-3"
            onClick={() => navigateTo("/salesPage")}
          >
            Vendas
          </button>
          <button
            className="btn primaria col-9 col-lg-5 mb-3"
            onClick={() => navigateTo("/cashierPage")}
          >
            Caixas
          </button>
          <button
            className="btn primaria col-9 col-lg-5 mb-3"
            onClick={() => navigateTo("/reportsPage")}
          >
            Relatórios
          </button>
          <button
            className="btn primaria col-9 col-lg-5 mb-2"
            onClick={() => navigateTo("/accountPage")}
            disabled={isViewOnly}
          >
            Conta
          </button>
        </div>
      </div>

      <button
        className="btn primaria mb-4 col-3 mx-auto d-flex justify-content-center align-items-center"
        onClick={handleLogout}
      >
        Sair
      </button>
    </div>
  );
};

export default MenuPage;
