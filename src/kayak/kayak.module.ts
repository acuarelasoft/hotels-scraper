import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { KayakScraper } from './kayak-scraper';
import { KayakController } from './kayak.controller';

@Module({
  imports: [ SharedModule ],
  controllers: [KayakController],
  providers: [
    KayakScraper
  ]
})
export class KayakModule {}
