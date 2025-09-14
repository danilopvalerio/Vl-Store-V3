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
import Caixa from "./Caixa";
import Loja from "./Loja";
import ItemVenda from "./ItemVenda";
import Movimentacao from "./Movimentacao";

@Entity("venda")
export default class Venda {
  @PrimaryGeneratedColumn("uuid")
  id_venda!: string;

  @Column({ name: "forma_pagamento", type: "varchar", length: 50 })
  formaPagamento!: string;

  @Column({
    name: "funcionario_responsavel",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  cpfFuncionarioResponsavel!: string | null;

  @Column({ type: "date" })
  data!: Date;

  @Column({ type: "time" })
  hora!: string;

  @Column({ name: "id_caixa", type: "uuid", nullable: true })
  idCaixa!: string | null;

  @Column({ name: "id_loja", type: "uuid" })
  idLoja!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  desconto!: number | null;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  acrescimo!: number | null;

  @Column({ name: "status_venda", type: "varchar", length: 50 })
  statusVenda!: string;

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao!: Date;

  @UpdateDateColumn({ name: "ultima_atualizacao" })
  ultimaAtualizacao!: Date;

  // --- Relacionamentos ---
  @ManyToOne(
    () => Funcionario,
    (funcionario: Funcionario) => funcionario.vendas,
    { onDelete: "SET NULL", nullable: true }
  )
  @JoinColumn({ name: "funcionario_responsavel", referencedColumnName: "cpf" })
  funcionarioResponsavel!: Funcionario | null;

  @ManyToOne(() => Caixa, (caixa: Caixa) => caixa.vendas, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "id_caixa" })
  caixa!: Caixa | null;

  @ManyToOne(() => Loja, (loja: Loja) => loja.vendas, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_loja" })
  loja!: Loja;

  @OneToMany(() => ItemVenda, (item: ItemVenda) => item.venda)
  itens!: ItemVenda[];

  @OneToMany(
    () => Movimentacao,
    (movimentacao: Movimentacao) => movimentacao.venda
  )
  movimentacoes!: Movimentacao[];
}
