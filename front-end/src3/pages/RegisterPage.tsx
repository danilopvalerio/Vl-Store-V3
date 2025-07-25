import React, { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { IMaskInput } from "react-imask";
import Link from "next/link";
import Image from "next/image"; // 1. CORREÇÃO: Importado o componente Image
import "../../public/css/login.css"; // Importação do CSS específico

import { StoreRegistration as StoreRegistrationData } from "../domain/interfaces/store-registration-interface";
import {
  isValidEmail,
  isValidCpfCnpj,
  isValidPassword,
  extractDigitsOnly,
  convertToISODate,
} from "../utils/validationUtils";

const StoreRegistration: React.FC = () => {
  const router = useRouter();

  const [storeName, setStoreName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [telephone, setTelephone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const pushInitialPage = () => {
    router.push("/initialPage");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (
      !storeName ||
      !password ||
      !email ||
      !cpfCnpj ||
      !birthDate ||
      !telephone
    ) {
      setError("Todos os campos são obrigatórios.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Formato de e-mail inválido.");
      return;
    }

    if (!isValidCpfCnpj(cpfCnpj)) {
      setError(
        "CPF/CNPJ inválido. Deve conter 11 dígitos para CPF ou 14 para CNPJ."
      );
      return;
    }

    if (!isValidPassword(password)) {
      setError(
        "A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma letra minúscula, um número e um caractere especial."
      );
      return;
    }

    const storeData: StoreRegistrationData = {
      nome: storeName,
      senha: password,
      email: email.toLowerCase(),
      cpf_cnpj_proprietario_loja: extractDigitsOnly(cpfCnpj),
      data_nasc_proprietario: new Date(
        convertToISODate(birthDate)
      ).toISOString(),
      telefone: extractDigitsOnly(telephone),
    };

    try {
      setLoading(true);
      await axios.post("https://vl-store-v2.onrender.com/api/lojas", storeData);

      setSuccess(true);
      setLoading(false);

      setTimeout(() => {
        router.push("/initialPage");
      }, 2000);
    } catch (error) {
      setLoading(false);

      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 400) {
          setError(
            `Dados inválidos. Verifique as informações fornecidas.\n ${error.response.data.message}`
          );
        } else if (error.response.status === 409) {
          setError("E-mail ou CPF/CNPJ já cadastrado.");
        } else {
          setError(
            `Erro no cadastro: ${
              error.response.data.message || "Tente novamente mais tarde."
            }`
          );
        }
      } else {
        setError("Erro de conexão. Verifique sua internet e tente novamente.");
      }
    }
  };

  return (
    <div className="d-flex justify-content-between flex-column min-vh-100">
      <header className="w-100">
        <div className="header-panel">
          {/* 2. CORREÇÃO: Tag <img> substituída por <Image /> com width e height */}
          <Image
            src="/vl-store-logo-white.svg"
            alt="Logo"
            width={180} // Defina a largura real da sua logo
            height={40} // Defina a altura real da sua logo
            className="img logo"
            onClick={pushInitialPage}
            style={{ cursor: "pointer" }}
          />
        </div>
      </header>

      <div className="mx-auto login-register-block fine-transparent-border white-light d-flex justify-content-center align-items-center overflow-hidden w-75">
        <div className="row w-100 shadow overflow-hidden">
          {/* Painel de Boas-Vindas */}
          <div className="col-md-6 text-white d-flex flex-column justify-content-center align-items-center text-center p-4 quartenary">
            <h4 className="m-3">Bem-vindo!</h4>
            <p className="w-75">
              Já possui conta? <Link href="/loginPage">Entrar</Link>
            </p>
          </div>

          {/* Formulário de Registro */}
          <div className="col-md-6 p-4 terciary">
            <h3 className="text-center mb-4">Cadastro</h3>

            {success && (
              <div className="alert alert-success">
                Loja cadastrada com sucesso! Redirecionando para o login...
              </div>
            )}

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleRegister}>
              <div className="input-block row mb-2 align-items-center mb-3">
                <div className="col-12 w-100">
                  <input
                    type="text"
                    className="form-control input-form"
                    placeholder="Digite o nome da sua loja"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="input-block row mb-2 align-items-center mb-3">
                <div className="col-12 w-100">
                  <input
                    type="email"
                    className="form-control input-form"
                    placeholder="Digite o seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="input-block row mb-2 align-items-center mb-3">
                <div className="col-12 w-100">
                  <IMaskInput
                    mask={[
                      { mask: "000.000.000-00" },
                      { mask: "00.000.000/0000-00" },
                    ]}
                    className="form-control input-form"
                    placeholder="Digite o CPF ou CNPJ"
                    value={cpfCnpj}
                    onAccept={(value: string) => setCpfCnpj(value)}
                    unmask={false} // Mantém a formatação
                    definitions={{
                      "#": /[0-9]/,
                    }}
                    overwrite
                    lazy={false} // Mostra a máscara imediatamente
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="input-block row mb-2 align-items-center mb-3">
                <div className="col-12 w-100">
                  <IMaskInput
                    mask="00/00/0000"
                    className="form-control input-form"
                    placeholder="Data de nascimento"
                    value={birthDate}
                    onAccept={(value: string) => setBirthDate(value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="input-block row mb-2 align-items-center mb-3">
                <div className="col-12 w-100">
                  <IMaskInput
                    mask="(00) 00000-0000"
                    className="form-control input-form"
                    placeholder="Telefone (Ex: (11) 99999-9999)"
                    value={telephone}
                    onAccept={(value: string) => setTelephone(value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="input-block row mb-2 align-items-center mb-3">
                <div className="col-12 w-100">
                  <input
                    type="password"
                    className="form-control input-form"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="input-block row mb-2 align-items-center mb-3">
                <div className="col-12 w-100">
                  <input
                    type="password"
                    className="form-control input-form"
                    placeholder="Confirme sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="row mt-3">
                <button
                  type="submit"
                  className="btn primaria col-11 col-lg-5 mx-auto d-flex justify-content-center align-items-center"
                  disabled={loading}
                >
                  {loading ? "Cadastrando..." : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <footer className="w-100">
        <div className="footer-panel">
          {/* <button
            className="btn primaria footerButton col-3 mx-auto d-flex justify-content-center align-items-center"
            onClick={pushInitialPage}
          >
            Entrar como visitante
          </button> */}
        </div>
      </footer>
    </div>
  );
};

export default StoreRegistration;
