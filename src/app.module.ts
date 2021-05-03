import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { BookingComModule } from './booking-com/booking-com.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [BookingComModule, SharedModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
