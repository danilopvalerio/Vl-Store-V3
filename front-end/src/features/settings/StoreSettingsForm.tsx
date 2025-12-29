"use client";

import { useState, useEffect } from "react";
import { IMaskInput } from "react-imask";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore, faIdCard, faSave } from "@fortawesome/free-solid-svg-icons";
import { AxiosError } from "axios";

import api from "../../utils/api";
import { extractDigitsOnly } from "../../utils/validationUtils";
import { Loja, UpdateLojaPayload } from "./types";

const StoreSettingsForm = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [lojaId, setLojaId] = useState<string | null>(null);

  // Estados do Form
  const [nome, setNome] = useState("");
  const [cnpjCpf, setCnpjCpf] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  // 1. Carregar dados da loja atual
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;
        const currentUser = JSON.parse(storedUser);
        setLojaId(currentUser.lojaId);

        // GET /lojas/:id
        const res = await api.get<Loja>(`/lojas/${currentUser.lojaId}`);
        setNome(res.data.nome);
        setCnpjCpf(res.data.cnpj_cpf || "");
      } catch (error) {
        console.error("Erro ao buscar loja", error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchStore();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lojaId) return;

    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const payload: UpdateLojaPayload = {
        nome,
        cnpj_cpf: extractDigitsOnly(cnpjCpf),
      };

      await api.patch(`/lojas/${lojaId}`, payload);
      setMsg({
        type: "success",
        text: "Dados da loja atualizados com sucesso!",
      });
    } catch (err) {
      const error = err as AxiosError<{ message: string; error: string }>;
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Erro ao atualizar.";
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
        <FontAwesomeIcon icon={faStore} className="me-2" />
        Dados da Loja Atual
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
        {/* Nome da Loja */}
        <div className="col-md-6">
          <label className="form-label small text-muted fw-bold">
            Nome do Estabelecimento
          </label>
          <div className="position-relative">
            <FontAwesomeIcon
              icon={faStore}
              className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
            />
            <input
              type="text"
              className="p-2 ps-5 w-100 form-control-underline"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
        </div>

        {/* CNPJ/CPF */}
        <div className="col-md-6">
          <label className="form-label small text-muted fw-bold">
            CNPJ ou CPF
          </label>
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
              value={cnpjCpf}
              onAccept={(val: string) => setCnpjCpf(val)}
              required
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
                Salvar Dados da Loja
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreSettingsForm;
