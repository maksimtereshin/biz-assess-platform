import { IsNotEmpty, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreatePaymentDto {
  @IsNotEmpty({ message: 'User ID is required' })
  @IsNumber({}, { message: 'User ID must be a number' })
  @IsPositive({ message: 'User ID must be positive' })
  userId: number;

  @IsNotEmpty({ message: 'Session ID is required' })
  @IsUUID(4, { message: 'Session ID must be a valid UUID' })
  sessionId: string;
}