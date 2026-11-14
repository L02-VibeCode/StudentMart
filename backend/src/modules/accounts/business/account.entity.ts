import {
  Column,
  ManyToOne,
  JoinColumn,
  Check,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { School, Area } from "./catalog.entity";

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

  @Column({ name: "avatar_url", type: "text", nullable: true })
  avatarUrl!: string | null;
  @Column({ name: "avatar_public_id", type: "text", nullable: true, select: false })
  avatarPublicId!: string | null;

  @Column({ name: "declared_school_id", type: "uuid", nullable: true })
  declaredSchoolId!: string | null;
  @ManyToOne(() => School, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "declared_school_id" })
  declaredSchool!: School | null;
  @Column({ name: "area_id", type: "uuid", nullable: true })
  areaId!: string | null;
  @ManyToOne(() => Area, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "area_id" })
  area!: Area | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  bio!: string | null;

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
