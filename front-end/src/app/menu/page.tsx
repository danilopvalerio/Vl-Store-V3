"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import {
  faBox,
  faUsers,
  faShoppingCart,
  faCashRegister,
  faChartBar,
  faUser,
  faRightFromBracket,
  faShoppingBag,
  faBars, // <--- Import do ícone do menu
} from "@fortawesome/free-solid-svg-icons";

import api from "../../utils/api";
import InfoCard from "./infoCard";

// Interface compatível com o objeto 'user' que salvamos no localStorage no Login
interface UserData {
  id: string;
  email: string;
  nome: string;
  role: string; // Ex: "ADMIN", "FUNCIONARIO", "GERENTE"
  lojaId: string;
  telefones: string[];
}

const MenuPage = () => {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [checkingLogin, setCheckingLogin] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // ---------------------------------------------------------
  // 1. Verifica Login (Lê do LocalStorage para ser rápido)
  // ---------------------------------------------------------
  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");

    if (!storedToken || !storedUser) {
      // Se não tem dados, manda pro login
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUserData(parsedUser);
    } catch (error) {
      console.error("Erro ao processar dados do usuário:", error);
      localStorage.clear();
      router.push("/login");
    } finally {
      // Para de mostrar o "loading"
      setCheckingLogin(false);
    }
  }, [router]);

  // ---------------------------------------------------------
  // 2. Logout (Chama API para limpar Cookie e limpa LocalStorage)
  // ---------------------------------------------------------
  const handleLogout = async () => {
    try {
      // Chama o backend para invalidar o Refresh Token no banco (via Cookie)
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Erro ao fazer logout no servidor (ignorando):", error);
    } finally {
      // Limpa o navegador e redireciona
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  // Helper para navegar e fechar o menu mobile
  const navigateTo = (path: string) => {
    router.push(path);
    setMenuOpen(false);
  };

  // ---------------------------------------------------------
  // 3. Tela de Carregamento (Spinner)
  // ---------------------------------------------------------
  if (checkingLogin) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center">
        <h5 className="mx-auto bg-light rounded-5 p-3 d-flex align-items-center shadow-sm">
          <div
            className="spinner-border spinner-border-sm me-2"
            role="status"
          />
          Carregando menu...
        </h5>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 4. Renderização Principal
  // ---------------------------------------------------------
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* === Navbar === */}
      <Navbar
        expand="lg"
        className="border-bottom bg-gradient-vl-2 shadow-sm"
        expanded={menuOpen}
        onToggle={setMenuOpen}
        // Removemos o data-bs-theme="dark" aqui para controlarmos o ícone manualmente
      >
        <Container fluid>
          {/* Toggle (Hamburguer) Customizado e Mais Grosso */}
          <Navbar.Toggle
            aria-controls="basic-navbar-nav"
            className="border-0 p-0" // Remove borda padrão do botão
          >
            <FontAwesomeIcon
              icon={faBars}
              className="text-white fs-2" // fs-2 aumenta o tamanho, deixando mais grosso
            />
          </Navbar.Toggle>

          {/* Exibe Nome e Cargo */}
          <Navbar.Text className=" text-white ms-3 me-3 fw-bold fs-6">
            {userData?.nome || "Usuário"}
            <FontAwesomeIcon icon={faShoppingBag} className="me-3 ms-3 fs-6" />
            <span className="fw-bold fs-6">
              {userData?.role === "ADMIN" && "Administrador"}
              {userData?.role === "FUNCIONARIO" && "Funcionário"}
              {userData?.role === "GERENTE" && "Gerente"}
            </span>
          </Navbar.Text>

          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center gap-2">
              {/* Link Produtos (Todos veem) */}
              <Nav.Link
                className="text-white fw-bold"
                onClick={() => navigateTo("/products")}
              >
                <FontAwesomeIcon icon={faBox} className="me-2" />
                Produtos
              </Nav.Link>

              {/* Link Funcionários (Só Admin vê) */}
              {userData?.role === "ADMIN" && (
                <Nav.Link
                  className="text-white fw-bold"
                  onClick={() => navigateTo("/employee")}
                >
                  <FontAwesomeIcon icon={faUsers} className="me-2" />
                  Funcionários
                </Nav.Link>
              )}

              {/* Links Futuros/Desativados */}
              <Nav.Link className="text-white disabled opacity-50 fw-bold">
                <FontAwesomeIcon icon={faShoppingCart} className="me-2" />
                Vendas
              </Nav.Link>
              <Nav.Link className="text-white disabled opacity-50 fw-bold">
                <FontAwesomeIcon icon={faCashRegister} className="me-2" />
                Caixas
              </Nav.Link>

              {/* Links Administrativos Extras */}
              {userData?.role === "ADMIN" && (
                <>
                  <Nav.Link className="text-white disabled opacity-50 fw-bold">
                    <FontAwesomeIcon icon={faChartBar} className="me-2" />
                    Relatórios
                  </Nav.Link>
                  <Nav.Link className="text-white disabled opacity-50 fw-bold">
                    <FontAwesomeIcon icon={faUser} className="me-2" />
                    Conta
                  </Nav.Link>
                </>
              )}

              {/* Botão Sair */}
              <Nav.Link
                className="text-white fw-bold btn btn-link text-decoration-none"
                onClick={handleLogout}
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="me-2" />
                Sair
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* === Título === */}
      <div className="w-100 mt-4 mb-2">
        <h5 className="text-center text-secondary fw-bold">RESUMO GERAL</h5>
        <div
          className="mx-auto bg-secondary opacity-25"
          style={{ height: "2px", width: "200px" }}
        ></div>
      </div>

      {/* === Cards / Dashboard === */}
      <section className="w-100 row flex-fill m-0 mt-4 justify-content-center align-items-center px-4">
        {/* 1. Faturamento */}
        <article className="col-lg-4 col-md-6 col-12 d-flex justify-content-center align-items-center mb-4">
          <InfoCard
            title="FATURAMENTO (HOJE)"
            value={1000}
            icon="💵"
            borderColor="#00C9A8"
          />
        </article>

        {/* 2. Novas Vendas */}
        <article className="col-lg-4 col-md-6 col-12 d-flex justify-content-center align-items-center mb-4">
          <InfoCard
            title="NOVAS VENDAS (HOJE)"
            value={15}
            icon="🛒"
            borderColor="#C900DB"
          />
        </article>

        {/* 3. Vendedor Destaque */}
        <article className="col-lg-4 col-md-6 col-12 d-flex justify-content-center align-items-center mb-4">
          <InfoCard
            title="VENDEDOR DESTAQUE (HOJE)"
            value={15}
            icon="🏆"
            borderColor="#FF8800"
          />
        </article>

        {/* 4. Saldo Total */}
        <article className="col-lg-4 col-md-6 col-12 d-flex justify-content-center align-items-center mb-4">
          <InfoCard
            title="SALDO TOTAL (HOJE)"
            value={15}
            icon="💰"
            borderColor="#008CFF"
          />
        </article>

        {/* 5. Saídas Totais */}
        <article className="col-lg-4 col-md-6 col-12 d-flex justify-content-center align-items-center mb-4">
          <InfoCard
            title="SAÍDAS TOTAIS (HOJE)"
            value={15}
            icon="📉"
            borderColor="#ff0000"
          />
        </article>

        {/* 6. Entradas Totais */}
        <article className="col-lg-4 col-md-6 col-12 d-flex justify-content-center align-items-center mb-4">
          <InfoCard
            title="ENTRADAS TOTAIS (HOJE)"
            value={15}
            icon="📈"
            borderColor="#00DB28"
          />
        </article>
      </section>

      {/* === Logo e Footer === */}
      <div className="text-center mt-auto pt-5">
        <Image
          className="mx-auto mb-3"
          src="/images/vl-logo.svg"
          alt="VL Store Logo"
          width={200}
          height={0}
          style={{ height: "auto", opacity: 0.8 }}
          priority
        />
      </div>

      <footer>
        <p className="m-0">
          © 2025 Danilo Valério. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
};

export default MenuPage;
