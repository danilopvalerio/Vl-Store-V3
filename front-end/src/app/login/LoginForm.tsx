"use client";
import { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import api from "../../utils/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faEnvelope,
  faLock,
} from "@fortawesome/free-solid-svg-icons";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    // Limpa dados antigos ao entrar na tela de login
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    // Teste de saúde da API (opcional)
    const testApi = async () => {
      try {
        const response = await api.get("/health");
        console.log("API Status:", response.data);
      } catch (err) {
        console.log("Erro de conexão com API:", err);
      }
    };
    testApi();
  }, []);

  const togglePasswordVisibility = () => {
    setPasswordVisible((prev) => !prev);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        email: email.toLowerCase(),
        senha: password,
      };

      const response = await api.post("/auth/login", payload);

      if (response.status === 200) {
        // MUDANÇA: O backend agora só retorna accessToken e user.
        // O refreshToken foi salvo automaticamente pelo navegador nos Cookies.
        const { accessToken, user } = response.data;

        // Salvamos no localStorage
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("user", JSON.stringify(user));

        router.push("/menu");
      }
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error: string }>;
      // Captura mensagem de erro do backend
      setError(
        axiosErr?.response?.data?.error || "Usuário ou senha incorretos."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto d-flex justify-content-center align-items-center overflow-hidden w-100">
      <div className="col-md-6 w-75 p-4">
        <div className="w-100 d-flex justify-content-center align-items-center">
          <Image
            src="/images/vl-logo.svg"
            alt="VL Store Logo"
            width={60}
            height={60}
            priority
          />
        </div>
        <h3 className="text-center mb-4 mt-4">Bem vindo de volta!</h3>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleLogin}>
          {/* Campo de email */}
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

          {/* Campo de senha */}
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

          {/* Botão Entrar */}
          <div className="row mt-3 gap-1">
            <button
              type="submit"
              className="col-11 col-lg-5 mx-auto d-flex justify-content-center align-items-center button-dark-grey w-100"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </div>

          {/* Botão Registrar - MUDANÇA: type="button" */}
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
      </div>
    </div>
  );
}
