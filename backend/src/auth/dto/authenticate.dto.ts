import { IsNotEmpty, IsString, IsEnum, MinLength, MaxLength } from 'class-validator';
import { SurveyType } from 'bizass-shared';

export class AuthenticateDto {
  @IsNotEmpty({ message: 'Token is required' })
  @IsString({ message: 'Token must be a string' })
  @MinLength(10, { message: 'Token is too short' })
  @MaxLength(1000, { message: 'Token is too long' })
  token: string;

  @IsNotEmpty({ message: 'Survey type is required' })
  @IsEnum(SurveyType, { message: 'Invalid survey type' })
  surveyType: SurveyType;
}