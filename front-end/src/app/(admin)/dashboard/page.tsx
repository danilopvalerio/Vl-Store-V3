"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Nav, Button, Offcanvas, Table } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faUsers,
  faShoppingCart,
  faRightFromBracket,
  faBars,
  faHome,
  faCashRegister,
  faCog,
  faChartPie,
  faClipboardList,
  faExclamationTriangle, // Usado no alerta de estoque
} from "@fortawesome/free-solid-svg-icons";

// Imports corrigidos para a profundidade original (../../../)
import api from "../../../utils/api";
import InfoCard from "../../../components/ui/infoCard";
import {
  UserData,
  DashboardData,
} from "../../../features/dashboard/types/index";

const MenuPage = () => {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [showMobile, setShowMobile] = useState(false);

  useEffect(() => {
    const init = async () => {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("accessToken");

      if (!storedToken || !storedUser) {
        router.push("/login");
        return;
      }

      try {
        setUserData(JSON.parse(storedUser));

        // Busca dados reais do Dashboard
        const { data } = await api.get("/dashboard");
        setDashboardData(data);
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
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

  // Formatador de Moeda
  const toBRL = (val: number) =>
    val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // --- Sidebar Content ---
  const SidebarContent = () => (
    <div
      className="h-100 beauty-scroll border-top border-secondary bg-gradient-vl d-flex flex-column"
      style={{ maxHeight: "100vh", overflowY: "auto" }}
    >
      {/* Perfil */}
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
        <small
          className="text-uppercase fw-bold text-white-50 ms-2 mb-1"
          style={{ fontSize: "0.7rem" }}
        >
          Operacional
        </small>

        <div
          className="nav-item-custom text-white"
          onClick={() => router.push("/dashboard")}
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

        {isAdmin && (
          <>
            <div className="my-2 border-top border-secondary opacity-25 mx-2"></div>
            <small
              className="text-uppercase fw-bold text-white-50 ms-2 mb-1"
              style={{ fontSize: "0.7rem" }}
            >
              Administração
            </small>

            <div className="nav-item-custom text-white disabled">
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
              onClick={() => router.push("/audit-logs")}
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
              onClick={() => router.push("/access-logs")}
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
          style={{ width: "280px", minWidth: "280px" }}
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
          {/* Header Superior */}
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
              <span className="fw-bold d-block text-capitalize">
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
            </div>
          </header>

          {/* Área Principal */}
          <main className="flex-grow-1 overflow-auto p-4">
            {/* 1. KPIs FINANCEIROS */}
            <h6 className="fw-bold mb-3 text-secondary text-uppercase small ls-1">
              Performance Hoje
            </h6>
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-6 col-xl-3">
                <InfoCard
                  title="Faturamento"
                  value={toBRL(dashboardData?.financial.revenue || 0)}
                  icon="💵"
                  borderColor="#00C9A8"
                />
              </div>
              <div className="col-12 col-md-6 col-xl-3">
                <InfoCard
                  title="Vendas Realizadas"
                  value={dashboardData?.financial.salesCount || 0}
                  icon="🛒"
                  borderColor="#C900DB"
                />
              </div>
              <div className="col-12 col-md-6 col-xl-3">
                <InfoCard
                  title="Ticket Médio"
                  value={toBRL(dashboardData?.financial.ticket || 0)}
                  icon="📊"
                  borderColor="#FF8800"
                />
              </div>
              <div className="col-12 col-md-6 col-xl-3">
                <InfoCard
                  title="Caixas Abertos"
                  value={dashboardData?.operational.openCashiers || 0}
                  icon="🏪"
                  borderColor="#007bff"
                />
              </div>
            </div>

            <div className="row g-4">
              {/* 2. TABELA DE ÚLTIMAS VENDAS */}
              <div className="col-12 col-xl-8">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-white border-0 pt-4 px-4 pb-2">
                    <h6 className="fw-bold m-0 text-dark">Últimas Vendas</h6>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <Table hover className="mb-0 align-middle">
                        <thead className="bg-light text-secondary small">
                          <tr>
                            <th className="ps-4 border-0">Hora</th>
                            <th className="border-0">Cliente</th>
                            <th className="border-0">Vendedor</th>
                            <th className="text-end border-0 pe-4">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData?.feed.map((sale) => (
                            <tr key={sale.id}>
                              <td className="ps-4 text-muted small font-monospace">
                                {sale.time}
                              </td>
                              <td className="fw-medium text-dark">
                                {sale.customer}
                              </td>
                              <td className="text-muted small">
                                {sale.seller}
                              </td>
                              <td className="text-end fw-bold text-success pe-4">
                                {toBRL(sale.total)}
                              </td>
                            </tr>
                          ))}
                          {(!dashboardData?.feed ||
                            dashboardData.feed.length === 0) && (
                            <tr>
                              <td
                                colSpan={4}
                                className="text-center py-4 text-muted"
                              >
                                Nenhuma venda registrada hoje.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. ALERTAS OPERACIONAIS */}
              <div className="col-12 col-xl-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-white border-0 pt-4 px-4 pb-2">
                    <h6 className="fw-bold m-0 text-dark">
                      Atenção Necessária
                    </h6>
                  </div>
                  <div className="card-body p-4">
                    {/* Alerta de Estoque */}
                    <div
                      className={`alert ${
                        dashboardData?.operational.lowStock
                          ? "alert-danger"
                          : "alert-success"
                      } d-flex align-items-center border-0 shadow-sm mb-3`}
                    >
                      <FontAwesomeIcon
                        icon={
                          dashboardData?.operational.lowStock
                            ? faExclamationTriangle
                            : faBox
                        }
                        className="fs-3 me-3 opacity-50"
                      />
                      <div>
                        <h6 className="fw-bold m-0">
                          {dashboardData?.operational.lowStock || 0}
                        </h6>
                        <small className="mb-0">
                          Produtos com estoque baixo
                        </small>
                      </div>
                    </div>

                    <div className="d-grid">
                      <button
                        className="btn btn-outline-dark btn-sm rounded-pill"
                        onClick={() => router.push("/products")}
                      >
                        Gerenciar Estoque
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <footer className="">© 2025 Sistema VL. Gestão Financeira.</footer>
    </div>
  );
};

export default MenuPage;
