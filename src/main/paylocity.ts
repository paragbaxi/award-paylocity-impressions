/* eslint-disable no-console */
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
      this.page = await this.browser.newPage({ storageState: 'state.json' });
    } catch (e) {
      // first time
      console.log(`error: ${JSON.stringify(e)}`);
    }
  }

  public async isLoggedIn(): Promise<boolean> {
    await this.page.goto(
      'https://login.paylocity.com/Escher/Escher_WebUI/EmployeeInformation/Impressions/Index/leaderboard'
    );
    const url = await this.page.url();
    await url;
    console.log(`url: ${url}`);
    if (
      url ===
      'https://login.paylocity.com/Escher/Escher_WebUI/EmployeeInformation/Impressions/Index/leaderboard'
    ) {
      await this.page.context().storageState({ path: 'state.json' });
      this.loggedIn = true;
      return true;
    }
    return false;
  }

  private async login(
    credentials: Credentials = {
      companyId: this.credentials.companyId,
      username: this.credentials.username,
      password: this.credentials.password,
    }
  ): Promise<LoginResult> {
    let message;
    let url;

    const loggedIn = await this.isLoggedIn();
    await loggedIn;
    if (loggedIn) {
      return {
        loggedIn: this.loggedIn,
        status: LoginStatus.Successful,
        message: 'Successful',
      };
    }

    url = await this.page.url();
    if (!url.startsWith('https://access.paylocity.com/')) {
      console.log(`url goto: ${url}`);
      await this.page.goto('https://access.paylocity.com/');
    }

    await this.page.waitForSelector('#CompanyId');
    await this.page.click('#CompanyId');
    await this.page.type('#CompanyId', credentials.companyId);
    await this.page.type('#Username', credentials.username);
    await this.page.type('#Password', credentials.password);
    await this.page.keyboard.press('Enter');

    // this.page.waitForResponse('https://access.paylocity.com/scripts/login.js?**');
    try {
      await this.page.waitForNavigation({ timeout: 3000 });
    } catch (e) {
      console.log(`error: ${JSON.stringify(e)}`);
      const incorrectCredentials = await this.page.locator(
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

    url = await this.page.url();

    try {
      console.log(url);
      await this.page.waitForURL(
        'https://login.paylocity.com/https://login.paylocity.com/**',
        { timeout: 2000 }
      );
      // browser already remembered
      await this.page.context().storageState({ path: 'state.json' });
      message = '';
      this.loggedIn = true;
      return {
        loggedIn: this.loggedIn,
        status: LoginStatus.Successful,
        message,
      };
    } catch (e) {
      console.log(`error: ${JSON.stringify(e)}`);
      url = await this.page.url();
      console.log(url);
      if (url === 'https://access.paylocity.com/ChallengeQuestion') {
        // <label for="ChallengeAnswer">This is the Challenge Question</label>
        console.log('url: challengequestion');
        message = await this.page
          .locator('[for="ChallengeAnswer"]')
          .innerText();
        console.log(message);
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
    try {
      await this.page.waitForSelector('#TrustThisDevice');
      await this.page.click('#TrustThisDevice');
      await this.page.type('#ChallengeAnswer', challengeAnswer);
      await this.page.keyboard.press('Enter');
      await this.page.waitForNavigation();

      const url = await this.page.url();
      console.log(`url: ${url}`);
      if (url === 'https://access.paylocity.com/ChallengeQuestion') {
        // <label for="ChallengeAnswer">This is the Challenge Question</label>
        const message = await this.page
          .locator('[for="ChallengeAnswer"]')
          .innerText();
        console.log(message);
        this.loggedIn = false;
        return {
          loggedIn: this.loggedIn,
          status: LoginStatus.Challenge,
          message,
        };
      }

      await this.page.waitForURL('https://access.paylocity.com/**');
    } catch (e) {
      console.log(`error: ${JSON.stringify(e)}`);
      this.loggedIn = false;
      return {
        loggedIn: this.loggedIn,
        status: LoginStatus.Unsuccessful,
        message: 'Unsuccessful',
      };
    }

    // Save signed-in state to 'state.json'.
    await this.page.context().storageState({ path: 'state.json' });
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
    await this.page.waitForNavigation();
    await this.page.click(
      '.c-header > .header-nav > .sub-menu > li:nth-child(5) > a'
    );
    await this.page.waitForNavigation();

    await this.page.waitForSelector(
      '.row > #panel-action-buttons > .type-cardtitle:nth-child(1) > .button > .hidden-xs'
    );

    await this.page.waitForTimeout(1000);
    await this.page.close();
    await this.browser.close();
    return true;
  }
}
export default Paylocity;
