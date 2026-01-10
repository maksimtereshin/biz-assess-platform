import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BaseEntity,
} from "typeorm";

@Entity("admins")
export class Admin extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: "varchar", length: 255, unique: true })
  telegram_username: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  // Self-reference FK for tracking who created this admin
  @Column({ type: "int", nullable: true })
  created_by_id: number;

  @ManyToOne(() => Admin, { nullable: true })
  @JoinColumn({ name: "created_by_id" })
  created_by: Admin;
}
