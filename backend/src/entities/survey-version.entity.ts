import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BaseEntity,
} from "typeorm";
import { Survey } from "./survey.entity";
import { Admin } from "./admin.entity";
import { SurveyCategory } from "bizass-shared";

export enum SurveyVersionStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

@Entity("survey_versions")
@Index(["survey_id", "version"])
@Index(["status"])
export class SurveyVersion extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  survey_id: number;

  @Column({ type: "int" })
  version: number;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({
    type: "varchar",
    length: 50,
    enum: ["EXPRESS", "FULL"],
  })
  type: string;

  @Column({ type: "jsonb" })
  structure: SurveyCategory[];

  @Column({
    type: "varchar",
    length: 50,
    enum: Object.values(SurveyVersionStatus),
    default: SurveyVersionStatus.DRAFT,
  })
  status: SurveyVersionStatus;

  @Column({ type: "timestamptz", nullable: true })
  published_at: Date;

  @Column({ type: "int" })
  created_by_id: number;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Survey, (survey) => survey.versions)
  @JoinColumn({ name: "survey_id" })
  survey: Survey;

  @ManyToOne(() => Admin)
  @JoinColumn({ name: "created_by_id" })
  created_by: Admin;
}
