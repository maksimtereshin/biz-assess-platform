import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Telegram ID is required' })
  @IsNumber({}, { message: 'Telegram ID must be a number' })
  @IsPositive({ message: 'Telegram ID must be positive' })
  telegramId: number;
}