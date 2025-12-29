"use client";

import { useState, useEffect } from "react";
import { IMaskInput } from "react-imask";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faLock,
  faIdCard,
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import { AxiosError } from "axios";

// Ajuste os caminhos conforme sua estrutura
import api from "../../utils/api";
import { extractDigitsOnly } from "../../utils/validationUtils";
import {
  UserAccount,
  UserProfile,
  UpdateUserAccountPayload,
  UpdateUserProfilePayload,
} from "./types";

const UserSettingsForm = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // IDs para Requests
  const [userId, setUserId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Estados do Form
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState(""); // Opcional

  const [msg, setMsg] = useState({ type: "", text: "" });

  // Carregar dados
  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;

        // CORREÇÃO: Removido 'lojaId' pois não estava sendo usado na busca abaixo
        const { id: uId } = JSON.parse(storedUser);
        setUserId(uId);

        // 1. Buscar Profile
        const profileRes = await api.get<UserProfile>(`/profiles/user/${uId}`);

        if (profileRes.data) {
          setProfileId(profileRes.data.id_user_profile);
          setNome(profileRes.data.nome);
          setCpf(profileRes.data.cpf_cnpj || "");
        }

        // 2. Buscar Dados da Conta (User)
        const userRes = await api.get<UserAccount>(`/users/${uId}`);
        setEmail(userRes.data.email);
      } catch (error) {
        console.error("Erro ao buscar dados do usuário", error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !profileId) return;

    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      // 1. Atualizar Tabela User (Email e Senha)
      const userPayload: UpdateUserAccountPayload = { email };
      if (senha.trim().length > 0) {
        userPayload.senha = senha;
      }
      await api.patch(`/users/${userId}`, userPayload);

      // 2. Atualizar Tabela Profile (Nome e CPF)
      const profilePayload: UpdateUserProfilePayload = {
        nome,
        cpf: extractDigitsOnly(cpf),
      };
      await api.patch(`/profiles/${profileId}`, profilePayload);

      setMsg({
        type: "success",
        text: "Seus dados foram atualizados com sucesso!",
      });
      setSenha(""); // Limpa o campo de senha após salvar por segurança
    } catch (err) {
      const error = err as AxiosError<{ message: string; error: string }>;
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Erro ao atualizar dados.";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-secondary" />
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-4 shadow-sm p-4 mb-4">
      <h5 className="fw-bold text-secondary mb-3 border-bottom pb-2">
        <FontAwesomeIcon icon={faUser} className="me-2" />
        Meus Dados Pessoais & Acesso
      </h5>

      {msg.text && (
        <div
          className={`alert ${
            msg.type === "success" ? "alert-success" : "alert-danger"
          }`}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleUpdate} className="row g-3">
        {/* Nome (Profile) */}
        <div className="col-md-6">
          <label className="form-label small text-muted fw-bold">
            Seu Nome
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
            />
          </div>
        </div>

        {/* CPF (Profile) */}
        <div className="col-md-6">
          <label className="form-label small text-muted fw-bold">Seu CPF</label>
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

        {/* Email (User) */}
        <div className="col-md-6">
          <label className="form-label small text-muted fw-bold">
            E-mail de Acesso
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
            />
          </div>
        </div>

        {/* Senha (User) */}
        <div className="col-md-6">
          <label className="form-label small text-muted fw-bold">
            Nova Senha <span className="fw-normal text-muted">(Opcional)</span>
          </label>
          <div className="position-relative">
            <FontAwesomeIcon
              icon={faLock}
              className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
            />
            <input
              type="password"
              className="p-2 ps-5 w-100 form-control-underline"
              placeholder="Alterar senha..."
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="col-12 text-end mt-4">
          <button
            type="submit"
            className="button-dark-grey px-4 py-2 rounded-pill"
            disabled={loading}
          >
            {loading ? (
              "Salvando..."
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} className="me-2" />
                Salvar Meus Dados
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserSettingsForm;
