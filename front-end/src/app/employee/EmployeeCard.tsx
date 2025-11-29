//src/app/employee/EmployeeCard.tsx
"use client";

// Definimos a interface EXATAMENTE como os dados chegam da page.tsx
export interface EmployeeSummary {
  id_user_profile: string;
  cpf: string; // ou cpf_cnpj
  nome: string;
  cargo: string;
  email?: string; // <--- ADICIONE O '?' PARA SER OPCIONAL
}

interface Props {
  employee: EmployeeSummary;
  onClick: () => void;
}

const EmployeeCard = ({ employee, onClick }: Props) => {
  return (
    <div
      className="card-item-bottom-line-rounded h-100  hover-shadow cursor-pointer"
      onClick={onClick}
      style={{
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.classList.add("shadow");
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.classList.remove("shadow");
      }}
    >
      <div className="card-body p-4 d-flex flex-column">
        <div className="d-flex align-items-center mb-3">
          <div
            className="card-item-letter rounded-circle bg-light d-flex align-items-center justify-content-center fw-bold fs-5 me-3"
            style={{ width: "48px", height: "48px" }}
          >
            {employee.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <h6
              className="card-title fw-bold mb-0 text-truncate"
              style={{ maxWidth: "180px" }}
            >
              {employee.nome}
            </h6>
            <small className="">{employee.cargo}</small>
          </div>
        </div>
        <div className="mt-auto pt-2 border-top">
          <p className="mb-0 small">
            <strong>CPF:</strong> {employee.cpf}
          </p>
          {/* Renderiza email apenas se existir */}
          {employee.email && (
            <p className="mb-0 small text-muted text-truncate">
              {employee.email}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeCard;
