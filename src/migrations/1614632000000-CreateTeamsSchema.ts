// src/migrations/CreateTeamsSchema.ts
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from "typeorm";

export class CreateTeamsSchema1614632000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create teams table
    await queryRunner.createTable(
      new Table({
        name: "teams",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "uuid",
          },
          {
            name: "name",
            type: "varchar",
          },
          {
            name: "description",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true,
    );

    // Create ask_channels table
    await queryRunner.createTable(
      new Table({
        name: "ask_channels",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "uuid",
          },
          {
            name: "channel_id",
            type: "varchar",
            isUnique: true,
          },
          {
            name: "channel_name",
            type: "varchar",
          },
          {
            name: "cron_schedule",
            type: "varchar",
          },
          {
            name: "cron_last_sent",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "allowed_bots",
            type: "json",
            default: "'[]'",
          },
          {
            name: "team_id",
            type: "uuid",
          },
        ],
      }),
      true,
    );

    // Create zendesk_integrations table
    await queryRunner.createTable(
      new Table({
        name: "zendesk_integrations",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "uuid",
          },
          {
            name: "channel_id",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "channel_name",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "monitored_view_id",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "aggregated_field_id",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "field_id",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "field_values",
            type: "json",
            default: "'[]'",
          },
          {
            name: "cron_schedule",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "team_id",
            type: "uuid",
          },
        ],
      }),
      true,
    );

    // Create code_review_channels table
    await queryRunner.createTable(
      new Table({
        name: "code_review_channels",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "uuid",
          },
          {
            name: "channel_id",
            type: "varchar",
            isUnique: true,
          },
          {
            name: "channel_name",
            type: "varchar",
          },
          {
            name: "team_id",
            type: "uuid",
          },
        ],
      }),
      true,
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      "ask_channels",
      new TableForeignKey({
        columnNames: ["team_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "teams",
        onDelete: "CASCADE",
      }),
    );

    await queryRunner.createForeignKey(
      "zendesk_integrations",
      new TableForeignKey({
        columnNames: ["team_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "teams",
        onDelete: "CASCADE",
      }),
    );

    await queryRunner.createForeignKey(
      "code_review_channels",
      new TableForeignKey({
        columnNames: ["team_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "teams",
        onDelete: "CASCADE",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const askChannelsTable = await queryRunner.getTable("ask_channels");
    const zendeskIntegrationsTable = await queryRunner.getTable(
      "zendesk_integrations",
    );
    const codeReviewChannelsTable = await queryRunner.getTable(
      "code_review_channels",
    );

    if (askChannelsTable) {
      const askChannelsForeignKey = askChannelsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("team_id") !== -1,
      );
      if (askChannelsForeignKey) {
        await queryRunner.dropForeignKey("ask_channels", askChannelsForeignKey);
      }
    }

    if (zendeskIntegrationsTable) {
      const zendeskForeignKey = zendeskIntegrationsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("team_id") !== -1,
      );
      if (zendeskForeignKey) {
        await queryRunner.dropForeignKey(
          "zendesk_integrations",
          zendeskForeignKey,
        );
      }
    }

    if (codeReviewChannelsTable) {
      const codeReviewForeignKey = codeReviewChannelsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf("team_id") !== -1,
      );
      if (codeReviewForeignKey) {
        await queryRunner.dropForeignKey(
          "code_review_channels",
          codeReviewForeignKey,
        );
      }
    }

    // Drop tables
    await queryRunner.dropTable("code_review_channels");
    await queryRunner.dropTable("zendesk_integrations");
    await queryRunner.dropTable("ask_channels");
    await queryRunner.dropTable("teams");
  }
}
