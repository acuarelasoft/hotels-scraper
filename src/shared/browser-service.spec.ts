import { Test, TestingModule } from '@nestjs/testing';
import { BrowserService } from './browser-service';

describe('BrowserService', () => {
  let provider: BrowserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BrowserService],
    }).compile();

    provider = module.get<BrowserService>(BrowserService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
