"use client";
import { AxiosError } from "axios";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  // CORREÇÃO: Definindo 'admin' como padrão e ajustando o tipo
  const [userType, setUserType] = useState<"admin" | "employee">("admin");

  const togglePasswordVisibility = () => {
    setPasswordVisible((prev) => !prev);
  };

  // CORREÇÃO: Função para lidar com a mudança do tipo de usuário
  const handleUserTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserType(e.target.value as "admin" | "employee");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password || !userType) {
      setError("Email, senha e tipo de usuário são obrigatórios.");
      setLoading(false);
      return;
    }

    try {
      // CORREÇÃO: O payload agora envia 'user_role' com os valores corretos
      const payload = {
        email: email.toLowerCase(),
        senha: password,
        user_role: userType,
      };

      // Usando instancia de api aqui ao invés de usar axios diretamente.
      const response = await api.post("/sessions", payload);

      if (response.status === 200 && response.data.accessToken) {
        const { accessToken } = response.data;

        // Após a sessão ser iniciada com sucesso, armazenamos o accessToken no sessionStorage
        sessionStorage.setItem("accessToken", accessToken);

        router.push("/menu");
      } else {
        setError(response.data.message || "Usuário ou senha incorretos.");
      }
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(
        axiosErr?.response?.data?.message ||
          "Erro no login. Verifique suas credenciais."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto login-register-block fine-transparent-border dark-shadow d-flex justify-content-center align-items-center overflow-hidden w-75 rounded-5">
      <div className="row w-100 shadow overflow-hidden">
        <div className="col-md-6 d-flex flex-column justify-content-center align-items-center text-center p-4 terciary">
          <h4 className="m-3 royal-blue-text">Bem-vindo!</h4>
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
                className="p-2 ps-5 col-12"
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

            <div className="row justify-content-center mb-3">
              <div className="col-6 d-flex justify-content-center align-items-center">
                <input
                  className="radio-clean me-2"
                  type="radio"
                  name="userType"
                  id="adminRadio"
                  value="admin" // CORREÇÃO: Valor alinhado com o backend
                  checked={userType === "admin"} // CORREÇÃO: Descomentado
                  onChange={handleUserTypeChange} // CORREÇÃO: Descomentado
                  disabled={loading}
                />
                <label className="form-check-label" htmlFor="adminRadio">
                  Administrador
                </label>
              </div>

              <div className="col-6 d-flex justify-content-center align-items-center">
                <input
                  className="radio-clean me-2"
                  type="radio"
                  name="userType"
                  id="employeeRadio"
                  value="employee" // CORREÇÃO: Valor alinhado com o backend
                  checked={userType === "employee"} // CORREÇÃO: Descomentado
                  onChange={handleUserTypeChange} // CORREÇÃO: Descomentado
                  disabled={loading}
                />
                <label className="form-check-label" htmlFor="employeeRadio">
                  Funcionário
                </label>
              </div>
            </div>

            {/* Botão */}
            <div className="row mt-3 gap-1">
              <button
                type="submit"
                className="css-button-fully-rounded--white col-11 col-lg-5 mx-auto d-flex justify-content-center align-items-center"
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
