// src/entities/ZendeskIntegration.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from "typeorm";

@Entity("zendesk_integrations")
export class ZendeskIntegration {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "channel_id", nullable: true })
  channel_id: string;

  @Column({ name: "channel_name", nullable: true })
  channel_name: string;

  @Column({ name: "monitored_view_id", nullable: true })
  monitored_view_id: string;

  @Column({ name: "aggregated_field_id", nullable: true })
  aggregated_field_id: string;

  @Column({ name: "field_id", nullable: true })
  field_id: string;

  @Column("json", { name: "field_values", default: [] })
  field_values: string[];

  @Column({ name: "cron_schedule", nullable: true })
  cron_schedule: string;

  // Relationship
  @OneToOne("Team", (team: any) => team.zendeskIntegration)
  @JoinColumn({ name: "team_id" }) // Explicitly use snake_case
  team: any;
}
