// src/entities/AskChannel.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from "typeorm";

@Entity("ask_channels")
export class AskChannel {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "channel_id", unique: true })
  channel_id: string;

  @Column({ name: "channel_name" })
  channel_name: string;

  @Column({ name: "cron_schedule" })
  cron_schedule: string;

  @Column("timestamp", { name: "cron_last_sent", nullable: true })
  cron_last_sent: Date | null;

  // Storing allowed bots as a JSON array
  @Column("json", { name: "allowed_bots", default: [] })
  allowed_bots: string[];

  // Relationship with Team - explicitly specify column name
  @OneToOne("Team", (team: any) => team.askChannel)
  @JoinColumn({ name: "team_id" }) // Explicitly use snake_case
  team: any;
}
