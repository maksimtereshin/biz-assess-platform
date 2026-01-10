import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from "typeorm";
import { ReferralCode } from "./referral-code.entity";
import { User } from "./user.entity";

@Entity("referral_usage")
export class ReferralUsage extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 50 })
  referrer_code: string;

  @Column({ type: "bigint" })
  new_user_telegram_id: number;

  @CreateDateColumn({ type: "timestamptz" })
  used_at: Date;

  // Relations
  @ManyToOne(() => ReferralCode, (referralCode) => referralCode.referral_usages)
  @JoinColumn({ name: "referrer_code" })
  referrer_code_entity: ReferralCode;

  @ManyToOne(() => User, (user) => user.referral_usages)
  @JoinColumn({ name: "new_user_telegram_id" })
  new_user: User;
}
