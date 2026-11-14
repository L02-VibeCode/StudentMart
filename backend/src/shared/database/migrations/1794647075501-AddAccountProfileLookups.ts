import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccountProfileLookups1794647075501 implements MigrationInterface {
    name = 'AddAccountProfileLookups1794647075501'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "School" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "code" character varying(100) NOT NULL, "name" character varying(200) NOT NULL, CONSTRAINT "UQ_6cf8f22b5638a54a216e1c6ab5f" UNIQUE ("code"), CONSTRAINT "PK_9d02131a9366ffdb5f2889ef6b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Area" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "code" character varying(100) NOT NULL, "name" character varying(200) NOT NULL, CONSTRAINT "UQ_f536f84e2a85a6186b4197a68af" UNIQUE ("code"), CONSTRAINT "PK_341ae1b6d91d85710f16035b885" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "Account" ADD "declared_school_id" uuid`);
        await queryRunner.query(`ALTER TABLE "Account" ADD "area_id" uuid`);
        await queryRunner.query(`ALTER TABLE "Account" ADD CONSTRAINT "FK_ef209b3900be786dc29665e5ffd" FOREIGN KEY ("declared_school_id") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Account" ADD CONSTRAINT "FK_82c3f7adf7a467313ba322da4e7" FOREIGN KEY ("area_id") REFERENCES "Area"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Account" DROP CONSTRAINT "FK_82c3f7adf7a467313ba322da4e7"`);
        await queryRunner.query(`ALTER TABLE "Account" DROP CONSTRAINT "FK_ef209b3900be786dc29665e5ffd"`);
        await queryRunner.query(`ALTER TABLE "Account" DROP COLUMN "area_id"`);
        await queryRunner.query(`ALTER TABLE "Account" DROP COLUMN "declared_school_id"`);
        await queryRunner.query(`DROP TABLE "Area"`);
        await queryRunner.query(`DROP TABLE "School"`);
    }

}
