// src/components/common/EntityModalWrapper.tsx
import { ReactNode, useEffect } from "react";

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode; // Aqui entra o Form específico (ProductForm, EmployeeForm)
}

const EntityModalWrapper = ({ title, onClose, children }: Props) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop show d-flex justify-content-center align-items-center bg-dark bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="modal-dialog detail-box"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content w-100 border-0 shadow">
          <div className="modal-header w-100 bg-white border-bottom-0 p-4 pb-0 d-flex justify-content-between align-items-center sticky-top">
            <h5 className="modal-title fw-bold text-secondary">{title}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body w-100 p-4 pt-2">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default EntityModalWrapper;
