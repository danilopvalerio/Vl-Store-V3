"use client";

import { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faEnvelope,
  faLock,
  faStore,
  faChevronLeft,
  faChevronRight,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

import api from "../../utils/api";
// Importe seus tipos centrais
import { UserData } from "../../features/dashboard/types/index";
import { ApiErrorResponse } from "../../types/api";

// --- Interfaces Locais ---
interface ProfileOption {
  id: string;
  lojaName: string;
  cargo: string;
}

interface LoginResponse {
  accessToken: string;
  user: UserData;
  multiProfile?: boolean;
  profiles?: ProfileOption[];
}

export default function LoginForm() {
  const router = useRouter();

  // Estados de Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Estados de Seleção de Loja
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [showStoreSelection, setShowStoreSelection] = useState(false);

  // Paginação (5 para caber no layout original)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  }, []);

  const togglePasswordVisibility = () => setPasswordVisible((prev) => !prev);

  // Paginação Lógica
  const totalPages = Math.ceil(profiles.length / ITEMS_PER_PAGE);
  const paginatedProfiles = profiles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // 1. Login Inicial
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = { email: email.toLowerCase(), senha: password };
      const response = await api.post<LoginResponse>("/auth/login", payload);

      if (response.status === 200) {
        const data = response.data;

        // CASO A: Múltiplas Lojas
        if (data.multiProfile && data.profiles) {
          setProfiles(data.profiles);
          api.defaults.headers.Authorization = `Bearer ${data.accessToken}`;
          setShowStoreSelection(true);
          setLoading(false);
          return;
        }

        // CASO B: Loja Única
        finalizeLogin(data.accessToken, data.user);
      }
    } catch (err: unknown) {
      handleError(err);
      setLoading(false);
    }
  };

  // 2. Seleção de Loja
  const handleSelectStore = async (profileId: string) => {
    setError("");
    setLoading(true);

    try {
      const response = await api.post<LoginResponse>("/auth/select-store", {
        profileId,
      });

      if (response.status === 200) {
        const { accessToken, user } = response.data;
        finalizeLogin(accessToken, user);
      }
    } catch (err: unknown) {
      handleError(err);
      setLoading(false);
    }
  };

  // Helper
  const finalizeLogin = (token: string, user: UserData) => {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("user", JSON.stringify(user));
    api.defaults.headers.Authorization = `Bearer ${token}`;
    router.push("/dashboard");
  };

  const handleError = (err: unknown) => {
    if (err instanceof AxiosError) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        "Erro ao realizar login.";
      setError(errorMessage);
    } else if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("Erro desconhecido.");
    }
  };

  return (
    <div className="mx-auto d-flex justify-content-center align-items-center overflow-hidden w-100">
      <div className="col-md-6 w-75 p-4">
        {/* LOGO */}
        <div className="w-100 d-flex justify-content-center align-items-center">
          <Image
            src="/images/vl-logo.svg"
            alt="VL Store Logo"
            width={60}
            height={60}
            priority
          />
        </div>

        {error && <div className="alert alert-danger mt-3">{error}</div>}

        {!showStoreSelection ? (
          /* ============================================================
             VIEW 1: FORMULÁRIO DE LOGIN ORIGINAL
             ============================================================ */
          <>
            <h3 className="text-center mb-4 mt-4">Bem vindo de volta!</h3>

            <form onSubmit={handleLogin}>
              <div className="position-relative mb-3">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                />
                <input
                  type="email"
                  className="p-2 ps-5 col-12 form-control-underline"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="position-relative mb-3">
                <FontAwesomeIcon
                  icon={faLock}
                  className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                />
                <input
                  type={passwordVisible ? "text" : "password"}
                  className="p-2 ps-5 col-12 form-control-underline"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <span
                  className="position-absolute top-50 end-0 translate-middle-y me-4"
                  style={{ cursor: "pointer", zIndex: 100 }}
                  onClick={togglePasswordVisibility}
                >
                  <FontAwesomeIcon
                    className="text-secondary"
                    icon={passwordVisible ? faEyeSlash : faEye}
                  />
                </span>
              </div>

              <div className="row mt-3 gap-1">
                <button
                  type="submit"
                  className="col-11 col-lg-5 mx-auto d-flex justify-content-center align-items-center button-dark-grey w-100"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </div>

              <div className="row mt-3 gap-1">
                <button
                  type="button"
                  className="col-11 col-lg-5 mx-auto d-flex justify-content-center align-items-center button-white-grey-border w-100"
                  onClick={() => router.push("/register")}
                  disabled={loading}
                >
                  Registrar
                </button>
              </div>

              <p className="w-100 text-center mt-3 quartenary fw-light">
                Não possui uma conta?{" "}
                <Link
                  className="grey-link-text fw-normal fst-italic"
                  href="/register"
                >
                  Crie uma nova conta.
                  <br />
                </Link>
                É gratuito e leva apenas um minuto!
              </p>
            </form>
          </>
        ) : (
          /* ============================================================
             VIEW 2: SELEÇÃO DE LOJA (MANTENDO ESTILO)
             ============================================================ */
          <div className="animate-fade-in">
            <h3 className="text-center mb-4 mt-4">Escolha sua Loja</h3>

            <p className="text-center text-muted small mb-4">
              Selecione onde deseja acessar
            </p>

            {/* Lista de Lojas - Usando suas classes de botão para consistência */}
            <div className="d-flex flex-column gap-2 mb-3">
              {paginatedProfiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectStore(p.id)}
                  disabled={loading}
                  className="button-white-grey-border w-100 p-3 d-flex align-items-center justify-content-between text-start"
                  style={{ minHeight: "60px" }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <FontAwesomeIcon
                      icon={faStore}
                      className="text-secondary"
                    />
                    <div style={{ lineHeight: "1.2" }}>
                      <div className="fw-bold">{p.lojaName}</div>
                      <small
                        className="text-muted"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {p.cargo}
                      </small>
                    </div>
                  </div>
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    className="text-secondary opacity-50"
                    size="xs"
                  />
                </button>
              ))}
            </div>

            {/* Paginação Minimalista */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center align-items-center gap-3 mb-3 mt-2">
                <button
                  className="btn btn-sm btn-link text-secondary"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <span className="small text-muted">
                  {currentPage} / {totalPages}
                </span>
                <button
                  className="btn btn-sm btn-link text-secondary"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
            )}

            {/* Botão Voltar */}
            <div className="row mt-3 gap-1">
              <button
                type="button"
                className="col-11 col-lg-5 mx-auto d-flex justify-content-center align-items-center button-dark-grey w-100"
                onClick={() => {
                  setShowStoreSelection(false);
                  setError("");
                  setPassword(""); // Limpa senha por segurança
                }}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
