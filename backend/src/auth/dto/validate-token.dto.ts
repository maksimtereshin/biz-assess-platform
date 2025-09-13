import { IsNotEmpty, IsString, MinLength, MaxLength } from "class-validator";

export class ValidateTokenDto {
  @IsNotEmpty({ message: "Token is required" })
  @IsString({ message: "Token must be a string" })
  @MinLength(10, { message: "Token is too short" })
  @MaxLength(1000, { message: "Token is too long" })
  token: string;
}
