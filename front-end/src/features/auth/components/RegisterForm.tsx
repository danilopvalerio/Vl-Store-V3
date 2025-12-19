"use client";

import { AxiosError } from "axios";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IMaskInput } from "react-imask";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faEnvelope,
  faIdCard,
  faPhone,
  faLock,
} from "@fortawesome/free-solid-svg-icons";

// Ajuste os caminhos conforme sua estrutura
import api from "../../../utils/api";
import { ApiErrorResponse } from "../../../types/api";
import {
  isValidEmail,
  isValidCpfCnpj,
  isValidPassword,
  extractDigitsOnly,
} from "../../../utils/validationUtils";

export default function RegisterForm() {
  const router = useRouter();

  const [storeName, setStoreName] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [cpfCnpjStore, setCpfCnpjStore] = useState("");
  const [telephone, setTelephone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // --- Validações (Mantidas iguais) ---
    if (
      !email ||
      !password ||
      !confirmPassword ||
      !userName ||
      !cpfCnpj ||
      !telephone ||
      !storeName ||
      !cpfCnpjStore
    ) {
      setError("Todos os campos são obrigatórios.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Por favor, insira um e-mail válido.");
      return;
    }

    if (!isValidCpfCnpj(cpfCnpj)) {
      setError("O CPF ou CNPJ inserido é inválido.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (!isValidPassword(password)) {
      setError(
        "A senha deve ter no mínimo 8 caracteres, com uma letra maiúscula, uma minúscula, um número e um caractere especial (@$!%*?&)."
      );
      return;
    }

    if (cpfCnpjStore) {
      if (!isValidCpfCnpj(cpfCnpjStore)) {
        setError("O CPF ou CNPJ do estabelecimento inserido é inválido.");
        return;
      }
    }

    const finalCpfCnpjStore = cpfCnpjStore
      ? extractDigitsOnly(cpfCnpjStore)
      : extractDigitsOnly(cpfCnpj);

    const storeData = {
      email: email.toLowerCase(),
      senha: password,
      nome_usuario: userName,
      cpf_usuario: extractDigitsOnly(cpfCnpj),
      telefones: [extractDigitsOnly(telephone)],
      nome_loja: storeName,
      cnpj_cpf_loja: finalCpfCnpjStore,
    };

    try {
      setLoading(true);

      const response = await api.post("/auth/register", storeData);

      if (response.status === 201) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      // --- TRATAMENTO DE ERRO ATUALIZADO ---
      const axiosError = err as AxiosError<ApiErrorResponse>;

      const errorMessage =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        "Erro de conexão. Verifique sua internet e tente novamente.";

      setError(errorMessage);
      console.error("Erro no registro:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-100 d-flex justify-content-center overflow-hidden row w-75 overflow-hidden">
      <div className="col-md-12 ">
        <h3 className="text-center mt-3 royal-blue-text">Cadastro</h3>

        {success && (
          <div className="alert alert-success">
            Loja cadastrada com sucesso! Redirecionando...
          </div>
        )}
        {error && <div className="alert alert-danger">{error}</div>}

        <form className="row w-100 mx-auto p-4" onSubmit={handleRegister}>
          {/* Nome do usuário */}
          <div className="col-12 mb-3">
            <div className="position-relative">
              <FontAwesomeIcon
                icon={faStore} // Ícone pode ser ajustado para faUser se preferir
                className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
              />
              <input
                type="text"
                className="p-2 ps-5 w-100 form-control-underline"
                placeholder="Digite o seu nome"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Nome da Loja */}
          <div className="col-12 mb-3">
            <div className="position-relative">
              <FontAwesomeIcon
                icon={faStore}
                className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
              />
              <input
                type="text"
                className="p-2 ps-5 w-100 form-control-underline"
                placeholder="Digite o nome da sua loja"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* E-mail */}
          <div className="col-12 col-lg-6 mb-3">
            <div className="position-relative">
              <FontAwesomeIcon
                icon={faEnvelope}
                className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
              />
              <input
                type="email"
                className="p-2 ps-5 w-100 form-control-underline"
                placeholder="Digite o seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Telefone */}
          <div className="col-12 col-lg-6 mb-3">
            <div className="position-relative">
              <FontAwesomeIcon
                icon={faPhone}
                className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
              />
              <IMaskInput
                mask="(00) 00000-0000"
                className="p-2 ps-5 w-100 form-control-underline"
                placeholder="(99) 99999-9999"
                value={telephone}
                onAccept={(value: string) => setTelephone(value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* CPF/CNPJ do usuário*/}
          <div className="col-12 mb-3">
            <div className="position-relative">
              <FontAwesomeIcon
                icon={faIdCard}
                className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
              />
              <IMaskInput
                mask={[
                  { mask: "000.000.000-00" },
                  { mask: "00.000.000/0000-00" },
                ]}
                className="p-2 ps-5 w-100 form-control-underline"
                placeholder="Digite o seu CPF ou CNPJ"
                value={cpfCnpj}
                onAccept={(value: string) => setCpfCnpj(value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* CPF/CNPJ do estabelecimento */}
          <div className="col-12 mb-3">
            <div className="position-relative">
              <FontAwesomeIcon
                icon={faIdCard}
                className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
              />
              <IMaskInput
                mask={[
                  { mask: "000.000.000-00" },
                  { mask: "00.000.000/0000-00" },
                ]}
                className="p-2 ps-5 w-100 form-control-underline"
                placeholder="Digite o CNPJ do seu estabelecimento"
                value={cpfCnpjStore}
                onAccept={(value: string) => setCpfCnpjStore(value)}
                disabled={loading}
                required
              />
            </div>
            <label className="w-100 mt-3 text-center mx-auto">
              Caso o estabelecimento não possua CPF ou CNPJ, repita o seu.
            </label>
          </div>

          {/* Senha */}
          <div className="col-12 col-lg-6 mb-3">
            <div className="position-relative">
              <FontAwesomeIcon
                icon={faLock}
                className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
              />
              <input
                type="password"
                className="p-2 ps-5 w-100 form-control-underline"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Confirmar Senha */}
          <div className="col-12 col-lg-6 mb-3">
            <div className="position-relative">
              <FontAwesomeIcon
                icon={faLock}
                className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
              />
              <input
                type="password"
                className="p-2 ps-5 w-100 form-control-underline"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Botão de Envio */}
          <div className="col-12 mt-3">
            <button
              type="submit"
              className="button-dark-grey  col-11 col-lg-5 mx-auto d-flex justify-content-center align-items-center w-100"
              disabled={loading}
            >
              {loading ? "Cadastrando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
