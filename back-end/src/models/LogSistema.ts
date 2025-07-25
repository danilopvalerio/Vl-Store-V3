import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import Funcionario from "./Funcionario";
import Loja from "./Loja";

@Entity("log_sistema")
export default class LogSistema {
  @PrimaryGeneratedColumn("uuid")
  id_log!: string;

  @Column({
    name: "cpf_funcionario",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  cpfFuncionario!: string;

  @Column({ name: "id_loja", type: "uuid", nullable: false })
  idLoja!: string;

  @Column({ name: "tipo_acao", type: "varchar", length: 50, nullable: true })
  tipoAcao!: string; // EX: 'INSERCAO', 'REMOCAO', 'EDICAO'

  @Column({ type: "text", nullable: false })
  descricao!: string;

  @Column({ name: "origem_ip", type: "varchar", length: 45, nullable: true })
  origemIp!: string;

  @CreateDateColumn({ name: "data_acao" })
  dataAcao!: Date;

  // --- Relacionamentos ---
  @ManyToOne(() => Funcionario, (funcionario) => funcionario.logs, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "cpf_funcionario", referencedColumnName: "cpf" })
  funcionario!: Funcionario;

  @ManyToOne(() => Loja, (loja) => loja.logs, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_loja" })
  loja!: Loja;
}
