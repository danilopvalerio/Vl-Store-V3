// app/employees/AddEmployeeModal.tsx
"use client";

import { useState } from "react";
import api from "../../utils/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

// --- Interfaces ---
interface AddEmployeeProps {
  onClose: () => void;
  onSaveSuccess: () => void;
}

const initialFormState = {
  cpf: "",
  nome: "",
  email: "",
  senha: "",
  cargo: "",
  dataNascimento: "",
  telefone: "",
};

const AddEmployeeModal: React.FC<AddEmployeeProps> = ({
  onClose,
  onSaveSuccess,
}) => {
  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const showMessage = (setter: Function, message: string) => {
    setter(message);
    setTimeout(() => setter(""), 4000);
  };

  const handleSave = async () => {
    if (
      !formData.cpf ||
      !formData.nome ||
      !formData.email ||
      !formData.senha ||
      !formData.dataNascimento
    ) {
      showMessage(
        setError,
        "CPF, Nome, Email, Senha e Data de Nascimento são obrigatórios."
      );
      return;
    }
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/funcionarios", formData);
      showMessage(setSuccess, "Funcionário cadastrado com sucesso!");
      onSaveSuccess();
      setTimeout(onClose, 1500);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Ocorreu um erro ao salvar.";
      showMessage(setError, errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSaveDisabled =
    !formData.cpf ||
    !formData.nome ||
    !formData.email ||
    !formData.senha ||
    isSubmitting;

  return (
    <div className="modal-content rounded-4">
      <header className="w-100 terciary p-3 d-flex justify-content-between align-items-center">
        <h4 className="m-0 w-100 text-center primary-color">
          Adicionar Novo Funcionário
        </h4>
        <button
          className="btn"
          onClick={onClose}
          aria-label="Fechar"
          disabled={isSubmitting}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </header>

      <div className="modal-scroll terciary p-4">
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label ps-2">CPF</label>
              <input
                name="cpf"
                className="w-100 p-2 border-input"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label ps-2">Nome Completo</label>
              <input
                name="nome"
                className="w-100 p-2 border-input"
                placeholder="Ex: João da Silva"
                value={formData.nome}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label ps-2">Email</label>
              <input
                name="email"
                type="email"
                className="w-100 p-2 border-input"
                placeholder="joao.silva@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label ps-2">Senha</label>
              <input
                name="senha"
                type="password"
                className="w-100 p-2 border-input"
                placeholder="Mínimo 8 caracteres"
                value={formData.senha}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label ps-2">Data de Nascimento</label>
              <input
                name="dataNascimento"
                type="date"
                className="w-100 p-2 border-input"
                value={formData.dataNascimento}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label ps-2">Cargo</label>
              <input
                name="cargo"
                className="w-100 p-2 border-input"
                placeholder="Ex: Vendedor"
                value={formData.cargo}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label ps-2">Telefone</label>
              <input
                name="telefone"
                className="w-100 p-2 border-input"
                placeholder="(81) 99999-9999"
                value={formData.telefone}
                onChange={handleChange}
              />
            </div>
          </div>

          <footer className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
            <button
              type="button"
              className="primaria border-input ps-4 pe-4"
              onClick={handleSave}
              disabled={isSaveDisabled}
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
