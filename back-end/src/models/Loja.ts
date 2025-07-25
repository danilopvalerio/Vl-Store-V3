import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import Funcionario from "./Funcionario"; // Supondo que você criará Funcionario.ts
import Produto from "./Produto"; // Supondo que você criará Produto.ts
import Caixa from "./Caixa"; // Supondo que você criará Caixa.ts
import Venda from "./Venda"; // Supondo que você criará Venda.ts
import Movimentacao from "./Movimentacao"; // Supondo que você criará Movimentacao.ts
import LogSistema from "./LogSistema"; // Supondo que você criará LogSistema.ts

@Entity("loja")
export default class Loja {
  @PrimaryGeneratedColumn("uuid")
  id_loja!: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  nome!: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  senha!: string;

  @Column({ type: "varchar", length: 255, nullable: false, unique: true })
  email!: string;

  @Column({
    name: "cpf_cnpj_proprietario_loja",
    type: "varchar",
    length: 20,
    nullable: false,
    unique: true,
  })
  cpfCnpjProprietarioLoja!: string;

  @Column({
    name: "data_nasc_proprietario",
    type: "date",
    nullable: false,
  })
  dataNascProprietario!: Date;

  @Column({ type: "varchar", length: 20, nullable: false, unique: true })
  telefone!: string;

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao!: Date;

  @UpdateDateColumn({ name: "ultima_atualizacao" })
  ultimaAtualizacao!: Date;

  // --- Relacionamentos (Opcional, mas recomendado) ---
  // Uma loja pode ter vários funcionários.
  @OneToMany(() => Funcionario, (funcionario) => funcionario.loja)
  funcionarios!: Funcionario[];

  // Uma loja pode ter vários produtos.
  @OneToMany(() => Produto, (produto) => produto.loja)
  produtos!: Produto[];

  // Uma loja pode ter vários registros de caixa.
  @OneToMany(() => Caixa, (caixa) => caixa.loja)
  caixas!: Caixa[];

  // Uma loja pode ter várias vendas.
  @OneToMany(() => Venda, (venda) => venda.loja)
  vendas!: Venda[];

  // Uma loja pode ter várias movimentações.
  @OneToMany(() => Movimentacao, (movimentacao) => movimentacao.loja)
  movimentacoes!: Movimentacao[];

  // Uma loja pode ter vários logs.
  @OneToMany(() => LogSistema, (log) => log.loja)
  logs!: LogSistema[];
}
