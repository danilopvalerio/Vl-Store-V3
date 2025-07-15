"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { IMaskInput } from "react-imask";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faEnvelope,
  faIdCard,
  faBirthdayCake,
  faPhone,
  faLock,
} from "@fortawesome/free-solid-svg-icons";

import {
  isValidEmail,
  isValidCpfCnpj,
  isValidPassword,
  extractDigitsOnly,
  convertToISODate,
} from "./../../utils/validationUtils";

export default function RegisterForm() {
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

    const storeData = {
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
        router.push("/loginPage");
      }, 2000);
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 409) {
          setError("E-mail ou CPF/CNPJ já cadastrado.");
        } else {
          setError(
            `Erro no cadastro: ${
              error.response.data.message || "Tente novamente."
            }`
          );
        }
      } else {
        setError("Erro de conexão. Verifique sua internet e tente novamente.");
      }
    }
  };

  return (
    <div className="mx-auto mt-5 w-75 rounded-5 mb-5 dark-shadow d-flex justify-content-center align-items-center overflow-hidden">
      <div className="row w-100 shadow overflow-hidden">
        <div className="col-md-6 terciary d-flex flex-column justify-content-center align-items-center text-center p-4 quartenary">
          <h4 className="m-3">Bem-vindo!</h4>
          <p className="w-75">
            Já possui conta?{" "}
            <Link className="royal-blue-text" href="/login">
              Entrar
            </Link>
          </p>
        </div>

        <div className="col-md-6 secondary">
          <h3 className="text-center mb-4 mt-3 royal-blue-text">Cadastro</h3>

          {success && (
            <div className="alert alert-success">
              Loja cadastrada com sucesso! Redirecionando...
            </div>
          )}
          {error && <div className="alert alert-danger">{error}</div>}

          <form className="row p-4" onSubmit={handleRegister}>
            {/* --- Campo Nome da Loja --- */}
            <div className="col-12 mb-3">
              <label className="mb-1">Nome:</label>
              <div className="position-relative">
                <FontAwesomeIcon
                  icon={faStore}
                  className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                />
                <input
                  type="text"
                  className="p-2 ps-5 border w-100"
                  placeholder="Digite o nome da sua loja"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* --- Campo E-mail --- */}
            <div className="col-12 col-md-6 mb-3">
              <label className="mb-1">E-mail:</label>
              <div className="position-relative">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                />
                <input
                  type="email"
                  className="p-2 ps-5 border w-100"
                  placeholder="Digite o seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* --- Campo CPF/CNPJ --- */}
            <div className="col-12 col-md-6 mb-3">
              <label className="mb-1">CPF ou CNPJ:</label>
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
                  className="p-2 ps-5 border w-100"
                  placeholder="Digite o CPF ou CNPJ"
                  value={cpfCnpj}
                  onAccept={(value: string) => setCpfCnpj(value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* --- Campo Data de Nascimento --- */}
            <div className="col-12 col-md-6 mb-3">
              <label className="mb-1">Data de Nascimento:</label>
              <div className="position-relative">
                <FontAwesomeIcon
                  icon={faBirthdayCake}
                  className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                />
                <IMaskInput
                  mask="00/00/0000"
                  className="p-2 ps-5 border w-100"
                  placeholder="DD/MM/AAAA"
                  value={birthDate}
                  onAccept={(value: string) => setBirthDate(value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* --- Campo Telefone --- */}
            <div className="col-12 col-md-6 mb-3">
              <label className="mb-1">Telefone:</label>
              <div className="position-relative">
                <FontAwesomeIcon
                  icon={faPhone}
                  className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                />
                <IMaskInput
                  mask="(00) 00000-0000"
                  className="p-2 ps-5 border w-100"
                  placeholder="(99) 99999-9999"
                  value={telephone}
                  onAccept={(value: string) => setTelephone(value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* --- Campo Senha --- */}
            <div className="col-12 col-md-6 mb-3">
              <label className="mb-1">Senha:</label>
              <div className="position-relative">
                <FontAwesomeIcon
                  icon={faLock}
                  className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                />
                <input
                  type="password"
                  className="p-2 ps-5 border w-100"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* --- Campo Confirmar Senha --- */}
            <div className="col-12 col-md-6 mb-3">
              <label className="mb-1">Repita a Senha:</label>
              <div className="position-relative">
                <FontAwesomeIcon
                  icon={faLock}
                  className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                />
                <input
                  type="password"
                  className="p-2 ps-5 border w-100"
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* --- Botão de Envio --- */}
            <div className="col-12 mt-3">
              <button
                type="submit"
                className="btn primaria w-100"
                disabled={loading}
              >
                {loading ? "Cadastrando..." : "Cadastrar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
