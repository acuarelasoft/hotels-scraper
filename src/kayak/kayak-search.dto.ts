import { IsNumberString, IsNotEmpty, IsOptional, IsString, IsDateString, IsBooleanString } from 'class-validator';

export class KayakSearchDTO {
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
  @IsString()
  destination: string;

  @IsNumberString()
  loads = '0';

  @IsBooleanString()
  deepprices = 'false'
}
