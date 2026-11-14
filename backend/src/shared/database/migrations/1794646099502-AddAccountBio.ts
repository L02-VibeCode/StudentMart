import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccountBio1794646099502 implements MigrationInterface {
    name = 'AddAccountBio1794646099502'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Account" ADD "bio" character varying(500)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Account" DROP COLUMN "bio"`);
    }

}
