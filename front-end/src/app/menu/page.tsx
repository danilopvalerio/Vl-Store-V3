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
  faCashRegister, // Ícone para Caixa
  faCog, // Ícone para Ajustes/Configurações
  faChartPie, // Ícone para Relatórios
  faClipboardList, // Ícone para Logs/Auditoria
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

  const isAdmin =
    userData?.role === "ADMIN" || userData?.role === "SUPER_ADMIN";

  // --- Sidebar Content ---
  const SidebarContent = () => (
    <div
      className="h-100 beauty-scroll border-top border-secondary bg-gradient-vl d-flex flex-column"
      style={{
        maxHeight: "100vh",
        overflowY: "auto",
      }}
    >
      {/* Perfil do Usuário */}
      <div className="d-flex flex-column align-items-center py-4 border-bottom border-secondary">
        <div className="avatar-circle">{getUserInitial()}</div>
        <div className="fw-bold text-truncate w-75 text-center mt-2">
          {userData?.nome}
        </div>
        <small className="text-white-50 small text-truncate w-75 text-center">
          {userData?.role === "SUPER_ADMIN" ? "Super Admin" : userData?.role}
        </small>
      </div>

      <Nav className="flex-column p-2 gap-1 mt-2 flex-grow-1">
        {/* OPERACIONAL (Acesso Geral) */}
        <small
          className="text-uppercase fw-bold text-white-50 ms-2 mb-1"
          style={{ fontSize: "0.7rem" }}
        >
          Operacional
        </small>

        <div
          className="nav-item-custom text-white"
          onClick={() => router.push("/menu")}
        >
          <FontAwesomeIcon
            icon={faHome}
            className="me-3 fw-fixed-width"
            width={20}
          />
          Visão Geral
        </div>

        <div
          className="nav-item-custom text-white"
          onClick={() => router.push("/cashier")}
        >
          <FontAwesomeIcon
            icon={faCashRegister}
            className="me-3 fw-fixed-width"
            width={20}
          />
          Frente de Caixa
        </div>

        <div
          className="nav-item-custom text-white"
          onClick={() => router.push("/products")}
        >
          <FontAwesomeIcon
            icon={faBox}
            className="me-3 fw-fixed-width"
            width={20}
          />
          Estoque & Produtos
        </div>

        <div className="nav-item-custom disabled text-white-50">
          <FontAwesomeIcon
            icon={faShoppingCart}
            className="me-3 fw-fixed-width"
            width={20}
          />
          Histórico de Vendas
        </div>

        {/* GESTÃO (Apenas Admin) */}
        {isAdmin && (
          <>
            <div className="my-2 border-top border-secondary opacity-25 mx-2"></div>
            <small
              className="text-uppercase fw-bold text-white-50 ms-2 mb-1"
              style={{ fontSize: "0.7rem" }}
            >
              Administração
            </small>

            <div
              className="nav-item-custom text-white disabled"
              onClick={() => router.push("/reports")}
            >
              <FontAwesomeIcon
                icon={faChartPie}
                className="me-3 fw-fixed-width"
                width={20}
              />
              Relatórios Financeiros
            </div>

            <div
              className="nav-item-custom text-white"
              onClick={() => router.push("/employee")}
            >
              <FontAwesomeIcon
                icon={faUsers}
                className="me-3 fw-fixed-width"
                width={20}
              />
              Equipe
            </div>

            <div
              className="nav-item-custom text-white"
              onClick={() => router.push("/auditLogs")}
            >
              <FontAwesomeIcon
                icon={faClipboardList}
                className="me-3 fw-fixed-width"
                width={20}
              />
              Auditoria
            </div>

            <div
              className="nav-item-custom text-white"
              onClick={() => router.push("/accessLogs")}
            >
              <FontAwesomeIcon
                icon={faClipboardList}
                className="me-3 fw-fixed-width"
                width={20}
              />
              Histórico de acessos
            </div>

            <div
              className="nav-item-custom text-white"
              onClick={() => router.push("/settings")}
            >
              <FontAwesomeIcon
                icon={faCog}
                className="me-3 fw-fixed-width"
                width={20}
              />
              Configurações da Loja
            </div>
          </>
        )}
      </Nav>

      <div className="p-2 border-top border-secondary">
        <div className="nav-item-custom text-white" onClick={handleLogout}>
          <FontAwesomeIcon
            icon={faRightFromBracket}
            className="me-3 fw-fixed-width"
            width={20}
          />
          Sair do Sistema
        </div>
      </div>
    </div>
  );

  if (loading)
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );

  return (
    <div className="d-flex flex-column vh-100 bg-light">
      <div className="d-flex flex-grow-1 overflow-hidden">
        {/* Sidebar Desktop */}
        <aside
          className="d-none d-lg-block sidebar-wrapper shadow-sm z-1"
          style={{
            width: "280px",
            minWidth: "280px",
          }}
        >
          <SidebarContent />
        </aside>

        {/* Sidebar Mobile */}
        <Offcanvas
          show={showMobile}
          onHide={() => setShowMobile(false)}
          className="bg-gradient-vl text-white"
          style={{ width: "85%" }}
        >
          <Offcanvas.Header closeButton closeVariant="white">
            <Offcanvas.Title>Menu do Sistema</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-0">
            <SidebarContent />
          </Offcanvas.Body>
        </Offcanvas>

        {/* Conteúdo Principal */}
        <div className="d-flex flex-column flex-grow-1 w-100 overflow-hidden">
          {/* Header */}
          <header className="bg-white shadow-sm px-4 py-3 d-flex justify-content-between align-items-center z-0">
            <div className="d-flex align-items-center gap-3">
              <Button
                variant="link"
                className="text-dark p-0 d-lg-none"
                onClick={() => setShowMobile(true)}
              >
                <FontAwesomeIcon icon={faBars} size="lg" />
              </Button>
              <div>
                <h4 className="fw-bold m-0 text-dark">Dashboard</h4>
                <small className="text-muted">Visão Geral da Loja</small>
              </div>
            </div>
            <div className="d-none d-md-block text-end">
              <span className="fw-bold d-block">
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-grow-1 overflow-auto p-4">
            <h5 className="fw-bold mb-4 text-secondary">RESUMO DO DIA</h5>

            <div className="row g-3">
              <div className="col-12 col-md-6 col-xl-4">
                <InfoCard
                  title="Faturamento"
                  value={1000}
                  icon="💵"
                  borderColor="#00C9A8"
                />
              </div>
              <div className="col-12 col-md-6 col-xl-4">
                <InfoCard
                  title="Vendas Realizadas"
                  value={15}
                  icon="🛒"
                  borderColor="#C900DB"
                />
              </div>
              <div className="col-12 col-md-6 col-xl-4">
                <InfoCard
                  title="Ticket Médio"
                  value={66.6}
                  icon="📊"
                  borderColor="#FF8800"
                />
              </div>
            </div>
          </main>
        </div>
      </div>
      <footer className="">
        © 2025 Danilo Valério - Sistema de Gestão v1.0
      </footer>
    </div>
  );
};

export default MenuPage;
