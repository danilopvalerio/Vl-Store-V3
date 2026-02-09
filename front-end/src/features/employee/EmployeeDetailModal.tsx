"use client";

import { useState, useEffect, useRef } from "react";
import { IMaskInput } from "react-imask";
import { AxiosError } from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faIdCard,
  faBriefcase,
  faEnvelope,
  faPhone,
  faShieldHalved,
  faStore,
  faUserSlash,
  faStoreSlash,
  faCamera,
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

import api from "../../utils/api";
import { getImageUrl } from "../../utils/imageUrl";
import { extractDigitsOnly } from "../../utils/validationUtils";

// Importando os tipos
import {
  UserProfileResponse,
  UserResponse,
  UpdateUserPayload,
  UpdateProfilePayload,
  UserProfileStatus,
  ApiErrorResponse,
} from "./types/index"; // Verifique o caminho

// --- EXTENSÃO DE TIPOS LOCAIS ---
interface ExtendedUpdateProfilePayload extends Omit<
  UpdateProfilePayload,
  "status"
> {
  tipo_perfil?: string;
  status?: UserProfileStatus;
}

interface ExtendedUpdateUserPayload extends UpdateUserPayload {
  ativo?: boolean;
}

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

  // --- Estados do Formulário ---
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [cargo, setCargo] = useState("");
  const [email, setEmail] = useState("");
  const [telefone1, setTelefone1] = useState("");
  const [telefone2, setTelefone2] = useState("");
  const [tipoPerfil, setTipoPerfil] = useState("");

  // Foto de perfil
  const [fotoAtual, setFotoAtual] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Estados de Controle ---
  const [profileStatus, setProfileStatus] =
    useState<UserProfileStatus>("ACTIVE");
  const [userGlobalActive, setUserGlobalActive] = useState(true);

  // --- Permissões ---
  const [blockExclusion, setBlockExclusion] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // 1. Identificar Usuário Logado
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const currentUser = JSON.parse(storedUser);
      const role = currentUser.role ? currentUser.role.toUpperCase() : "";
      setIsAdmin(role.includes("ADMIN"));
    }
  }, []);

  // 2. Carregar Dados
  useEffect(() => {
    const loadData = async () => {
      try {
        const profRes = await api.get<UserProfileResponse>(
          `/profiles/${profileId}`,
        );
        const profile = profRes.data;

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const currentUser = JSON.parse(storedUser);
          if (currentUser.id === profile.user_id) {
            setBlockExclusion(true);
          }
        }
        console.log(profile);
        setNome(profile.nome);
        setCpf(profile.cpf_cnpj || "");
        setCargo(profile.cargo);
        setTipoPerfil(profile.tipo_perfil || "FUNCIONARIO");
        setProfileStatus(profile.status);
        setUserId(profile.user_id);
        setFotoAtual(profile.foto_url || null);

        if (profile.user_id) {
          const userRes = await api.get<UserResponse>(
            `/users/${profile.user_id}`,
          );
          const userData = userRes.data;

          setEmail(userData.email);

          const fullUserData = userData as UserResponse & { ativo?: boolean };
          setUserGlobalActive(fullUserData.ativo !== false);

          if (Array.isArray(userData.telefones)) {
            setTelefone1(userData.telefones[0] || "");
            setTelefone2(userData.telefones[1] || "");
          }
        }
      } catch (err) {
        console.error(err);
        const axiosError = err as AxiosError<ApiErrorResponse>;
        const msg =
          axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          "Erro ao carregar os dados.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    if (profileId) loadData();
  }, [profileId]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // --- Update ---
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const profilePayload: ExtendedUpdateProfilePayload = {
        nome,
        cpf: extractDigitsOnly(cpf),
        cargo,
        status: profileStatus,
        tipo_perfil: tipoPerfil,
      };

      await api.patch(`/profiles/${profileId}`, profilePayload);

      // Upload de foto se houver nova foto selecionada
      if (fotoFile) {
        const formData = new FormData();
        formData.append("foto", fotoFile);

        await api.post(`/profiles/${profileId}/photo`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      if (userId) {
        const telefonesParaEnviar = [telefone1, telefone2]
          .map((t) => extractDigitsOnly(t))
          .filter((t) => t.length > 0);

        const userPayload: ExtendedUpdateUserPayload = {
          email: email.toLowerCase(),
          telefones: telefonesParaEnviar,
          ativo: userGlobalActive,
        };

        await api.patch(`/users/${userId}`, userPayload);
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

  // --- 1. Excluir Perfil (Apenas desta Loja) ---
  const handleDeleteProfile = async () => {
    if (!isAdmin || blockExclusion) return;
    if (
      !confirm(
        "Tem certeza? Isso removerá o funcionário DESTA LOJA, mas o login dele continuará existindo no sistema.",
      )
    )
      return;

    setSaving(true);
    try {
      // Rota para deletar profile: DELETE /profiles/:id
      await api.delete(`/profiles/${profileId}`);
      onSuccess();
    } catch (err) {
      console.error(err);
      setError("Erro ao excluir perfil da loja.");
      setSaving(false);
    }
  };

  // --- 2. Excluir Usuário (Login Global) ---
  const handleDeleteUser = async () => {
    if (!isAdmin || blockExclusion) return;
    if (
      !confirm(
        "ATENÇÃO CRÍTICA: Isso apagará a CONTA DE LOGIN (email/senha) permanentemente. O usuário perderá acesso a TODAS as lojas. Tem certeza absoluta?",
      )
    )
      return;

    setSaving(true);
    try {
      if (userId) {
        // Rota para deletar user: DELETE /users/:id
        await api.delete(`/users/${userId}`);
        onSuccess();
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao excluir usuário global.");
      setSaving(false);
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
        style={{ maxWidth: "700px" }} // Aumentado para caber os botões
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

            {/* FOTO DE PERFIL */}
            <div className="d-flex justify-content-center mb-4">
              <div className="position-relative">
                <div
                  className="rounded-circle border border-3 border-secondary overflow-hidden bg-light d-flex align-items-center justify-content-center"
                  style={{ width: 120, height: 120 }}
                >
                  {fotoPreview ? (
                    <Image
                      src={fotoPreview}
                      alt="Preview"
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="120px"
                    />
                  ) : fotoAtual ? (
                    <Image
                      src={getImageUrl(fotoAtual) || ""}
                      alt="Foto atual"
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="120px"
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={faUser}
                      className="text-secondary text-opacity-25"
                      size="3x"
                    />
                  )}
                </div>
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary rounded-circle position-absolute bottom-0 end-0 shadow"
                      style={{ width: 36, height: 36 }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FontAwesomeIcon icon={faCamera} />
                    </button>
                    {(fotoPreview || fotoAtual) && (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger rounded-circle position-absolute top-0 end-0"
                        style={{ width: 28, height: 28, fontSize: "0.7rem" }}
                        onClick={handleRemoveFoto}
                      >
                        ×
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="d-none"
                      onChange={handleFotoChange}
                    />
                  </>
                )}
              </div>
            </div>

            <form onSubmit={handleUpdate} className="row g-3">
              {/* --- DADOS GERAIS --- */}
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
                    type="email"
                    className="p-2 ps-5 w-100 form-control-underline"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={!isAdmin}
                  />
                </div>
              </div>

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

              {/* CAMPOS RESTRITOS */}
              {isAdmin && (
                <>
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
                          <option value="SUPER_ADMIN">Super Admin</option>
                        )}
                        <option value="ADMIN">Admin</option>
                        <option value="GERENTE">Gerente</option>
                        <option value="FUNCIONARIO">Funcionário</option>
                      </select>
                    </div>
                  </div>

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
                        value={telefone1}
                        onAccept={(val: string) => setTelefone1(val)}
                      />
                    </div>
                  </div>

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
                        value={telefone2}
                        onAccept={(val: string) => setTelefone2(val)}
                      />
                    </div>
                  </div>

                  {/* CONTROLE DE ACESSO E STATUS */}
                  <div className="col-12 mt-4 pt-3 border-top">
                    <h6 className="fw-bold text-secondary mb-3">
                      Controle de Acesso e Status
                    </h6>
                  </div>

                  {/* Status na Loja */}
                  <div className="col-md-6">
                    <label className="form-label small text-muted fw-bold">
                      Status na Loja
                    </label>
                    <div className="position-relative">
                      <FontAwesomeIcon
                        icon={faStore}
                        className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
                      />
                      <select
                        className="p-2 ps-5 w-100 form-control-underline"
                        value={profileStatus}
                        onChange={(e) =>
                          setProfileStatus(e.target.value as UserProfileStatus)
                        }
                        disabled={blockExclusion}
                      >
                        <option value="ACTIVE">Ativo</option>
                        <option value="INACTIVE">Inativo (Demitido)</option>
                        <option value="BLOCKED">Bloqueado</option>
                        <option value="PENDING">Pendente</option>
                      </select>
                    </div>
                    <div
                      className="form-text small mt-1"
                      style={{ fontSize: "0.75rem" }}
                    >
                      Define se o funcionário trabalha nesta loja.
                    </div>
                  </div>

                  {/* Login Global */}
                  <div className="col-md-6 d-flex flex-column justify-content-center">
                    <label className="form-label small text-muted fw-bold mb-2">
                      Acesso ao Sistema (Login)
                    </label>

                    <div
                      className={`form-check form-switch d-flex align-items-center button-white-grey-border px-3 py-2 rounded-pill ${
                        blockExclusion ? "opacity-50" : ""
                      }`}
                    >
                      <input
                        className="form-check-input me-3 ms-0 mt-0"
                        style={{
                          cursor: "pointer",
                          width: "2.5em",
                          height: "1.25em",
                        }}
                        type="checkbox"
                        checked={userGlobalActive}
                        onChange={(e) => setUserGlobalActive(e.target.checked)}
                        disabled={blockExclusion}
                      />
                      <div>
                        <span
                          className={`fw-bold small ${
                            userGlobalActive ? "text-success" : "text-danger"
                          }`}
                        >
                          {userGlobalActive
                            ? "LOGIN LIBERADO"
                            : "LOGIN BLOQUEADO"}
                        </span>
                      </div>
                    </div>
                    <div
                      className="form-text small mt-1"
                      style={{ fontSize: "0.75rem" }}
                    >
                      Bloqueia acesso do email em todas as lojas.
                    </div>
                  </div>
                </>
              )}

              {/* RODAPÉ COM AÇÕES */}
              <div className="col-12 mt-4 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center">
                  {/* ÁREA DE PERIGO (BOTÕES DE EXCLUSÃO) */}
                  <div className="d-flex gap-2">
                    {isAdmin && !blockExclusion && (
                      <>
                        {/* 1. EXCLUIR PERFIL (LOJA) */}
                        <button
                          type="button"
                          className="btn btn-outline-warning border-0 d-flex align-items-center px-2 text-dark"
                          onClick={handleDeleteProfile}
                          disabled={saving}
                          title="Remove o funcionário apenas desta loja"
                        >
                          <FontAwesomeIcon
                            icon={faStoreSlash}
                            className="me-2"
                          />
                          <span className="small fw-bold">Excluir da Loja</span>
                        </button>

                        {/* 2. EXCLUIR USUÁRIO (GLOBAL) */}
                        <button
                          type="button"
                          className="btn btn-outline-danger border-0 d-flex align-items-center px-2"
                          onClick={handleDeleteUser}
                          disabled={saving}
                          title="Apaga a conta e o login do sistema inteiro"
                        >
                          <FontAwesomeIcon
                            icon={faUserSlash}
                            className="me-2"
                          />
                          <span className="small fw-bold">Excluir Conta</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* BOTÃO SALVAR (LADO DIREITO) */}
                  <button
                    type="submit"
                    className="button-dark-grey px-5 py-2 rounded-pill ms-auto"
                    disabled={saving || !isAdmin}
                  >
                    {saving ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailModal;
