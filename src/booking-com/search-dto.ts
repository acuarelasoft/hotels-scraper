import { IsDateString, IsNumberString, IsNotEmpty, IsOptional } from 'class-validator';

export class SearchDto {
  @IsDateString()
  inDate: string;

  @IsDateString()
  outDate: string;

  @IsOptional()
  @IsNumberString()
  adults = '2';

  @IsOptional()
  @IsNumberString()
  rooms = '1';

  @IsNotEmpty()
  destination: string;
}
