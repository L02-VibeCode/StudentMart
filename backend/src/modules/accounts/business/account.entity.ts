import {
  Column,
  Check,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum AccountRole {
  MEMBER = "MEMBER",
  ADMIN = "ADMIN",
}

@Entity({ name: "Account" })
@Check("CHK_Account_email_normalized", '"email" = lower(btrim("email"))')
export class Account {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 254, unique: true })
  email!: string;

  @Column({ name: "password_hash", type: "text", select: false })
  passwordHash!: string;

  @Column({ name: "display_name", type: "varchar", length: 100 })
  displayName!: string;

  @Column({
    type: "enum",
    enum: AccountRole,
    enumName: "account_role",
    default: AccountRole.MEMBER,
  })
  role!: AccountRole;

  @Column({ name: "login_disabled_at", type: "timestamptz", nullable: true, select: false })
  loginDisabledAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
