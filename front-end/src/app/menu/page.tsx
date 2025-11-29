"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Nav, Button, Offcanvas } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faUsers,
  faShoppingCart,
  faRightFromBracket,
  faBars,
  faHome,
} from "@fortawesome/free-solid-svg-icons";

import api from "../../utils/api";
import InfoCard from "./infoCard";

interface UserData {
  id: string;
  email: string;
  nome: string;
  role: string;
}

const MenuPage = () => {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMobile, setShowMobile] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("accessToken");

    if (!storedToken || !storedUser) {
      router.push("/login");
    } else {
      try {
        setUserData(JSON.parse(storedUser));
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
  }, [router]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.clear();
    router.push("/login");
  };

  const getUserInitial = () =>
    userData?.nome ? userData.nome.charAt(0).toUpperCase() : "U";

  // --- Sidebar Content ---
  const SidebarContent = () => (
    <div className="h-100 border-top border-secondary bg-gradient-vl d-flex flex-column">
      <div className="d-flex flex-column align-items-center py-4 border-bottom border-secondary">
        <div className="avatar-circle">{getUserInitial()}</div>
        <div className="fw-bold text-truncate w-75 text-center">
          {userData?.nome}
        </div>
        <small className="text-white small text-truncate w-75 text-center">
          {userData?.email}
        </small>
      </div>

      <Nav className="flex-column p-2 gap-1 mt-2 flex-grow-1">
        <small
          className="text-uppercase fw-bold text-white ms-2 mb-1"
          style={{ fontSize: "0.75rem" }}
        >
          Menu
        </small>

        <div
          className="nav-item-custom text-white"
          onClick={() => router.push("/menu")}
        >
          <FontAwesomeIcon icon={faHome} className="me-3" width={16} /> Início
        </div>

        <div
          className="nav-item-custom text-white"
          onClick={() => router.push("/products")}
        >
          <FontAwesomeIcon icon={faBox} className="me-3" width={16} /> Produtos
        </div>

        {userData?.role === "ADMIN" ||
          (userData?.role === "SUPER_ADMIN" && (
            <div
              className="nav-item-custom text-white"
              onClick={() => router.push("/employee")}
            >
              <FontAwesomeIcon icon={faUsers} className="me-3" width={16} />{" "}
              Funcionários
            </div>
          ))}

        <div className="nav-item-custom disabled">
          <FontAwesomeIcon icon={faShoppingCart} className="me-3" width={16} />{" "}
          Vendas
        </div>

        {userData?.role === "ADMIN" ||
          (userData?.role === "SUPER_ADMIN" && (
            <div
              className="nav-item-custom text-white"
              onClick={() => router.push("/accessLogs")}
            >
              <FontAwesomeIcon icon={faUsers} className="me-3" width={16} />{" "}
              Logs de Acesso
            </div>
          ))}

        {userData?.role === "ADMIN" ||
          (userData?.role === "SUPER_ADMIN" && (
            <div
              className="nav-item-custom text-white"
              onClick={() => router.push("/auditLogs")}
            >
              <FontAwesomeIcon icon={faUsers} className="me-3" width={16} />{" "}
              Logs de Auditoria
            </div>
          ))}
      </Nav>

      <div className="p-2 border-top border-secondary">
        <div className="nav-item-custom text-white" onClick={handleLogout}>
          <FontAwesomeIcon
            icon={faRightFromBracket}
            className="me-3"
            width={16}
          />{" "}
          Sair
        </div>
      </div>
    </div>
  );

  if (loading)
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" />
      </div>
    );

  return (
    <div className="d-flex flex-column vh-100">
      <div className="d-flex flex-grow-1 bg-light overflow-hidden">
        {/* Sidebar Desktop */}
        <aside className="d-none d-lg-block sidebar-wrapper shadow">
          <SidebarContent />
        </aside>

        {/* Sidebar Mobile */}
        <Offcanvas
          show={showMobile}
          onHide={() => setShowMobile(false)}
          className="bg-gradient-vl text-white w-75"
        >
          <Offcanvas.Header closeButton closeVariant="white">
            <Offcanvas.Title>Menu</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-0 sidebar-wrapper w-100 h-100">
            <SidebarContent />
          </Offcanvas.Body>
        </Offcanvas>

        {/* Coluna Direita */}
        <div className="d-flex flex-column flex-grow-1 w-100">
          {/* Header */}
          <div className="flex-shrink-0">
            {/* Header Mobile */}
            <div className="d-lg-none bg-white p-3 shadow-sm d-flex align-items-center gap-3">
              <Button
                variant="link"
                className="text-dark p-0"
                onClick={() => setShowMobile(true)}
              >
                <FontAwesomeIcon icon={faBars} size="lg" />
              </Button>
              <span className="fw-bold">Dashboard</span>
            </div>

            {/* Header Desktop */}
            <header className="d-none d-lg-flex p-4 justify-content-between align-items-center bg-white shadow-sm">
              <div>
                <h4 className="fw-bold m-0 text-dark">Dashboard</h4>
                <small className="text-muted">Visão Geral</small>
              </div>
              <span className="fw-bold">
                {new Date().toLocaleDateString("pt-BR")}
              </span>
            </header>
          </div>

          {/* Conteúdo */}
          <main className="flex-grow-1 overflow-auto p-4">
            <h5 className="fw-bold mb-4">RESUMO GERAL</h5>

            <div className="row g-3">
              <div className="col-12 col-md-6 col-xl-4">
                <InfoCard
                  title="Faturamento (Hoje)"
                  value={1000}
                  icon="💵"
                  borderColor="#00C9A8"
                />
              </div>
              <div className="col-12 col-md-6 col-xl-4">
                <InfoCard
                  title="Novas Vendas (Hoje)"
                  value={15}
                  icon="🛒"
                  borderColor="#C900DB"
                />
              </div>
              <div className="col-12 col-md-6 col-xl-4">
                <InfoCard
                  title="Vendedor destaque do dia"
                  value={"Camila S."}
                  icon="🏆"
                  borderColor="#FF8800"
                />
              </div>
            </div>
          </main>
        </div>
      </div>

      <footer className="">
        © 2025 Danilo Valério. Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default MenuPage;
