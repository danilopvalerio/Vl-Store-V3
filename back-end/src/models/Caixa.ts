import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import Funcionario from "./Funcionario";
import Loja from "./Loja";
import Venda from "./Venda";
import Movimentacao from "./Movimentacao";

@Entity("caixa")
export default class Caixa {
  @PrimaryGeneratedColumn("uuid")
  id_caixa!: string;

  @Column({ name: "data_abertura", type: "date", nullable: false })
  dataAbertura!: Date;

  @Column({ name: "hora_abertura", type: "time", nullable: false })
  horaAbertura!: string;

  @Column({ name: "hora_fechamento", type: "time", nullable: true })
  horaFechamento!: string;

  @Column({
    name: "valor_abertura",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0,
  })
  valorAbertura!: number;

  @Column({
    name: "valor_fechamento",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  valorFechamento!: number | null;

  @Column({
    name: "saldo_atual",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0,
  })
  saldoAtual!: number;

  @Column({
    name: "funcionario_responsavel",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  cpfFuncionarioResponsavel!: string;

  @Column({ name: "id_loja", type: "uuid", nullable: false })
  idLoja!: string;

  @Column({ type: "varchar", length: 50, nullable: false })
  status!: string; // Ex: 'ABERTO', 'FECHADO'

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao!: Date;

  @UpdateDateColumn({ name: "ultima_atualizacao" })
  ultimaAtualizacao!: Date;

  // --- Relacionamentos ---
  @ManyToOne(() => Funcionario, (funcionario) => funcionario.caixas, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "funcionario_responsavel", referencedColumnName: "cpf" })
  funcionarioResponsavel!: Funcionario;

  @ManyToOne(() => Loja, (loja) => loja.caixas, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_loja" })
  loja!: Loja;

  @OneToMany(() => Venda, (venda) => venda.caixa)
  vendas!: Venda[];

  @OneToMany(() => Movimentacao, (movimentacao) => movimentacao.caixa)
  movimentacoes!: Movimentacao[];
}
