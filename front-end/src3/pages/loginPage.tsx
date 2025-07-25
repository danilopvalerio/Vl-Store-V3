// pages/authPage.tsx
import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import "../../public/css/login.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const AuthPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("funcionario");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const pushInitialPage = () => {
    router.push("/initialPage");
  };

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
      // Captura qualquer erro e seta o erro para o usuário
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
    <div className="d-flex justify-content-between flex-column min-vh-100">
      <Head>
        <title>Login</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <header className="w-100">
        <div className="header-panel">
          <img
            className="img logo"
            src="/vl-store-logo-white.svg"
            alt="VL Store Logo"
            onClick={pushInitialPage}
            style={{ cursor: "pointer" }}
          />
        </div>
      </header>
      {error && <div className="alert alert-danger">{error}</div>}
      <main className="flex-grow-1 d-flex align-items-center">
        <div className="mx-auto login-register-block fine-transparent-border white-light d-flex justify-content-center align-items-center overflow-hidden w-75">
          <div className="row w-100 shadow overflow-hidden">
            <div className="col-md-6 text-white d-flex flex-column justify-content-center align-items-center text-center p-4 quartenary">
              <h4 className="m-3">Bem-vindo!</h4>
              <p className="w-75">
                Insira os seus dados de login para ter acesso ao sistema.
              </p>
            </div>

            <div className="col-md-6 p-4 terciary">
              <h3 className="text-center mb-4">Login</h3>

              <form onSubmit={handleLogin}>
                <div className="input-block row mb-2 align-items-center mb-3">
                  <div className="col-12 w-100">
                    <input
                      type="email"
                      className="form-control input-form"
                      placeholder="Digite seu email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="input-block row mb-2 align-items-center mb-3">
                  <div className="col-12 w-100 position-relative">
                    <input
                      type={passwordVisible ? "text" : "password"}
                      className="form-control input-form"
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
                        icon={passwordVisible ? faEyeSlash : faEye}
                      />
                    </span>
                  </div>
                </div>

                <div className="row justify-content-center mb-3">
                  <div className="col-auto">
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="userType"
                        id="adminRadio"
                        value="administrador"
                        checked={userType === "administrador"}
                        onChange={handleUserTypeChange}
                        disabled={loading}
                      />
                      <label className="form-check-label" htmlFor="adminRadio">
                        Administrador
                      </label>
                    </div>
                  </div>

                  <div className="col-auto">
                    <div className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="userType"
                        id="employeeRadio"
                        value="funcionario"
                        checked={userType === "funcionario"}
                        onChange={handleUserTypeChange}
                        disabled={loading}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="employeeRadio"
                      >
                        Funcionário
                      </label>
                    </div>
                  </div>
                </div>

                <div className="row mt-3 gap-1">
                  <button
                    type="submit"
                    className="btn primaria col-11 col-lg-5 mx-auto d-flex justify-content-center align-items-center"
                    disabled={loading}
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </button>
                </div>

                <p className="w-100 text-center mt-3">
                  Não possui conta? <Link href="/RegisterPage">Cadastrar</Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-100">
        <div className="footer-panel">{/* Footer content if needed */}</div>
      </footer>
    </div>
  );
};

export default AuthPage;
