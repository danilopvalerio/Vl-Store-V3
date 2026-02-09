// src/app/(admin)/employee/page.tsx
"use client";

import { GenericEntityPage } from "@/components/common/GenericEntityPage";
import EntityCard from "@/components/common/EntityCard";
import AddEmployeeModal from "@/features/employee/AddEmployeeModal";
import EmployeeDetailModal from "@/features/employee/EmployeeDetailModal";
import { EmployeeEntity } from "@/features/employee/types";
import { getImageUrl } from "@/utils/imageUrl";
import {
  faUser,
  faBriefcase,
  faIdCard,
} from "@fortawesome/free-solid-svg-icons";

const sortOptions = [
  { value: "name_asc", label: "Nome (A-Z)" },
  { value: "cargo_asc", label: "Cargo (A-Z)" },
  { value: "date_desc", label: "Mais Recentes" },
];

const EmployeePage = () => {
  return (
    <GenericEntityPage<EmployeeEntity>
      pageTitle="Gerenciar Funcionários"
      pageSubtitle="Controle de perfis e acessos"
      apiPath="/profiles"
      sortOptions={sortOptions}
      getId={(employee) => employee.id_user_profile}
      renderCard={(employee, onSelect) => (
        <EntityCard
          title={employee.nome}
          subtitle={employee.cargo}
          imageUrl={getImageUrl(employee.foto_url)}
          isActive={employee.status === "ACTIVE"}
          onClick={() => onSelect(employee.id_user_profile)}
          details={[
            {
              icon: faIdCard,
              text:
                employee.cpf_cnpj?.replace(
                  /(\d{3})(\d{3})(\d{3})(\d{2})/,
                  "$1.$2.$3-$4",
                ) || "N/A",
              label: "CPF",
            },
            {
              icon: faBriefcase,
              text: employee.tipo_perfil,
              label: "Tipo",
            },
            {
              icon: faUser,
              text:
                employee.status === "ACTIVE"
                  ? "Ativo"
                  : employee.status === "INACTIVE"
                    ? "Inativo"
                    : "Bloqueado",
              label: "Status",
            },
          ]}
        />
      )}
      renderAddModal={(onClose, onSuccess) => (
        <AddEmployeeModal onClose={onClose} onSuccess={onSuccess} />
      )}
      renderDetailModal={(id, onClose, onSuccess) => (
        <EmployeeDetailModal
          profileId={String(id)}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    />
  );
};

export default EmployeePage;
