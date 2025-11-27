"use client";
import { useState, useEffect } from "react";
import { IMaskInput } from "react-imask";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faIdCard,
  faBriefcase,
  faEnvelope,
  faLock,
  faPhone,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../utils/api";
import { extractDigitsOnly } from "../../utils/validationUtils";
import { UpdateUserPayload } from "./types";

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

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [cargo, setCargo] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [novaSenha, setNovaSenha] = useState("");

  const [blockExclusion, setBlockExclusion] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // CARREGAR DADOS DO USUÁRIO LOGADO
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const currentUser = JSON.parse(storedUser);
      setIsAdmin(currentUser.role === "ADMIN");
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

          // Impedir que o admin exclua a si mesmo
          if (currentUser.id === profile.user_id) {
            setBlockExclusion(true);
          }
        }

        setNome(profile.nome);
        setCpf(profile.cpf_cnpj || profile.cpf || "");
        setCargo(profile.cargo);
        setUserId(profile.user_id);

        // Buscar dados do usuário (email, telefone)
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
        setError("Erro ao carregar dados do funcionário.");
      } finally {
        setLoading(false);
      }
    };

    if (profileId) loadData();
  }, [profileId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return; // funcionários não editam

    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      // Atualiza Perfil
      await api.patch(`/profiles/${profileId}`, {
        nome,
        cpf_cnpj: extractDigitsOnly(cpf),
        cargo,
      });

      // Atualiza User
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
      setError("Erro ao salvar.");
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
        console.log("Usuário e perfil excluídos com sucesso.");
      }
    } catch (err) {
      console.error(err);
      console.log("Erro ao excluir usuário e perfil.");
      setError("Erro ao excluir.");
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
    >
      <div
        className="modal-dialog bg-white w-100"
        style={{ maxWidth: "600px" }}
      >
        <div className="modal-content  border-0 shadow">
          <div className="modal-header bg-white border-bottom-0 p-4 pb-0 d-flex justify-content-between align-items-center">
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
              {/* NOME - SEMPRE EXIBE */}
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

              {/* EMAIL - SEMPRE EXIBE */}
              <div className="col-md-6">
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

              {/* CARGO - SEMPRE EXIBE */}
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

              {/* CAMPOS QUE APENAS ADMIN VÊ */}
              {isAdmin && (
                <>
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
                        placeholder="Preencha para alterar"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* BOTÕES */}
              <div className="col-12 mt-4 d-flex justify-content-between align-items-center border-top pt-3">
                {/* EXCLUIR — APENAS ADMIN E NÃO PODE SE AUTO-EXCLUIR */}
                {isAdmin && !blockExclusion && (
                  <button
                    type="button"
                    className="btn btn-link text-danger text-decoration-none p-0"
                    onClick={handleDelete}
                    disabled={saving}
                  >
                    <FontAwesomeIcon icon={faTrash} className="me-2" /> Excluir
                  </button>
                )}

                {/* Salvar */}
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
