import { IsDateString, IsNumberString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BookingSearchDTO {
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
}
