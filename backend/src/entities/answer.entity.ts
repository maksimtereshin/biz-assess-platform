import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { SurveySession } from "./survey-session.entity";

@Entity("answers")
export class Answer extends BaseEntity {
  @PrimaryColumn({ type: "uuid" })
  session_id: string;

  @PrimaryColumn({ type: "int" })
  question_id: number;

  @Column({ type: "int" })
  score: number; // User's answer (1-10)

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  // Relations
  @ManyToOne(() => SurveySession, (session) => session.answers)
  @JoinColumn({ name: "session_id" })
  session: SurveySession;
}
