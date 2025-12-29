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
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

import api from "../../utils/api";
import { extractDigitsOnly } from "../../utils/validationUtils";
import { ApiErrorResponse } from "../../types/api";

interface AddExistingEmployeeProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddExistingEmployeeModal = ({
  onClose,
  onSuccess,
}: AddExistingEmployeeProps) => {
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [cargo, setCargo] = useState("");
  const [tipoPerfil, setTipoPerfil] = useState("FUNCIONARIO");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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

      const payload = {
        email: email.toLowerCase(), // backend resolve o user
        id_loja: currentUser.lojaId,
        nome,
        cpf_cnpj: extractDigitsOnly(cpf),
        cargo,
        tipo_perfil: tipoPerfil,
      };

      await api.post("/profiles/existing", payload);

      onSuccess();
    } catch (err) {
      console.error("Erro ao vincular funcionário existente:", err);

      const axiosError = err as AxiosError<ApiErrorResponse>;
      const msg =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        "Erro ao adicionar funcionário existente.";

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
              Vincular Funcionário Existente
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body p-4 pt-2">
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit} className="row g-3">
              {/* EMAIL */}
              <div className="col-12">
                <label className="form-label small text-muted fw-bold">
                  E-mail do Usuário
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

              {/* TIPO DE PERFIL */}
              <div className="col-12">
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

export default AddExistingEmployeeModal;
