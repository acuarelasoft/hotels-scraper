import { HttpService, Injectable, Logger } from '@nestjs/common';
import { BrowserService } from 'src/shared/browser-service';
import { Hotel } from 'src/shared/hotel.interface';
import { Page } from 'puppeteer';
import { SearchDto } from './search-dto';
import * as cheerio from 'cheerio';
import { map } from 'rxjs/operators';

@Injectable()
export class BookingScraper {
  private readonly logger = new Logger('booking-com');

  constructor(private browserService: BrowserService, private httpService: HttpService) {}

  async sendSearchForm(page: Page, searchDto: SearchDto): Promise<void> {
    page.goto('https://www.booking.com/searchresults.html?selected_currency=USD', {
      waitUntil: 'domcontentloaded',
    });

    const inDate = new Date(`${searchDto.inDate}T00:00:00`);
    const outDate = new Date(`${searchDto.outDate}T00:00:00`);

    await page.waitForSelector('#ss')
      .then(element => element.type(searchDto.destination, { delay: 120 }));
    await page.waitForSelector('#frm > div:nth-child(9) > div > div.sb-dates__grid.u-clearfix > div.sb-dates__col.--checkin-field.xp__date-time > div > div > div > div.sb-date-field__controls.sb-date-field__controls__ie-fix > div.sb-date-field__select.-month-year.js-date-field__part > select')
      .then(element => { element.select(`${inDate.getMonth()}-${inDate.getFullYear()}`) });
    await page.waitForSelector('#frm > div:nth-child(9) > div > div.sb-dates__grid.u-clearfix > div.sb-dates__col.--checkin-field.xp__date-time > div > div > div > div.sb-date-field__controls.sb-date-field__controls__ie-fix > div.sb-date-field__select.-day.js-date-field__part > select')
      .then(element => { element.select(`${inDate.getDate()}`) });
    await page.waitForSelector('#frm > div:nth-child(9) > div > div.sb-dates__grid.u-clearfix > div.sb-dates__col.--checkout-field.xp__date-time > div > div > div > div.sb-date-field__controls.sb-date-field__controls__ie-fix > div.sb-date-field__select.-month-year.js-date-field__part > select')
      .then(element => { element.select(`${outDate.getMonth()}-${outDate.getFullYear()}`) });
    await page.waitForSelector('#frm > div:nth-child(9) > div > div.sb-dates__grid.u-clearfix > div.sb-dates__col.--checkout-field.xp__date-time > div > div > div > div.sb-date-field__controls.sb-date-field__controls__ie-fix > div.sb-date-field__select.-day.js-date-field__part > select')
      .then(element => { element.select(`${outDate.getDate()}`) });

    if (+searchDto.adults > 2) {
      await page.waitForSelector('#group_adults')
        .then(element => element.select(searchDto.adults));
    }

    if (+searchDto.rooms > 1) {
      await page.waitForSelector('#no_rooms')
        .then(element => element.select(searchDto.rooms));
    }

    await page.waitForSelector('.sb-searchbox__button')
      .then(button => button.click());

    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });
  }

  getPaginationMarkup(page: Page): Promise<string> {
    return page.evaluate(() => {
      const element = document.querySelector('.bui-pagination');
      return element ? element.innerHTML : '';
    });
  }

  async getUrlsFromPagination(page: Page): Promise<string[]> {
    let paginationMarkup: string;

    try {
      paginationMarkup = await this.getPaginationMarkup(page);
    } catch (error) {
      this.logger.error(`Error getting pagination: ${error}`);
      return [];
    }

    return this.parsePagination(paginationMarkup);
  }

  parsePagination(paginationMarkup: string): string[] {
    const $ = cheerio.load(paginationMarkup);
    const href = $('.bui-pagination__list li:first-child a').attr('href');
    const npages = $('.bui-pagination__list li:last-child a .bui-u-inline').text();

    if (!href || !npages) {
      this.logger.warn(`without pagination markup`);
      return [];
    }

    const urls: string[] = [];
    const pageSize = 25;

    for (let i = 0; i < +npages; i++) {
      const skip = i * pageSize;
      urls.push(`https://www.booking.com${href}&selected_currency=USD&offset=${skip}`);
    }

    return urls;
  }

  parseContent(content: string, pageNumber: number): Hotel[] {
    const $ = cheerio.load(content);
    const $hotels = $('.sr_item_content');
    const priceRegex = /\d+,?\d*/;
    const nRegex = /\n/gi;
    const hotels = [];

    if ($hotels.length <= 0) {
      this.logger.warn('markup without hotels info');
      return [];
    }

    $hotels.each((index, element) => {
      const $e = $(element);
      const name = $e.find('.sr-hotel__name').text().replace(nRegex, '');
      const score = $e.find('.bui-review-score__badge').text().trim();
      const review = $e.find('.bui-review-score__title').text().replace(nRegex, '').trim();
      const originalPrice = $e.find('.bui-price-display__value').text().replace(nRegex, '').trim();
      const originalTax = $e.find('.prd-taxes-and-fees-under-price').text().replace(nRegex, '').trim();
      const matchPrice = originalPrice.match(priceRegex);
      const matchTax = originalTax.match(priceRegex);
      let price = '0';
      let tax = '0';

      if (matchPrice) {
        price = matchPrice[0].replace(',', '');
      }

      if (matchTax) {
        tax = matchTax[0].replace(',', '');
      }

      hotels.push({
        name,
        score,
        review,
        price,
        originalPrice,
        tax,
        originalTax,
        pageNumber: pageNumber.toString()
      });
    });

    return hotels;
  }

  getContentFromUrl(url: string): Promise<string> {
    return this.httpService.get<string>(url, {
      headers: {
        "Host": "www.booking.com",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": 1
      }
    }).pipe(
      map(res => res.data)
    ).toPromise();
  }

  async trySendSearchForm(page: Page, searchDto: SearchDto) {
    let attempts = 0;
    let err;

    while (attempts < 3) {
      try {
        await this.sendSearchForm(page, searchDto);
        return;
      } catch (error) {
        attempts++;
        err = error;
      }
    }

    throw err;
  }

  async tryGetContentFromUrl(url: string): Promise<string> {
    let attempts = 0;
    let err;

    while (attempts < 3) {
      try {
        const content = await this.getContentFromUrl(url);
        return content;
      } catch (error) {
        attempts++;
        err = error;
      }
    }

    throw err;
  }

  async search(searchDto: SearchDto) {
    let hotels: Hotel[] = [];
    let urls: string[] = [];
    let page: Page;

    try {
      page = await this.browserService.getPage();
      await this.trySendSearchForm(page, searchDto);
    } catch (error) {
      this.logger.error(`Fatal: ${error}`);
      await page.close();
      await this.browserService.disponse();

      return {
        error: `Error sending search form: ${error}`
      }
    }

    urls = await this.getUrlsFromPagination(page);
    page.close();

    if (urls.length == 0) {
      urls.push(page.url());
    }

    const promises = urls.map(async (url, index) => {
      try {
        const content = await this.tryGetContentFromUrl(url);
        return this.parseContent(content, index + 1);
      } catch (error) {
        this.logger.error(`Error getting hotels info: ${error}`);
        return [];
      }
    });

    hotels = (await Promise.all(promises)).flat();

    return {
      meta: {
        count: hotels.length,
        pages: urls.length
      },
      results: hotels
    };
  }
}
