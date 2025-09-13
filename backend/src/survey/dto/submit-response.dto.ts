import { IsNotEmpty, IsString, IsUUID, IsObject, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class SurveyResponseItemDto {
  @IsNotEmpty({ message: 'Question ID is required' })
  @IsString({ message: 'Question ID must be a string' })
  questionId: string;

  @IsNotEmpty({ message: 'Answer is required' })
  answer: any;
}

export class SubmitSurveyResponseDto {
  @IsNotEmpty({ message: 'Session ID is required' })
  @IsUUID(4, { message: 'Session ID must be a valid UUID' })
  sessionId: string;

  @IsNotEmpty({ message: 'Responses are required' })
  @IsArray({ message: 'Responses must be an array' })
  @ValidateNested({ each: true })
  @Type(() => SurveyResponseItemDto)
  responses: SurveyResponseItemDto[];
}