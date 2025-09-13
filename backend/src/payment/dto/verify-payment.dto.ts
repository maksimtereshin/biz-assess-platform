import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MinLength,
  MaxLength,
} from "class-validator";

export class VerifyPaymentDto {
  @IsNotEmpty({ message: "Charge ID is required" })
  @IsString({ message: "Charge ID must be a string" })
  @MinLength(1, { message: "Charge ID cannot be empty" })
  @MaxLength(100, { message: "Charge ID is too long" })
  chargeId: string;

  @IsNotEmpty({ message: "Payment ID is required" })
  @IsUUID(4, { message: "Payment ID must be a valid UUID" })
  paymentId: string;
}
