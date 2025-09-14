import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import Loja from "./Loja";
import Caixa from "./Caixa";
import Venda from "./Venda";
import LogSistema from "./LogSistema";

@Entity("funcionario")
export default class Funcionario {
  @PrimaryColumn({ type: "varchar", length: 20 })
  cpf!: string;

  @Column({ type: "varchar", length: 255 })
  nome!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  cargo!: string;

  @Column({ name: "data_nascimento", type: "date" })
  dataNascimento!: Date;

  @Column({ type: "varchar", length: 20, nullable: true })
  telefone!: string;

  @Column({ name: "id_loja", type: "uuid" })
  idLoja!: string;

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao!: Date;

  @UpdateDateColumn({ name: "ultima_atualizacao" })
  ultimaAtualizacao!: Date;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 255, select: false })
  senha!: string;

  // --- Relacionamentos ---
  @ManyToOne(() => Loja, (loja: Loja) => loja.funcionarios, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "id_loja" })
  loja!: Loja;

  @OneToMany(() => Caixa, (caixa: Caixa) => caixa.funcionarioResponsavel)
  caixas!: Caixa[];

  @OneToMany(() => Venda, (venda: Venda) => venda.funcionarioResponsavel)
  vendas!: Venda[];

  @OneToMany(() => LogSistema, (log: LogSistema) => log.funcionario)
  logs!: LogSistema[];
}
