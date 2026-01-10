import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BaseEntity,
} from "typeorm";

/**
 * Content type enum for bot content classification
 */
export enum ContentType {
  MESSAGE = "message",
  BUTTON_TEXT = "button_text",
  COMMAND_DESCRIPTION = "command_description",
}

/**
 * BotContent entity for database-driven content management
 * Stores all bot messages, button texts, and command descriptions
 * Supports future admin CMS for content editing
 */
@Entity("bot_content")
export class BotContent extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 255, unique: true })
  content_key: string;

  @Column({ type: "text" })
  content_value: string;

  @Column({
    type: "varchar",
    length: 50,
    default: ContentType.MESSAGE,
  })
  content_type: ContentType;

  @Column({ type: "varchar", length: 10, default: "ru" })
  language: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
