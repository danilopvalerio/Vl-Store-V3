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

  @Column({ type: "varchar", length: 255, nullable: false })
  nome!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  cargo!: string;

  @Column({ name: "data_nascimento", type: "date", nullable: false })
  dataNascimento!: Date;

  @Column({ type: "varchar", length: 20, nullable: true })
  telefone!: string;

  @Column({ name: "id_loja", type: "uuid", nullable: false })
  idLoja!: string;

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao!: Date;

  @UpdateDateColumn({ name: "ultima_atualizacao" })
  ultimaAtualizacao!: Date;

  // --- Relacionamentos ---
  @ManyToOne(() => Loja, (loja) => loja.funcionarios, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_loja" })
  loja!: Loja;

  @OneToMany(() => Caixa, (caixa) => caixa.funcionarioResponsavel)
  caixas!: Caixa[];

  @OneToMany(() => Venda, (venda) => venda.funcionarioResponsavel)
  vendas!: Venda[];

  @OneToMany(() => LogSistema, (log) => log.funcionario)
  logs!: LogSistema[];
}
