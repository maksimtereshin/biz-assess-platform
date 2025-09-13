import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Report } from "./report.entity";
import { SurveySession } from "./survey-session.entity";

@Entity("payments")
export class Payment {
  @PrimaryColumn({ type: "uuid" })
  id: string;

  @Column({ type: "uuid", nullable: true })
  report_id?: string;

  @Column({ type: "uuid", nullable: true })
  survey_session_id?: string;

  @Column({ type: "bigint" })
  user_telegram_id: number;

  @Column({ type: "varchar", length: 255 })
  telegram_charge_id: string;

  @Column({ type: "int" })
  amount: number; // Amount in smallest currency unit (e.g., cents)

  @Column({ type: "varchar", length: 10 })
  currency: string; // e.g., 'USD'

  @Column({
    type: "varchar",
    length: 50,
    enum: ["PENDING", "SUCCESSFUL", "FAILED"],
  })
  status: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.payments)
  @JoinColumn({ name: "user_telegram_id" })
  user: User;

  @ManyToOne(() => Report, (report) => report.payments)
  @JoinColumn({ name: "report_id" })
  report?: Report;

  @ManyToOne(() => SurveySession, (session) => session.payments)
  @JoinColumn({ name: "survey_session_id" })
  survey_session?: SurveySession;
}
