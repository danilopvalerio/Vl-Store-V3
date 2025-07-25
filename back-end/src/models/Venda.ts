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

  @Column({
    name: "forma_pagamento",
    type: "varchar",
    length: 50,
    nullable: false,
  })
  formaPagamento!: string;

  @Column({
    name: "funcionario_responsavel",
    type: "varchar",
    length: 20,
    nullable: true,
  })
  cpfFuncionarioResponsavel!: string;

  @Column({ type: "date", nullable: false })
  data!: Date;

  @Column({ type: "time", nullable: false })
  hora!: string;

  @Column({ name: "id_caixa", type: "uuid", nullable: true })
  idCaixa!: string;

  @Column({ name: "id_loja", type: "uuid", nullable: false })
  idLoja!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  desconto!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  acrescimo!: number;

  @Column({
    name: "status_venda",
    type: "varchar",
    length: 50,
    nullable: false,
  })
  statusVenda!: string; // Ex: 'CONCLUIDA', 'CANCELADA'

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao!: Date;

  @UpdateDateColumn({ name: "ultima_atualizacao" })
  ultimaAtualizacao!: Date;

  // --- Relacionamentos ---
  @ManyToOne(() => Funcionario, (funcionario) => funcionario.vendas, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "funcionario_responsavel", referencedColumnName: "cpf" })
  funcionarioResponsavel!: Funcionario;

  @ManyToOne(() => Caixa, (caixa) => caixa.vendas, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "id_caixa" })
  caixa!: Caixa;

  @ManyToOne(() => Loja, (loja) => loja.vendas, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_loja" })
  loja!: Loja;

  @OneToMany(() => ItemVenda, (item) => item.venda)
  itens!: ItemVenda[];

  @OneToMany(() => Movimentacao, (movimentacao) => movimentacao.venda)
  movimentacoes!: Movimentacao[];
}
