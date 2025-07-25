// src/models/RefreshToken.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import Loja from "./Loja";

@Entity("refresh_token")
export default class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // Armazenaremos um hash do token por segurança
  @Column({ type: "varchar", nullable: false })
  hashedToken!: string;

  // Chave estrangeira para a Loja
  @Column({ name: "id_loja" })
  id_loja!: string;

  // Relacionamento: Muitos Refresh Tokens pertencem a uma Loja.
  @ManyToOne(() => Loja, (loja) => loja.refreshTokens, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_loja" })
  loja!: Loja;

  @Column({ type: "timestamp" })
  expiresAt!: Date;

  // Opcional: para revogar um token sem deletá-lo
  @Column({ type: "timestamp", nullable: true })
  revokedAt?: Date;

  @CreateDateColumn({ name: "data_criacao" })
  dataCriacao!: Date;
}
