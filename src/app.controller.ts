import { Controller, Get } from '@nestjs/common';
import { BookingScraper } from './booking-com/booking-scraper';

@Controller()
export class AppController {
  constructor(private readonly bookingScraper: BookingScraper) {}

  @Get()
  main() {
    return 'hotels API';
  }
}
