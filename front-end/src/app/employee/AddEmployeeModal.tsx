"use client";
import { useState } from "react";
import { IMaskInput } from "react-imask";
import { AxiosError } from "axios"; // 1. Importar AxiosError
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

interface AddEmployeeProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Interface para definir o formato esperado do erro da API
interface ApiErrorResponse {
  error: string;
}

const AddEmployeeModal = ({ onClose, onSuccess }: AddEmployeeProps) => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [cargo, setCargo] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipoPerfil, setTipoPerfil] = useState("FUNCIONARIO");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userProfileData = localStorage.getItem("user");
      if (!userProfileData) throw new Error("Sessão inválida.");
      const currentUser = JSON.parse(userProfileData);

      // 1. USER
      const userPayload = {
        email: email.toLowerCase(),
        senha: senha,
        telefones: telefone ? [extractDigitsOnly(telefone)] : [],
      };

      const userRes = await api.post("/users", userPayload);
      const userId = userRes.data.user_id;

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
    } catch (error) {
      console.error("Erro ao criar funcionário:", error);

      // --- CORREÇÃO: Remoção do any e uso de Type Guard ---
      if (error instanceof AxiosError) {
        // O TS agora sabe que 'error' tem a propriedade 'response'
        // Fazemos o cast de data para a interface esperada
        const errorData = error.response?.data as ApiErrorResponse;

        if (errorData?.error) {
          setError(errorData.error);
        } else {
          setError("Erro ao criar funcionário.");
        }
      } else {
        // Erros que não são do Axios (ex: localStorage falhando)
        setError("Erro inesperado ao criar funcionário.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.48)" }}
    >
      <div
        className="modal-dialog bg-white w-100"
        style={{ maxWidth: "600px" }}
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
                    type="password"
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

              {/* CELULAR */}
              <div className="col-md-6">
                <label className="form-label small text-muted fw-bold">
                  Celular
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
                    value={telefone}
                    onAccept={(val: string) => setTelefone(val)}
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
              <div className="col-md-6">
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
