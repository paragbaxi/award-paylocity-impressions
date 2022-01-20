import * as env from 'env-var';
import { Browser, chromium } from 'playwright';

class Paylocity {
  private loggedIn: boolean = false;

  private companyId: string = '';

  private username: string = '';

  private password: string = '';

  private browserVisible!: Browser;

  private browser!: Browser;

  public async init() {
    this.browserVisible = await chromium.launch({
      headless: false,
      slowMo: 50,
    });
    const context = await this.browserVisible.newContext({
      storageState: 'state.json',
    });
  }

  public async login() {
    const page = await this.browser.newPage();
    const navigationPromise = page.waitForNavigation();

    await page.goto('https://access.paylocity.com/');

    await page.waitForSelector('#CompanyId');
    await page.click('#CompanyId');

    await page.type(
      '#CompanyId',
      env.get('PAYLOCITY_COMPANY_ID').required().asIntPositive().toString()
    );

    await page.type(
      '#Username',
      env.get('PAYLOCITY_USERNAME').required().asString()
    );

    await page.type(
      '#Password',
      env.get('PAYLOCITY_PASSWORD').required().asString()
    );

    await page.keyboard.press('Enter');

    await navigationPromise;
    await navigationPromise;

    try {
      await page.waitForSelector(
        '.c-header > .header-nav > .sub-menu > li:nth-child(5) > a'
      );
    } catch {
      return false;
    }

    // Save signed-in state to 'state.json'.
    await page.context().storageState({ path: 'state.json' });
    this.loggedIn = true;
    return true;
  }

  public async sendImpression() {
    const page = await this.browser.newPage();
    const navigationPromise = page.waitForNavigation();
    await page.click(
      '.c-header > .header-nav > .sub-menu > li:nth-child(5) > a'
    );
    await navigationPromise;

    await page.waitForSelector(
      '.row > #panel-action-buttons > .type-cardtitle:nth-child(1) > .button > .hidden-xs'
    );

    await page.waitForTimeout(1000);
    await page.close();
    await this.browser.close();
  }
}
