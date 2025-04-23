// src/entities/CodeReviewChannel.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from "typeorm";

@Entity("code_review_channels")
export class CodeReviewChannel {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "channel_id", unique: true })
  channel_id: string;

  @Column({ name: "channel_name" })
  channel_name: string;

  // Relationship
  @OneToOne("Team", (team: any) => team.codeReviewChannel)
  @JoinColumn({ name: "team_id" }) // Explicitly use snake_case
  team: any;
}
