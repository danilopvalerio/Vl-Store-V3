"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// Import your configured api instance
import api from "../../utils/api"; // Adjust the path if necessary
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faEnvelope,
  faLock,
} from "@fortawesome/free-solid-svg-icons";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("contato@sapatariaze.com");
  const [password, setPassword] = useState("umaSenha@Forte123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setPasswordVisible((prev) => !prev);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Email e senha são obrigatórios.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: email.toLowerCase(),
        senha: password,
      };

      // Uando instancia de api aqui ao invés de usar axios diretamente.
      const response = await api.post("/sessions", payload);

      if (response.status === 200 && response.data.accessToken) {
        const { accessToken } = response.data;

        // Após a sessão ser iniciada com sucesso, armazenamos o accessToken no sessionStorage
        sessionStorage.setItem("accessToken", accessToken);
        router.push("/menu");
      } else {
        setError(response.data.message || "Usuário ou senha incorretos.");
      }
    } catch (err: any) {
      // The interceptor will handle 401s, so we mostly catch other errors here
      setError(
        err.response?.data?.message ||
          "Erro no login. Verifique suas credenciais."
      );
    } finally {
      setLoading(false);
    }
  };

  // ... O resto do seu JSX continua o mesmo
  return (
    <div className="mx-auto login-register-block fine-transparent-border dark-shadow d-flex justify-content-center align-items-center overflow-hidden w-75 rounded-5">
      <div className="row w-100 shadow overflow-hidden">
        <div className="col-md-6 d-flex flex-column justify-content-center align-items-center text-center p-4 terciary">
          <h4 className="m-3">Bem-vindo!</h4>
          <p className="w-75">
            Insira os seus dados de login para ter acesso ao sistema.
          </p>
        </div>

        <div className="col-md-6 p-4 secondary">
          <h3 className="text-center mb-4 royal-blue-text">Login</h3>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleLogin}>
            {/* Campo de email com ícone */}
            <div className="position-relative mb-3">
              <FontAwesomeIcon
                icon={faEnvelope}
                className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
              />
              <input
                type="email"
                className="p-2 ps-5 border col-12"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Campo de senha com ícone + olho */}
            <div className="position-relative mb-3">
              <FontAwesomeIcon
                icon={faLock}
                className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
              />
              <input
                type={passwordVisible ? "text" : "password"}
                className="p-2 ps-5 col-12"
                placeholder="Digite sua senha"
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

            {/* Botão */}
            <div className="row mt-3 gap-1">
              <button
                type="submit"
                className="primaria col-11 col-lg-5 mx-auto d-flex justify-content-center align-items-center"
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </div>

            {/* Link para cadastro */}
            <p className="w-100 text-center mt-3">
              Não possui conta?{" "}
              <Link className="royal-blue-text" href="/register">
                Cadastrar
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
