import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { SurveySession } from './survey-session.entity';
import { Payment } from './payment.entity';
import { ReferralCode } from './referral-code.entity';
import { ReferralUsage } from './referral-usage.entity';

@Entity('users')
export class User {
  @PrimaryColumn({ type: 'bigint' })
  telegram_id: number;

  @Column({ type: 'varchar', length: 255 })
  first_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  username?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // Relations
  @OneToMany(() => SurveySession, session => session.user)
  survey_sessions: SurveySession[];

  @OneToMany(() => Payment, payment => payment.user)
  payments: Payment[];

  @OneToMany(() => ReferralCode, referralCode => referralCode.user)
  referral_codes: ReferralCode[];

  @OneToMany(() => ReferralUsage, referralUsage => referralUsage.new_user)
  referral_usages: ReferralUsage[];
}
