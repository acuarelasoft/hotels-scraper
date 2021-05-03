import { CacheInterceptor, CACHE_MANAGER, Controller, Get, HttpCode, Inject, Query, UseInterceptors } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { BookingScraper } from './booking-scraper';
import { SearchDto } from './search-dto';
import process from 'process';

@Controller('booking-com')
export class BookingComController {

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache, private scraper: BookingScraper) { }

  @Get()
  @UseInterceptors(CacheInterceptor)
  search(@Query() searchDTO: SearchDto) {
    try {
      return this.scraper.search(searchDTO);
    } catch (error) {
      process.exit(1);
    }
  }

  @Get('clean-cache')
  @HttpCode(200)
  reset() {
    this.cacheManager.reset();
  }
}
