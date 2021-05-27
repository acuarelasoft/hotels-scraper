import { Controller, Get, Query } from '@nestjs/common';
import { KayakScraper } from './kayak-scraper';
import { KayakSearchDTO } from './kayak-search.dto';
import process from 'process';

@Controller('kayak-com')
export class KayakController {

  constructor(private scraper: KayakScraper) { }

  @Get()
  search(@Query() searchDTO: KayakSearchDTO) {
    try {
      return this.scraper.search(searchDTO);
    } catch (error) {
      process.exit(1);
    }
  }
}
