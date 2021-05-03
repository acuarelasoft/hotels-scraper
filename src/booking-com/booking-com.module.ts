import { CacheModule, HttpModule, Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { BookingScraper } from './booking-scraper';
import { BookingComController } from './booking-com.controller';

@Module({
  imports: [
    HttpModule,
    SharedModule,
    CacheModule.register({
      ttl: 84400
    })
  ],
  providers: [BookingScraper],
  exports: [BookingScraper],
  controllers: [BookingComController],
})
export class BookingComModule {}
