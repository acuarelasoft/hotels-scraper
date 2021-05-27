import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { BookingComModule } from './booking-com/booking-com.module';
import { SharedModule } from './shared/shared.module';
import { KayakModule } from './kayak/kayak.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    BookingComModule,
    SharedModule,
    KayakModule
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
