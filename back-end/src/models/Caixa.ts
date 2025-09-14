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

  @Column({ name: "data_abertura", type: "date" })
  dataAbertura!: Date;

  @Column({ name: "hora_abertura", type: "time" })
  horaAbertura!: string;

  @Column({ name: "hora_fechamento", type: "time", nullable: true })
  horaFechamento!: string | null;

  @Column({
    name: "valor_abertura",
    type: "decimal",
    precision: 10,
    scale: 2,
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
    default: 0,
  })
  saldoAtual!: number;

  @Column({
    name: "funcionario_responsavel",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  cpfFuncionarioResponsavel!: string | null;

  @Column({ name: "id_loja", type: "uuid" })
  idLoja!: string;

  @Column({ type: "varchar", length: 50 })
  status!: string;

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao!: Date;

  @UpdateDateColumn({ name: "ultima_atualizacao" })
  ultimaAtualizacao!: Date;

  // --- Relacionamentos ---
  @ManyToOne(
    () => Funcionario,
    (funcionario: Funcionario) => funcionario.caixas,
    { onDelete: "SET NULL", nullable: true }
  )
  @JoinColumn({ name: "funcionario_responsavel", referencedColumnName: "cpf" })
  funcionarioResponsavel!: Funcionario | null;

  @ManyToOne(() => Loja, (loja: Loja) => loja.caixas, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_loja" })
  loja!: Loja;

  @OneToMany(() => Venda, (venda: Venda) => venda.caixa)
  vendas!: Venda[];

  @OneToMany(
    () => Movimentacao,
    (movimentacao: Movimentacao) => movimentacao.caixa
  )
  movimentacoes!: Movimentacao[];
}
