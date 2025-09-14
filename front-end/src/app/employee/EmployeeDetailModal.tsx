// app/employees/EmployeeDetailModal.tsx
"use client";
import { AxiosError } from "axios";
import { useState, useEffect, SetStateAction, Dispatch } from "react";
import api from "../../utils/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

// --- Interfaces ---
interface EmployeeDetail {
  cpf: string;
  nome: string;
  email: string;
  cargo: string;
  dataNascimento: string;
  telefone: string;
}

interface EmployeeDetailModalProps {
  employee: EmployeeDetail;
  onClose: () => void;
  onUpdate: () => void;
}

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  employee,
  onClose,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<Partial<EmployeeDetail>>(employee);
  const [originalData, setOriginalData] = useState(employee);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // Format date for input type="date"
    const formattedDate = employee.dataNascimento
      ? new Date(employee.dataNascimento).toISOString().split("T")[0]
      : "";
    const initialData = { ...employee, dataNascimento: formattedDate };
    setFormData(initialData);
    setOriginalData(initialData);
  }, [employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  const showMessage = (
    setter: Dispatch<SetStateAction<string>>,
    message: string
  ) => {
    setter(message);
    setTimeout(() => setter(""), 4000);
  };

  const handleUpdate = async () => {
    if (!hasChanges) return;
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await api.patch(`/funcionarios/${employee.cpf}`, formData);
      showMessage(setSuccess, "Dados atualizados com sucesso!");
      onUpdate();
      setTimeout(onClose, 1500);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message || "Ocorreu um erro ao atualizar.";
      showMessage(setError, errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      await api.delete(`/funcionarios/${employee.cpf}`);
      alert("Funcionário excluído com sucesso!");
      onUpdate();
      onClose();
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message ||
        "Não foi possível excluir o funcionário.";
      showMessage(setError, errorMessage);
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="modal-content rounded-4">
      <header className="w-100 terciary p-3 d-flex justify-content-between align-items-center">
        <h4 className="m-0 w-100 text-center primary-color">
          Detalhes do Funcionário
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
            <div className="col-12">
              <label className="form-label ps-2">CPF</label>
              <input
                className="w-100 p-2 border-input fw-bold"
                value={formData.cpf}
                disabled
              />
            </div>
            <div className="col-md-6">
              <label className="form-label ps-2">Nome Completo</label>
              <input
                name="nome"
                className="w-100 p-2 border-input"
                value={formData.nome}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label ps-2">Email</label>
              <input
                name="email"
                type="email"
                className="w-100 p-2 border-input"
                value={formData.email}
                onChange={handleChange}
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
              />
            </div>
            <div className="col-md-6">
              <label className="form-label ps-2">Cargo</label>
              <input
                name="cargo"
                className="w-100 p-2 border-input"
                value={formData.cargo}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label ps-2">Telefone</label>
              <input
                name="telefone"
                className="w-100 p-2 border-input"
                value={formData.telefone}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label ps-2 text-muted">
                Nova Senha (Opcional)
              </label>
              <input
                name="senha"
                type="password"
                className="w-100 p-2 border-input"
                placeholder="Deixe em branco para não alterar"
                onChange={handleChange}
              />
            </div>
          </div>

          <footer className="d-flex justify-content-between gap-2 mt-4 pt-3 border-top">
            <div>
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  className="primaria border-input ps-4 pe-4"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting}
                >
                  Excluir
                </button>
              ) : (
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                  >
                    Confirmar Exclusão
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="primaria border-input ps-4 pe-4"
                onClick={handleUpdate}
                disabled={!hasChanges || isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default EmployeeDetailModal;
