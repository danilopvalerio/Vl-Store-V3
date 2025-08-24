// app/employees/EmployeeCard.tsx
"use client";

interface EmployeeSummary {
  cpf: string;
  nome: string;
  email: string;
  cargo: string;
}

interface EmployeeCardProps {
  employee: EmployeeSummary;
  onClick: (cpf: string) => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, onClick }) => {
  return (
    <div
      className="rounded-5 card-item css-button-fully-rounded--white h-100 d-flex flex-column justify-content-between p-3"
      onClick={() => onClick(employee.cpf)}
      style={{ cursor: "pointer" }}
    >
      <div>
        <h5 className="card-title mb-3 text-truncate">{employee.nome}</h5>
        <p className="mb-1">
          <strong>CPF:</strong> {employee.cpf}
        </p>
        <p className="mb-1 text-truncate">
          <strong>Email:</strong> {employee.email}
        </p>
        <p className="mb-1">
          <strong>Cargo:</strong> {employee.cargo || "Não informado"}
        </p>
      </div>
    </div>
  );
};

export default EmployeeCard;
