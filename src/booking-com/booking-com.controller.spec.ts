import { Test, TestingModule } from '@nestjs/testing';
import { BookingComController } from './booking-com.controller';

describe('BookingComController', () => {
  let controller: BookingComController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingComController],
    }).compile();

    controller = module.get<BookingComController>(BookingComController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
