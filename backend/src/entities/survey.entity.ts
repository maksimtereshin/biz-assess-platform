import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { SurveySession } from "./survey-session.entity";
import { SurveyVersion } from "./survey-version.entity";
import { SurveyCategory } from "bizass-shared";

@Entity("surveys")
export class Survey extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "varchar",
    length: 50,
    enum: ["EXPRESS", "FULL"],
  })
  type: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "jsonb" })
  structure: SurveyCategory[]; // JSON object holding all questions, categories, subcategories

  // New field for versioning
  @Column({ type: "int", nullable: true })
  latest_published_version_id: number;

  // Soft delete support
  @Column({ type: "timestamptz", nullable: true })
  deleted_at: Date;

  // Relations
  @OneToMany(() => SurveySession, (session) => session.survey)
  survey_sessions: SurveySession[];

  @OneToMany(() => SurveyVersion, (version) => version.survey)
  versions: SurveyVersion[];

  @ManyToOne(() => SurveyVersion, { nullable: true })
  @JoinColumn({ name: "latest_published_version_id" })
  latest_published_version: SurveyVersion;
}
