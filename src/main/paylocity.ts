import { Browser, chromium } from 'playwright';

export interface Credentials {
  companyId: string;

  username: string;

  password: string;
}
export interface LoginResult {
  loggedIn: boolean;

  message: string | undefined;
}

class Paylocity {
  private credentials: Credentials = {
    companyId: '',
    username: '',
    password: '',
  };

  private loggedIn: boolean = false;

  private browser!: Browser;

  // public async init() {
  //   this.browserVisible = await chromium.launch({
  //     headless: false,
  //     slowMo: 50,
  //   });
  //   const context = await this.browserVisible.newContext({
  //     storageState: 'state.json',
  //   });
  //   this.login();
  // }

  public async tryLogin(credentials: Credentials): Promise<LoginResult> {
    console.log(JSON.stringify(credentials));
    const status = await this.login(credentials);
    return status;
  }

  private async browserSetup() {
    this.browser = await chromium.launch({
      headless: false,
      slowMo: 50,
    });
    try {
      await this.browser.newContext({
        storageState: 'state.json',
      });
    } catch (err) {
      // first time
    }
  }

  private async login(
    credentials: Credentials = {
      companyId: this.credentials.companyId,
      username: this.credentials.username,
      password: this.credentials.password,
    }
  ): Promise<LoginResult> {
    await this.browserSetup();
    const page = await this.browser.newPage();
    const navigationPromise = page.waitForNavigation();
    let message;

    await page.goto('https://access.paylocity.com/');

    await page.waitForSelector('#CompanyId');
    await page.click('#CompanyId');

    await page.type('#CompanyId', credentials.companyId);

    await page.type('#Username', credentials.username);

    await page.type('#Password', credentials.password);

    await page.keyboard.press('Enter');

    await navigationPromise;

    try {
      const url = await page.url();
      console.log(url);
      await page.waitForURL(
        'https://login.paylocity.com/https://login.paylocity.com/**',
        { timeout: 2000 }
      );
      // browser already remembered
      message = '';
      return { loggedIn: true, message };
    } catch {
      const url = await page.url();
      console.log(url);
      // page.locator('text=Verify your identity');
      if (url === 'https://access.paylocity.com/ChallengeQuestion') {
        // <label for="ChallengeAnswer">This is the Challenge Question</label>
        console.log('url: challengequestion');
        message = await page.locator('[for="ChallengeAnswer"]').innerText();
        console.log(message);
        return { loggedIn: false, message };
      }
      message = 'Unknown error';
      return { loggedIn: false, message };
    }
  }

  public async ChallengeQuestion(): Promise<LoginResult> {
    await this.browserSetup();
    const page = await this.browser.newPage();
    const navigationPromise = page.waitForNavigation();
    try {
      await page.waitForSelector(
        '.c-header > .header-nav > .sub-menu > li:nth-child(5) > a'
      );
      await page.type('#ChallengeAnswer', '');
    } catch {
      return { loggedIn: false, message: 'Unsuccessful' };
    }

    // Save signed-in state to 'state.json'.
    await page.context().storageState({ path: 'state.json' });
    this.loggedIn = true;
    return { loggedIn: false, message: 'Success' };
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
export default Paylocity;
