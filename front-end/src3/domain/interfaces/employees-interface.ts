export interface Employee {
  id_funcionario: string;
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  data_nascimento: string;
  telefone: string;
  id_loja: string;
}

export interface EmployeeCardProps {
  employee: Employee;
}
