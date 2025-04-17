// src/entities/Team.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from "typeorm";
import { AskChannel } from "./AskChannel";
import { ZendeskIntegration } from "./ZendeskIntegration";
import { CodeReviewChannel } from "./CodeReviewChannel";

@Entity("teams")
export class Team {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;

  // Relationships
  @OneToOne(() => AskChannel, (askChannel) => askChannel.team, {
    cascade: true,
    eager: true,
  })
  askChannel: AskChannel;

  @OneToOne(
    () => ZendeskIntegration,
    (zendeskIntegration) => zendeskIntegration.team,
    {
      cascade: true,
      nullable: true,
    }
  )
  zendeskIntegration: ZendeskIntegration;

  @OneToOne(
    () => CodeReviewChannel,
    (codeReviewChannel) => codeReviewChannel.team,
    {
      cascade: true,
      nullable: true,
    }
  )
  codeReviewChannel: CodeReviewChannel;
}
