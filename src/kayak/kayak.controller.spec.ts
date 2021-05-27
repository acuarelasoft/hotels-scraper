import { Test, TestingModule } from '@nestjs/testing';
import { KayakController } from './kayak.controller';

describe('KayakController', () => {
  let controller: KayakController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KayakController],
    }).compile();

    controller = module.get<KayakController>(KayakController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
