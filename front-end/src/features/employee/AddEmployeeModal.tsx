"use client";

import { useState, useEffect } from "react";
import { IMaskInput } from "react-imask";
import { AxiosError } from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faIdCard,
  faBriefcase,
  faEnvelope,
  faLock,
  faPhone,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

import api from "../../utils/api";
import { extractDigitsOnly } from "../../utils/validationUtils";
import { ApiErrorResponse } from "../../types/api";

interface AddEmployeeProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddEmployeeModal = ({ onClose, onSuccess }: AddEmployeeProps) => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [cargo, setCargo] = useState("");
  const [senha, setSenha] = useState("");

  // ALTERAÇÃO: Dois telefones
  const [telefone1, setTelefone1] = useState("");
  const [telefone2, setTelefone2] = useState("");

  const [tipoPerfil, setTipoPerfil] = useState("FUNCIONARIO");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userProfileData = localStorage.getItem("user");
      if (!userProfileData) throw new Error("Sessão inválida.");
      const currentUser = JSON.parse(userProfileData);

      // Prepara telefones
      const telefonesParaEnviar = [telefone1, telefone2]
        .map((t) => extractDigitsOnly(t))
        .filter((t) => t.length > 0);

      // 1. USER
      const userPayload = {
        email: email.toLowerCase(),
        senha: senha,
        telefones: telefonesParaEnviar,
      };

      const userRes = await api.post("/users", userPayload);
      const userId = userRes.data.user_id || userRes.data.id; // Suporte a ambos os formatos de retorno

      // 2. PROFILE
      const profilePayload = {
        user_id: userId,
        id_loja: currentUser.lojaId,
        nome: nome,
        cpf_cnpj: extractDigitsOnly(cpf),
        cargo: cargo,
        tipo_perfil: tipoPerfil,
      };

      await api.post("/profiles", profilePayload);

      onSuccess();
    } catch (err) {
      console.error("Erro ao criar funcionário:", err);

      const axiosError = err as AxiosError<ApiErrorResponse>;
      const msg =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        "Erro ao criar funcionário.";

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.48)" }}
      onClick={onClose}
    >
      <div
        className="modal-dialog detail-box"
        style={{ maxWidth: "600px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow">
          {/* HEADER */}
          <div className="modal-header bg-white border-bottom-0 p-4 pb-0 d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold text-secondary">
              Novo Funcionário
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body p-4 pt-2">
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit} className="row g-3">
              {/* NOME */}
              <div className="col-12">
                <label className="form-label small text-muted fw-bold">
                  Nome Completo
                </label>
                <div className="position-relative">
                  <FontAwesomeIcon
                    icon={faUser}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  />
                  <input
                    className="p-2 ps-5 w-100 form-control-underline"
                    placeholder="Ex: João Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div className="col-md-6">
                <label className="form-label small text-muted fw-bold">
                  E-mail
                </label>
                <div className="position-relative">
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  />
                  <input
                    type="email"
                    className="p-2 ps-5 w-100 form-control-underline"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* SENHA */}
              <div className="col-md-6">
                <label className="form-label small text-muted fw-bold">
                  Senha
                </label>
                <div className="position-relative">
                  <FontAwesomeIcon
                    icon={faLock}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  />
                  <input
                    type="text"
                    className="p-2 ps-5 w-100 form-control-underline"
                    placeholder="******"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* CPF */}
              <div className="col-md-6">
                <label className="form-label small text-muted fw-bold">
                  CPF
                </label>
                <div className="position-relative">
                  <FontAwesomeIcon
                    icon={faIdCard}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  />
                  <IMaskInput
                    mask="000.000.000-00"
                    className="p-2 ps-5 w-100 form-control-underline"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onAccept={(val: string) => setCpf(val)}
                    required
                  />
                </div>
              </div>

              {/* CARGO */}
              <div className="col-md-6">
                <label className="form-label small text-muted fw-bold">
                  Cargo
                </label>
                <div className="position-relative">
                  <FontAwesomeIcon
                    icon={faBriefcase}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  />
                  <input
                    className="p-2 ps-5 w-100 form-control-underline"
                    placeholder="Ex: Vendedor"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* TELEFONE 1 */}
              <div className="col-md-6">
                <label className="form-label small text-muted fw-bold">
                  Telefone 1
                </label>
                <div className="position-relative">
                  <FontAwesomeIcon
                    icon={faPhone}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  />
                  <IMaskInput
                    mask="(00) 00000-0000"
                    className="p-2 ps-5 w-100 form-control-underline"
                    placeholder="(99) 99999-9999"
                    value={telefone1}
                    onAccept={(val: string) => setTelefone1(val)}
                  />
                </div>
              </div>

              {/* TELEFONE 2 */}
              <div className="col-md-6">
                <label className="form-label small text-muted fw-bold">
                  Telefone 2 (Opcional)
                </label>
                <div className="position-relative">
                  <FontAwesomeIcon
                    icon={faPhone}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  />
                  <IMaskInput
                    mask="(00) 00000-0000"
                    className="p-2 ps-5 w-100 form-control-underline"
                    placeholder="(99) 99999-9999"
                    value={telefone2}
                    onAccept={(val: string) => setTelefone2(val)}
                  />
                </div>
              </div>

              {/* TIPO DE PERFIL */}
              <div className="col-md-12">
                <label className="form-label small text-muted fw-bold">
                  Tipo de Perfil
                </label>
                <div className="position-relative">
                  <FontAwesomeIcon
                    icon={faShieldHalved}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  />
                  <select
                    className="p-2 ps-5 w-100 form-control-underline"
                    value={tipoPerfil}
                    onChange={(e) => setTipoPerfil(e.target.value)}
                    required
                  >
                    <option value="FUNCIONARIO">Funcionário</option>
                    <option value="GERENTE">Gerente</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              {/* RODAPÉ */}
              <div className="col-12 mt-4 d-flex justify-content-end align-items-center border-top pt-3">
                <button
                  type="button"
                  className="btn btn-link text-secondary text-decoration-none me-3"
                  onClick={onClose}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="button-dark-grey px-5 py-2 rounded-pill"
                  disabled={loading}
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
