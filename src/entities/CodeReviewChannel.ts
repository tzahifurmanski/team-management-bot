// src/entities/CodeReviewChannel.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Team } from "./Team";

@Entity("code_review_channels")
export class CodeReviewChannel {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "channel_id", unique: true })
  channel_id: string;

  @Column({ name: "channel_name" })
  channel_name: string;

  // Relationship
  @OneToOne(() => Team, (team) => team.codeReviewChannel)
  @JoinColumn({ name: "team_id" }) // Explicitly use snake_case
  team: Team;
}
