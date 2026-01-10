import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
  BaseEntity,
} from "typeorm";
import { User } from "./user.entity";
import { Survey } from "./survey.entity";
import { SurveyVersion } from "./survey-version.entity";
import { Answer } from "./answer.entity";
import { Report } from "./report.entity";
import { Payment } from "./payment.entity";

@Entity("survey_sessions")
export class SurveySession extends BaseEntity {
  @PrimaryColumn({ type: "uuid" })
  id: string;

  @Column({ type: "bigint" })
  user_telegram_id: number;

  @Column({ type: "int" })
  survey_id: number;

  // New field for versioning - tracks which version of the survey this session uses
  @Column({ type: "int", nullable: true })
  survey_version_id: number;

  @Column({
    type: "varchar",
    length: 50,
    enum: ["IN_PROGRESS", "COMPLETED"],
  })
  status: string;

  @Column({
    type: "boolean",
    default: false,
  })
  requires_payment: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.survey_sessions)
  @JoinColumn({ name: "user_telegram_id" })
  user: User;

  @ManyToOne(() => Survey, (survey) => survey.survey_sessions)
  @JoinColumn({ name: "survey_id" })
  survey: Survey;

  @ManyToOne(() => SurveyVersion, { nullable: true })
  @JoinColumn({ name: "survey_version_id" })
  survey_version: SurveyVersion;

  @OneToMany(() => Answer, (answer) => answer.session)
  answers: Answer[];

  @OneToMany(() => Report, (report) => report.session)
  reports: Report[];

  @OneToMany(() => Payment, (payment) => payment.survey_session)
  payments: Payment[];
}
