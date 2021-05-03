import { HttpModule } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SharedModule } from 'src/shared/shared.module';
import { BookingScraper } from './booking-scraper';

describe('BookingScraper', () => {
  let provider: BookingScraper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SharedModule, HttpModule],
      providers: [BookingScraper],
    }).compile();

    provider = module.get<BookingScraper>(BookingScraper);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
