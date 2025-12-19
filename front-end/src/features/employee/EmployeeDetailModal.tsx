"use client";

import { useState, useEffect } from "react";
import { IMaskInput } from "react-imask";
import { AxiosError } from "axios"; // Adicionado
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faIdCard,
  faBriefcase,
  faEnvelope,
  faLock,
  faPhone,
  faTrash,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

// Imports originais mantidos
import api from "../../utils/api";
import { extractDigitsOnly } from "../../utils/validationUtils";
import { UpdateUserPayload } from "./types";
import { ApiErrorResponse } from "../../types/api"; // Import do tipo de erro

interface EmployeeDetailModalProps {
  profileId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const EmployeeDetailModal = ({
  profileId,
  onClose,
  onSuccess,
}: EmployeeDetailModalProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [userId, setUserId] = useState<string | null>(null);

  // Estados do Formulário
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [cargo, setCargo] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [tipoPerfil, setTipoPerfil] = useState("");
  const [ativo, setAtivo] = useState(true);

  const [blockExclusion, setBlockExclusion] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // CARREGAR DADOS DO USUÁRIO LOGADO
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const currentUser = JSON.parse(storedUser);
      setIsAdmin(["ADMIN", "SUPER_ADMIN"].includes(currentUser.role));
    }
  }, []);

  // CARREGAR DADOS DO PERFIL
  useEffect(() => {
    const loadData = async () => {
      try {
        const profRes = await api.get(`/profiles/${profileId}`);
        const profile = profRes.data;

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const currentUser = JSON.parse(storedUser);
          if (currentUser.id === profile.user_id) {
            setBlockExclusion(true);
          }
        }

        setNome(profile.nome);
        setCpf(profile.cpf_cnpj || profile.cpf || "");
        setCargo(profile.cargo);
        setTipoPerfil(profile.tipo_perfil || "FUNCIONARIO");
        setAtivo(profile.ativo !== false);
        setUserId(profile.user_id);

        if (profile.user_id) {
          const userRes = await api.get(`/users/${profile.user_id}`);
          const userData = userRes.data;

          setEmail(userData.email);
          if (
            Array.isArray(userData.telefones) &&
            userData.telefones.length > 0
          ) {
            setTelefone(userData.telefones[0]);
          }
        }
      } catch (err) {
        console.error(err);
        const axiosError = err as AxiosError<ApiErrorResponse>;
        const msg =
          axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          "Erro ao carregar os dados dos funcionários.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    if (profileId) loadData();
  }, [profileId]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      // 1. Atualiza Perfil
      await api.patch(`/profiles/${profileId}`, {
        nome,
        cpf_cnpj: extractDigitsOnly(cpf),
        cargo,
        tipo_perfil: tipoPerfil,
        ativo: ativo,
      });

      // 2. Atualiza User (Login)
      if (userId) {
        const payload: UpdateUserPayload = {
          email: email.toLowerCase(),
          telefones: telefone ? [extractDigitsOnly(telefone)] : [],
        };

        if (novaSenha) payload.senha = novaSenha;

        await api.patch(`/users/${userId}`, payload);
      }

      setSuccessMsg("Atualizado com sucesso!");
      setTimeout(() => onSuccess(), 1500);
    } catch (err) {
      console.error(err);
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const msg =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        "Erro ao atualizar.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin || blockExclusion) return;
    if (!confirm("Tem certeza? Essa ação excluirá login e perfil.")) return;
    setSaving(true);

    try {
      if (userId) {
        await api.delete(`/users/${userId}`);
        onSuccess();
      }
    } catch (err) {
      console.error(err);
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const msg =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        "Erro ao excluir.";
      setError(msg);
    }
  };

  if (loading) {
    return (
      <div
        className="modal-backdrop show d-flex justify-content-center align-items-center"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="spinner-border text-white"></div>
      </div>
    );
  }

  return (
    <div
      className="modal-backdrop d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.48)" }}
      onClick={onClose}
    >
      <div
        className="modal-dialog detail-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow">
          {/* Header */}
          <div className="modal-header border-bottom-0 p-4 pb-0 d-flex justify-content-between align-items-center">
            <h5 className="modal-title fw-bold text-secondary">
              Editar Funcionário
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body p-4 pt-2">
            {error && <div className="alert alert-danger">{error}</div>}
            {successMsg && (
              <div className="alert alert-success">{successMsg}</div>
            )}

            <form onSubmit={handleUpdate} className="row g-3">
              {/* NOME */}
              <div className="col-12">
                <label className="form-label small text-muted fw-bold">
                  Nome
                </label>
                <div className="position-relative">
                  <FontAwesomeIcon
                    icon={faUser}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  />
                  <input
                    className="p-2 ps-5 w-100 form-control-underline"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div className="col-md-12">
                <label className="form-label small text-muted fw-bold">
                  Email
                </label>
                <div className="position-relative">
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                  />
                  <input
                    className="p-2 ps-5 w-100 form-control-underline"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={!isAdmin}
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
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    required
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              {/* CAMPOS RESTRITOS AO ADMIN */}
              {isAdmin && (
                <>
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
                        disabled={
                          blockExclusion || tipoPerfil === "SUPER_ADMIN"
                        }
                      >
                        {tipoPerfil === "SUPER_ADMIN" && (
                          <option value="SUPER_ADMIN">
                            Super Administrador
                          </option>
                        )}
                        <option value="ADMIN">Admin</option>
                        <option value="GERENTE">Gerente</option>
                        <option value="FUNCIONARIO">Funcionário</option>
                      </select>
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
                        value={cpf}
                        onAccept={(val: string) => setCpf(val)}
                        required
                      />
                    </div>
                  </div>

                  {/* TELEFONE */}
                  <div className="col-md-6">
                    <label className="form-label small text-muted fw-bold">
                      Telefone
                    </label>
                    <div className="position-relative">
                      <FontAwesomeIcon
                        icon={faPhone}
                        className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                      />
                      <IMaskInput
                        mask="(00) 00000-0000"
                        className="p-2 ps-5 w-100 form-control-underline"
                        value={telefone}
                        onAccept={(val: string) => setTelefone(val)}
                      />
                    </div>
                  </div>

                  {/* SENHA */}
                  <div className="col-12">
                    <label className="form-label small text-muted fw-bold">
                      Nova Senha
                    </label>
                    <div className="position-relative">
                      <FontAwesomeIcon
                        icon={faLock}
                        className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                      />
                      <input
                        type="text"
                        className="p-2 ps-5 w-100 form-control-underline"
                        placeholder="Preencha apenas para alterar"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* RODAPÉ COM BOTÕES */}
              <div className="col-12 mt-4 row border-top pt-3 ">
                {/* --- SWITCH DE STATUS (ATIVO/INATIVO) --- */}
                {isAdmin && !blockExclusion && (
                  <div className="col-12 d-flex justify-content-between align-items-center mb-2">
                    {/* BOTÃO EXCLUIR */}
                    {isAdmin && !blockExclusion && (
                      <button
                        type="button"
                        className="d-flex justify-content-center align-items-center button-white-grey-border px-4 py-2 rounded-pill"
                        onClick={handleDelete}
                        disabled={saving}
                      >
                        <FontAwesomeIcon icon={faTrash} className="me-2" />{" "}
                        Excluir
                      </button>
                    )}

                    <div className="form-check form-switch d-flex justify-content-center align-items-center button-white-grey-border px-4 py-2 rounded-pill">
                      <input
                        className="form-check-input me-2 ms-0 mt-0"
                        type="checkbox"
                        checked={ativo}
                        onChange={(e) => setAtivo(e.target.checked)}
                        disabled={blockExclusion}
                      />
                      <label className="form-check-label fw-bold small">
                        {ativo ? "ATIVO" : "INATIVO"}
                      </label>
                    </div>
                  </div>
                )}

                {/* ESPAÇADOR SE NÃO TIVER BOTÃO EXCLUIR */}
                {(!isAdmin || blockExclusion) && <div></div>}

                {/* BOTÃO SALVAR */}
                <button
                  type="submit"
                  className="button-dark-grey px-5 py-2 rounded-pill"
                  disabled={saving || !isAdmin}
                >
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailModal;
