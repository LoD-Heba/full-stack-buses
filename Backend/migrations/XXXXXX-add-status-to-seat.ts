import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStatusToSeat1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'seats',
      new TableColumn({
        name: 'status',
        type: 'enum',
        enum: ['disponible', 'reservado', 'ocupado', 'bloqueado'],
        default: "'disponible'",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('seats', 'status');
  }
}