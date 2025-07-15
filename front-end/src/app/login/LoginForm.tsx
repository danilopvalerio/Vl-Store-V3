"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
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
  const [userType, setUserType] = useState("funcionario");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleUserTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserType(e.target.value);
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible((prev) => !prev);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        setError("Email e senha são obrigatórios.");
        setLoading(false);
        return;
      }

      const targetRoute =
        userType === "administrador" ? "login/loja" : "login/funcionario";

      const payload = {
        email: email.toLowerCase(),
        senha: password,
      };

      const response = await axios.post(
        `https://vl-store-v2.onrender.com/api/${targetRoute}`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = response.data;

      if (response.status === 200 && data.success && data.data?.token) {
        localStorage.setItem("jwtToken", data.data.token);
        if (data.data.loja) {
          localStorage.setItem("userData", JSON.stringify(data.data.loja));
        } else if (data.data.usuario) {
          localStorage.setItem("userData", JSON.stringify(data.data.usuario));
        }

        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${data.data.token}`;
        router.push("/menuPage");
      } else {
        setError(data.message || "Usuário ou senha incorretos.");
      }
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || `Erro na requisição: ${err.message}`
        );
      } else if (err instanceof Error) {
        setError(`Erro inesperado: ${err.message}`);
      } else {
        setError("Erro desconhecido. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

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

            {/* Tipo de usuário */}
            <div className="row justify-content-center">
              <div className="col-10 d-flex justify-content-between">
                <div className="col-4 d-flex align-items-center justify-content-center gap-2">
                  <input
                    className="radio-clean"
                    type="radio"
                    name="userType"
                    id="adminRadio"
                    value="administrador"
                    checked={userType === "administrador"}
                    onChange={handleUserTypeChange}
                    disabled={loading}
                  />
                  <label className="mb-0" htmlFor="adminRadio">
                    Administrador
                  </label>
                </div>

                <div className="col-4 d-flex align-items-center justify-content-center gap-2">
                  <input
                    className="radio-clean"
                    type="radio"
                    name="userType"
                    id="employeeRadio"
                    value="funcionario"
                    checked={userType === "funcionario"}
                    onChange={handleUserTypeChange}
                    disabled={loading}
                  />
                  <label className="mb-0" htmlFor="employeeRadio">
                    Funcionário
                  </label>
                </div>
              </div>
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
