import { useRouter } from "next/router";
import { EmployeeCardProps } from "../../../domain/interfaces/employees-interface";
import axios from "axios";

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee }) => {
  const router = useRouter();

  const openDetailedEmployee = async (id_funcionario: string) => {
    try {
      const jwtToken = localStorage.getItem("jwtToken");
      const userData = localStorage.getItem("userData");

      if (!jwtToken || !userData) {
        console.error("Usuário não autenticado.");
        return;
      }

      const response = await axios.get(
        `https://vl-store-v2.onrender.com/api/funcionarios/${id_funcionario}`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          timeout: 2000,
        }
      );

      localStorage.setItem("selectedEmployee", JSON.stringify(response.data));

      router.push("/employeesDetail");
    } catch (error) {
      alert(
        "Erro ao carregar detalhes do funcionário, tente novamente mais tarde."
      );
    }
  };

  return (
    <div className="col-12 col-md-3 product-card rounded-5 p-3 d-flex justify-content-center flex-column">
      <p className="mt-2 card-title secondary p-1 m-1">Nome: {employee.nome}</p>
      <p className="card-title secondary p-1 m-1">
        Telefone: {employee.telefone}
      </p>
      <p className="card-title secondary p-1 m-1">Email: {employee.email}</p>
      <button
        className="btn primaria w-100 mt-2"
        onClick={() => openDetailedEmployee(employee.id_funcionario)}
      >
        Detalhes
      </button>
    </div>
  );
};

export default EmployeeCard;
