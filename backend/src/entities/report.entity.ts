import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  BaseEntity,
} from "typeorm";
import { SurveySession } from "./survey-session.entity";
import { Payment } from "./payment.entity";

@Entity("reports")
export class Report extends BaseEntity {
  @PrimaryColumn({ type: "uuid" })
  id: string;

  @Column({ type: "uuid" })
  session_id: string;

  @Column({
    type: "varchar",
    length: 50,
    enum: ["FREE", "PAID"],
  })
  payment_status: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  storage_url?: string; // URL to the generated PDF file (e.g., S3)

  @Column({ type: "jsonb" })
  analytics_summary: any; // Cached analytics data

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  // Relations
  @ManyToOne(() => SurveySession, (session) => session.reports)
  @JoinColumn({ name: "session_id" })
  session: SurveySession;

  @OneToMany(() => Payment, (payment) => payment.report)
  payments: Payment[];
}
