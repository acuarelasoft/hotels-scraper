import { Injectable, Logger } from '@nestjs/common';
import { KayakSearchDTO } from './kayak-search.dto';
import { ElementHandle, Page } from 'puppeteer';
import { BrowserService } from 'src/shared/browser-service';

@Injectable()
export class KayakScraper {
  private readonly logger = new Logger('kayak-com');

  constructor(private browserService: BrowserService) {}

  replaceUrlParams(url: string, searchDto: KayakSearchDTO): string {
    // https://www.kayak.com/hotels/Tulum,Quintana-Roo,Mexico-c49624/2021-06-12/2021-06-13/2adults
    // https://www.kayak.com/hotels/Cenote-Santa-Cruz-Tulum,Tulum,Mexico-c49625-l400866/2021-06-12/2021-06-13/3adults/2children-2-13/2rooms
    try {
      const dateRegex = /\d{4}-\d{2}-\d{2}/g;
      const dates = url.match(dateRegex);

      const [indate, outdate] = dates;

      if (searchDto.adults != '2') {
        url = url.replace('2adults', `${searchDto.adults}adults`)
      }

      if (searchDto.rooms != '1') {
        url = url + `/${searchDto.rooms}rooms`
      }

      return url
        .replace(indate, searchDto.inDate)
        .replace(outdate, searchDto.outDate);
    } catch (error) {
      const errMsg = `Error getting param url: ${error}`;
      this.logger.error(errMsg);
      throw new Error(errMsg);
    }
  }

  async getResultsPage(searchDto: KayakSearchDTO): Promise<Page> {
    try {
      const page = await this.getPage();

      await page.goto('https://www.kayak.com/stays', {
        waitUntil: 'domcontentloaded',
      });

      await page.waitForSelector('.form-section');

      await page.$('.form-container div[class$=inner]')
        .then(element => element.click());

      await page.waitForSelector('.k_my-input', { visible: true })
        .then(element => element.type(searchDto.destination));

      await page.waitForSelector('.ui-dialog-Popover ul li:first-child', { timeout: 3000 })
        .then(element => element.click());

      await page.$('.form-container button[type="submit"]')
        .then(button => button.click());

      await page.waitForNavigation({ waitUntil: 'load' });

      const url = await page.url();

      const urlParams = this.replaceUrlParams(url, searchDto);

      await page.goto(urlParams, {
        waitUntil: 'networkidle2'
      });

      return page;
    } catch (error) {
      const errMsg = `Error getting results page ${error}`;
      this.logger.error(errMsg);
      throw new Error(errMsg);
    }
  }

  async loadResults(page: Page, times: number) {
    if (times > 0) {
      for (let i = 0; i <= times; i++) {
        try {
          await page.waitForSelector('.ButtonPaginator.visible:not(.loading) .moreButton', { visible: true }).then(element => element.click());
          await page.waitForNavigation({ waitUntil: 'networkidle0' });
        } catch (error) {
          const errMsg = `Error loading results: ${error}`;
          this.logger.error(errMsg);
          throw new Error(errMsg);
        }
      }
    }
  }

  async getPage(): Promise<Page> {
    const browser = await this.browserService.getBrowserAsync();
    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });
    await page.setCacheEnabled(false);

    await page.setRequestInterception(true);

    page.on('request', (req) => {
      if (
        req.resourceType() == 'font' ||
        req.resourceType() == 'image'
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    return page;
  }

  async getHotelName(element: ElementHandle<Element>): Promise<string> {
    const nameHotelRaw = await element.$('div[class$="big-name"]');
    return await nameHotelRaw.evaluate(g => g.textContent);
  }

  async getMainPrice(element: ElementHandle<Element>) {
    const priceSectionElement = await element.$('div[class*="price-section"]');
    const providerElement = await priceSectionElement.$('div[class*="provider"]');
    const priceElement = await priceSectionElement.$('div[class*="price"]');

    return {
      provider: await providerElement.evaluate(e => e.textContent),
      price: await priceElement.evaluate(e => e.textContent)
    }
  }

  async getPrices(element: ElementHandle<Element>) {
    const prices = [];
    const priceContainerElements = await element.$$('div[class$="middleSection"] > div:nth-child(2) a');

    for (const priceContainerElement of priceContainerElements) {
      const providerElement = await priceContainerElement.$('div[class$="name"]');
      const priceElement = await priceContainerElement.$('div[class*="price"] div');

      prices.push({
        provider: await providerElement.evaluate(e => e.textContent),
        price: await priceElement.evaluate(e => e.textContent)
      });
    }

    return prices;
  }

  async getMorePrices(element: ElementHandle<Element>, page: Page) {
    const prices = [];
    const moreButton = await element.$('div[class$="middleSection"] button[class*="show-more"]');

    if (moreButton) {
      await moreButton.click();
      await page.waitForSelector('div[class*="dropdownContent"]');
      const items = await page.$$('div[class*="dropdownContent"] a');

      for (const item of items) {
        const priceElement = await item.$('div:nth-child(1)');
        const providerElement = await item.$('div:nth-child(2)');

        prices.push({
          provider: await providerElement.evaluate(e => e.textContent),
          price: await priceElement.evaluate(e => e.textContent)
        });
      }

      await moreButton.click();
    }

    return prices;
  }

  async parseHotel(hotelElement: ElementHandle<Element>) {
    const hotelName = this.getHotelName(hotelElement);
    const prices = await this.getPrices(hotelElement);

    return {
      hotelName,
      prices
    }
  }

  async parseHotels(page: Page, deepPrices = false) {
    const hotels = [];
    const list = await page.waitForSelector('.resultsList');
    const results = await list.$$('div[class$="resultInner"]');

    for (const item of results) {
      const hotelName = await this.getHotelName(item);
      const mainPrice = await this.getMainPrice(item);
      const prices = await this.getPrices(item);
      const morePrices = deepPrices ? await this.getMorePrices(item, page) : [];

      hotels.push({
        name: hotelName,
        prices: [
          mainPrice,
          ...prices,
          ...morePrices
        ]
      })
    }

    return hotels;
  }

  async search(searchDto: KayakSearchDTO) {
    let page: Page;
    let response;

    try {
      page = await this.getResultsPage(searchDto);
      await this.loadResults(page, +searchDto.loads);

      const hotels = await this.parseHotels(page, searchDto.deepprices == 'true' ? true : false);

      response = {
        meta: {
          count: hotels.length,
          status: 'ok'
        },
        results: hotels
      };
    } catch (error) {
      response = {
        meta: {
          count: 0,
          status: 'error',
          message: error,
        },
        results: []
      };
    }

    await page.close();
    return response;
  }
}
