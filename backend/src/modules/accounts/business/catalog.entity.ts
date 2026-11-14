import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
@Entity({ name: "School" })
export class School {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 100, unique: true }) code!: string;
  @Column({ type: "varchar", length: 200 }) name!: string;
}
@Entity({ name: "Area" })
export class Area {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ type: "varchar", length: 100, unique: true }) code!: string;
  @Column({ type: "varchar", length: 200 }) name!: string;
}
