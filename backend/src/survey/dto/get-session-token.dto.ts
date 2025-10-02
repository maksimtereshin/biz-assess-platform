import { IsString, IsNotEmpty } from 'class-validator';

export class GetSessionTokenDto {
  @IsString()
  @IsNotEmpty()
  initData: string;
}
