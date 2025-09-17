"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isLoggedIn } from "../../utils/auth";
import {
  faBox,
  faUsers,
  faShoppingCart,
  faCashRegister,
  faChartBar,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import api from "../../utils/api";

interface UserData {
  idLoja?: string;
  cpf?: string;
  nome: string;
  email: string;
  cargo?: string;
  nomeLoja: string;
}

const MenuPage: React.FC = () => {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [role, setRole] = useState<"admin" | "employee" | null>(null);
  const [checkingLogin, setCheckingLogin] = useState(true);

  useEffect(() => {
    const verify = async () => {
      const logged = await isLoggedIn();
      if (!logged) {
        router.push("/login");
        return;
      }

      try {
        const response = await api.get(`/sessions/profile`);
        if (response.status === 200 && response.data.user) {
          setUserData(response.data.user);
          setRole(response.data.role);
        }
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
      } finally {
        setCheckingLogin(false);
      }
    };

    verify();
  }, [router]);

  const handleLogout = async () => {
    try {
      await api.delete(`/sessions/logout`);
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

  if (checkingLogin) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center">
        <h5 className="mx-auto bg-light rounded-5 p-3 d-flex align-items-center">
          <span className="spinner me-2"></span>
          Um momento
        </h5>
      </div>
    );
  }

  return (
    <div className="menu-container d-flex justify-content-between align-items-center flex-column min-vh-100">
      <header className="w-100">
        <div className="header-panel">
          <Image
            src="/images/vl-store-logo.svg"
            alt="VL Store Logo"
            width={45}
            height={45}
            priority
          />
        </div>
      </header>

      <div className="row w-75 dark-shadow overflow-hidden rounded-5">
        <div className="col-md-6 d-flex flex-column justify-content-center align-items-center text-center p-2 terciary">
          <h4 className="m-3 royal-blue-text">
            Bem-vindo, {userData?.nome || "Usuário"}!
          </h4>
          {role === "employee" && (
            <p className="w-75 royal-blue-text">
              Loja vinculada: {userData?.nomeLoja}
            </p>
          )}
          <p className="w-75 royal-blue-text">
            VL Store - Sistema de Gestão Comercial
          </p>
        </div>

        <div className="col-md-6 secondary pt-3 d-flex flex-column justify-content-center align-items-center text-center p-1 pt-4 pb-4">
          {/* Produtos */}
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

          {/* Funcionários (apenas admin) */}
          {role === "admin" && (
            <div className="position-relative col-9 col-lg-5 mb-3">
              <button
                className="css-button-fully-rounded--white w-100 ps-5 text-start"
                onClick={() => navigateTo("/employee")}
              >
                <FontAwesomeIcon
                  icon={faUsers}
                  className="position-absolute top-50 start-0 translate-middle-y ms-3"
                />
                Funcionários
              </button>
            </div>
          )}

          {/* Vendas */}
          <div className="position-relative col-9 col-lg-5 mb-3">
            <button
              className="css-button-fully-rounded--white w-100 ps-5 text-start"
              onClick={() => navigateTo("/salesPage")}
              disabled
            >
              <FontAwesomeIcon
                icon={faShoppingCart}
                className="position-absolute top-50 start-0 translate-middle-y ms-3"
              />
              Vendas
            </button>
          </div>

          {/* Caixas */}
          <div className="position-relative col-9 col-lg-5 mb-3">
            <button
              className="css-button-fully-rounded--white w-100 ps-5 text-start"
              onClick={() => navigateTo("/cashierPage")}
              disabled
            >
              <FontAwesomeIcon
                icon={faCashRegister}
                className="position-absolute top-50 start-0 translate-middle-y ms-3"
              />
              Caixas
            </button>
          </div>

          {/* Relatórios (apenas admin) */}
          {role === "admin" && (
            <div className="position-relative col-9 col-lg-5 mb-3">
              <button
                className="css-button-fully-rounded--white w-100 ps-5 text-start"
                onClick={() => navigateTo("/reportsPage")}
                disabled
              >
                <FontAwesomeIcon
                  icon={faChartBar}
                  className="position-absolute top-50 start-0 translate-middle-y ms-3"
                />
                Relatórios
              </button>
            </div>
          )}

          {/* Conta (apenas admin) */}
          {role === "admin" && (
            <div className="position-relative col-9 col-lg-5 mb-3">
              <button
                className="css-button-fully-rounded--white w-100 ps-5 text-start"
                onClick={() => navigateTo("/accountPage")}
                disabled
              >
                <FontAwesomeIcon
                  icon={faUser}
                  className="position-absolute top-50 start-0 translate-middle-y ms-3"
                />
                Conta
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="footer-panel w-100">
        <button
          className="logout-btn css-button-fully-rounded--white col-3 mx-auto d-flex justify-content-center align-items-center"
          onClick={handleLogout}
        >
          Sair
        </button>
      </footer>
    </div>
  );
};

export default MenuPage;
