import { Injectable } from '@nestjs/common';
import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

@Injectable()
export class BrowserService {
  private _browser: Browser;

  private async ensureBrowserInitialized() {
    if (this._browser == null) {
      this._browser = await puppeteer.use(StealthPlugin()).launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
  }

  async getPage(): Promise<Page> {
    await this.ensureBrowserInitialized();

    const page = await this._browser.newPage();
    await page.setCacheEnabled(false);
    await page.setViewport({ width: 1920, height: 1080 });
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

  async disponse(): Promise<void> {
    if (this._browser) {
      await this._browser.close();
      this._browser = null;
    }
  }
}
