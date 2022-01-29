import { Browser, chromium, Page } from 'playwright';

export interface Credentials {
  companyId: string;

  username: string;

  password: string;
}

export enum LoginStatus {
  Successful = 'SUCCESSFUL',
  Unsuccessful = 'UNSUCCESSFUL',
  Challenge = 'CHALLENGE',
  Locked = 'LOCKED',
}
export interface LoginResult {
  loggedIn: boolean;

  status: LoginStatus;

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

  private page!: Page;

  public async init() {
    await this.browserSetup();
  }

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
    this.page = await this.browser.newPage();
  }

  private async login(
    credentials: Credentials = {
      companyId: this.credentials.companyId,
      username: this.credentials.username,
      password: this.credentials.password,
    }
  ): Promise<LoginResult> {
    const { page } = this;
    let message;
    let url;

    await page.goto(
      'https://login.paylocity.com/Escher/Escher_WebUI/EmployeeInformation/Impressions/Index/leaderboard'
    );
    url = await page.url();
    await url;
    console.log(`url: ${url}`);
    if (
      url ===
      'https://login.paylocity.com/Escher/Escher_WebUI/EmployeeInformation/Impressions/Index/leaderboard'
    ) {
      this.loggedIn = true;
      return {
        loggedIn: this.loggedIn,
        status: LoginStatus.Successful,
        message: 'Successful',
      };
    }

    if (!url.startsWith('https://access.paylocity.com/')) {
      console.log(`url goto: ${url}`);
      await page.goto('https://access.paylocity.com/');
    }

    await page.waitForSelector('#CompanyId');
    await page.click('#CompanyId');

    await page.type('#CompanyId', credentials.companyId);

    await page.type('#Username', credentials.username);

    await page.type('#Password', credentials.password);

    await page.keyboard.press('Enter');

    // page.waitForResponse('https://access.paylocity.com/scripts/login.js?**');
    try {
      await page.waitForNavigation({ timeout: 3000 });
    } catch (e) {
      const incorrectCredentials = await page.locator(
        'text=The credentials provided are incorrect'
      );
      if (incorrectCredentials) {
        message = 'The credentials provided are incorrect';
        this.loggedIn = false;
        return {
          loggedIn: this.loggedIn,
          status: LoginStatus.Unsuccessful,
          message,
        };
      }
    }

    url = await page.url();

    try {
      console.log(url);
      await page.waitForURL(
        'https://login.paylocity.com/https://login.paylocity.com/**',
        { timeout: 2000 }
      );
      // browser already remembered
      message = '';
      this.loggedIn = true;
      return {
        loggedIn: this.loggedIn,
        status: LoginStatus.Successful,
        message,
      };
    } catch {
      url = await page.url();
      console.log(url);
      if (url === 'https://access.paylocity.com/ChallengeQuestion') {
        // <label for="ChallengeAnswer">This is the Challenge Question</label>
        console.log('url: challengequestion');
        message = await page.locator('[for="ChallengeAnswer"]').innerText();
        console.log(message);
        this.page = page;
        return { loggedIn: false, status: LoginStatus.Challenge, message };
      }
      message = 'Unknown error';
      this.loggedIn = false;
      return {
        loggedIn: this.loggedIn,
        status: LoginStatus.Unsuccessful,
        message,
      };
    }
  }

  public async tryChallenge(challengeAnswer: string): Promise<LoginResult> {
    const { page } = this;

    try {
      await page.type('#ChallengeAnswer', challengeAnswer);
      await page.keyboard.press('Enter');

      await page.waitForNavigation();

      const url = await page.url();
      console.log(`url: ${url}`);
      if (url === 'https://access.paylocity.com/ChallengeQuestion') {
        // <label for="ChallengeAnswer">This is the Challenge Question</label>
        const message = await page
          .locator('[for="ChallengeAnswer"]')
          .innerText();
        console.log(message);
        this.page = page;
        this.loggedIn = false;
        return {
          loggedIn: this.loggedIn,
          status: LoginStatus.Challenge,
          message,
        };
      }

      await page.waitForURL('https://access.paylocity.com/**');
    } catch (e) {
      console.log(e);
      this.loggedIn = false;
      return {
        loggedIn: this.loggedIn,
        status: LoginStatus.Unsuccessful,
        message: 'Unsuccessful',
      };
    }

    // Save signed-in state to 'state.json'.
    await page.context().storageState({ path: 'state.json' });
    this.loggedIn = true;
    return {
      loggedIn: this.loggedIn,
      status: LoginStatus.Successful,
      message: 'Successful',
    };
  }

  public async sendImpression(): Promise<boolean> {
    if (!this.loggedIn) {
      await this.login();
      return false;
    }
    const page = await this.browser.newPage();
    await page.waitForNavigation();
    await page.click(
      '.c-header > .header-nav > .sub-menu > li:nth-child(5) > a'
    );
    await page.waitForNavigation();

    await page.waitForSelector(
      '.row > #panel-action-buttons > .type-cardtitle:nth-child(1) > .button > .hidden-xs'
    );

    await page.waitForTimeout(1000);
    await page.close();
    await this.browser.close();
    return true;
  }
}
export default Paylocity;
