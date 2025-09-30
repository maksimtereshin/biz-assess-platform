import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { SurveySession } from "./survey-session.entity";
import { SurveyCategory } from "bizass-shared";

@Entity("surveys")
export class Survey {
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

  // Relations
  @OneToMany(() => SurveySession, (session) => session.survey)
  survey_sessions: SurveySession[];
}
