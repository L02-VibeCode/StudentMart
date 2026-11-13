import { MigrationInterface, QueryRunner } from "typeorm";

export class EnforceNormalizedAccountEmail1794564730669 implements MigrationInterface {
    name = 'EnforceNormalizedAccountEmail1794564730669'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Account" ADD CONSTRAINT "CHK_Account_email_normalized" CHECK ("email" = lower(btrim("email")))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Account" DROP CONSTRAINT "CHK_Account_email_normalized"`);
    }

}
