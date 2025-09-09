import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { ReferralUsage } from './referral-usage.entity';

@Entity('referral_codes')
export class ReferralCode {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  code: string; // Unique user-facing referral code

  @Column({ type: 'bigint' })
  user_telegram_id: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  // Relations
  @ManyToOne(() => User, user => user.referral_codes)
  @JoinColumn({ name: 'user_telegram_id' })
  user: User;

  @OneToMany(() => ReferralUsage, referralUsage => referralUsage.referrer_code)
  referral_usages: ReferralUsage[];
}
