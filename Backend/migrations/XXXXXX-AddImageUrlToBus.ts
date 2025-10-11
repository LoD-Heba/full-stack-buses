import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddImageUrlToBus1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'buses',
      new TableColumn({
        name: 'image_url',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('buses', 'image_url');
  }
}