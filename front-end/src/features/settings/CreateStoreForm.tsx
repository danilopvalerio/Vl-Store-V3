"use client";

import { useState, useEffect } from "react";
import { IMaskInput } from "react-imask";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faStore, faIdCard } from "@fortawesome/free-solid-svg-icons";
import { AxiosError } from "axios";

import api from "../../utils/api";
import { extractDigitsOnly } from "../../utils/validationUtils";
import { CreateLojaPayload, Loja } from "./types";

const CreateStoreForm = () => {
  const [loading, setLoading] = useState(false);

  const [nome, setNome] = useState("");
  const [cnpjCpf, setCnpjCpf] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Novo estado para guardar o nome da loja atual
  const [currentStoreName, setCurrentStoreName] = useState("");

  // Busca o nome da loja atual para sugerir no placeholder
  useEffect(() => {
    const fetchCurrentStore = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;

        const { lojaId } = JSON.parse(storedUser);

        // Busca apenas para pegar o nome
        const { data } = await api.get<Loja>(`/lojas/${lojaId}`);
        setCurrentStoreName(data.nome);
      } catch (error) {
        // Silencioso: se falhar, apenas não mostra o placeholder personalizado
        console.error("Erro ao buscar nome da loja atual", error);
      }
    };

    fetchCurrentStore();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ type: "", text: "" });

    try {
      const payload: CreateLojaPayload = {
        nome,
        cnpj_cpf: extractDigitsOnly(cnpjCpf),
      };

      await api.post("/lojas", payload);

      setMsg({
        type: "success",
        text: "Nova loja criada com sucesso! Atualize a página para alternar.",
      });

      setNome("");
      setCnpjCpf("");

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      const error = err as AxiosError<{ message: string; error: string }>;
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Erro ao criar loja.";
      setMsg({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Lógica do Placeholder Dinâmico
  const placeholderName = currentStoreName
    ? `${currentStoreName} - Filial 2`
    : "Ex: Minha Loja - Filial Centro";

  return (
    <div className="bg-gradient-vl border rounded-4 shadow-sm p-4 text-white">
      <h5 className="fw-bold mb-3 border-bottom border-white pb-2 border-opacity-25">
        Expandir Negócio
      </h5>
      <p className="small opacity-75 mb-4">
        Crie uma nova loja para gerenciar separadamente. Seus dados de perfil
        atuais serão copiados automaticamente para a nova unidade.
      </p>

      {msg.text && (
        <div
          className={`alert ${
            msg.type === "success" ? "alert-success" : "alert-danger"
          } text-dark`}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleCreate} className="row g-3">
        <div className="col-12">
          <label className="form-label small fw-bold">Nome da Nova Loja</label>
          <div className="position-relative text-dark">
            <FontAwesomeIcon
              icon={faStore}
              className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
            />
            <input
              type="text"
              className="form-control rounded-pill ps-5 py-2 border-0"
              placeholder={placeholderName} // Placeholder dinâmico aqui
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="col-12">
          <label className="form-label small fw-bold">
            CNPJ ou CPF da Loja
          </label>
          <div className="position-relative text-dark">
            <FontAwesomeIcon
              icon={faIdCard}
              className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"
            />
            <IMaskInput
              mask={[
                { mask: "000.000.000-00" },
                { mask: "00.000.000/0000-00" },
              ]}
              className="form-control rounded-pill ps-5 py-2 border-0"
              placeholder="Documento"
              value={cnpjCpf}
              onAccept={(val: string) => setCnpjCpf(val)}
              required
            />
          </div>
        </div>

        <div className="col-12 mt-4 d-grid">
          <button
            type="submit"
            className="btn btn-light rounded-pill fw-bold shadow-sm py-2"
            disabled={loading}
          >
            {loading ? (
              "Criando..."
            ) : (
              <>
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Criar Nova Loja
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateStoreForm;
