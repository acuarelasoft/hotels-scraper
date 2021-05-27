import { Test, TestingModule } from '@nestjs/testing';
import { BrowserService } from 'src/shared/browser-service';
import { SharedModule } from 'src/shared/shared.module';
import { KayakScraper } from './kayak-scraper';
import { KayakSearchDTO } from './kayak-search.dto';

describe('KayakScraper', () => {
  let module: TestingModule;
  let service: KayakScraper;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ SharedModule ],
      providers: [ KayakScraper ]
    }).compile();

    service = module.get<KayakScraper>(KayakScraper);
  })

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return results url', async () => {
    const dto = new KayakSearchDTO();
    dto.destination = 'tulum';

    // https://www.kayak.com/hotels/Cenote-Santa-Cruz-Tulum,Tulum,Mexico-c49625-l400866/2021-06-12/2021-06-13/3adults/2children-2-13/2rooms
    const resultsUrl = await service.getResultsPage(dto);

    expect(resultsUrl).toContain('hotels');
    expect(resultsUrl).toContain('adults')
    expect(resultsUrl).toBeTruthy();
  });

  it('should return url with changed parameters', () => {
    const dto = new KayakSearchDTO();
    dto.inDate = '2021-06-23';
    dto.outDate = '2021-06-29';
    dto.adults = '4';
    dto.rooms = '3';

    const url = 'https://www.kayak.com/hotels/Tulum,Quintana-Roo,Mexico-c49624/2021-06-12/2021-06-13/2adults';
    const newUrl = service.replaceUrlParams(url, dto);

    expect(newUrl).toContain(`${dto.adults}adults`);
    expect(newUrl).toContain(`${dto.rooms}rooms`);
    expect(newUrl).toContain(dto.inDate);
    expect(newUrl).toContain(dto.outDate);
  });

  it('should load results', async () => {
    // valid and updated kayak url
    const url = 'https://www.kayak.com.mx/hotels/Tulum,Quintana-Roo,Mexico-c49625/2021-07-06/2021-07-10/2adults';
    const page = await service.getPage();

    await page.goto(url, { waitUntil: 'networkidle0' });

    for (let i = 0; i < 5; i++) {
      await service.loadResults(page);
    }

    expect(page).toBeDefined();
  });

  afterEach(async () => {
    const browserService = module.get<BrowserService>(BrowserService);
    const browser = await browserService.getBrowserAsync();

    if (browser) {
      await browser.close();
    }
  });
});
