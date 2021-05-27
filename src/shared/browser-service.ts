import { Injectable, Logger } from '@nestjs/common';
import { Page, Browser } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

@Injectable()
export class BrowserService {
  private readonly logger = new Logger('BrowserService');
  private browser: Browser;
  private headless: boolean;

  constructor() {
    this.headless = process.env.HEADLESS === 'true' ? true : false ;
  }

  private async ensurebrowserInitializedAsync() {
    if (this.browser == null) {
      this.browser = await puppeteer.use(StealthPlugin()).launch({
        headless: this.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      this.browser.on('disconnected', () => {
        this.logger.error(`Browser disconnected`);
        this.browser = null;
      });
    }
  }

  async getBrowserAsync(): Promise<Browser> {
    await this.ensurebrowserInitializedAsync();
    return this.browser;
  }

  async getPage(): Promise<Page> {
    await this.ensurebrowserInitializedAsync();

    const page = await this.browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setCacheEnabled(false);

    await page.setRequestInterception(true);

    page.on('request', (req) => {
      if (
        req.resourceType() == 'stylesheet' ||
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
}
