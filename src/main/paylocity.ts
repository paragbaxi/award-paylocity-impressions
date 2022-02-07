/* eslint-disable no-console */
import { Browser, chromium, Page } from 'playwright';

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

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
  public credentials: Credentials = {
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
      headless: !isDevelopment,
      slowMo: 50,
    });
    try {
      this.page = await this.browser.newPage({ storageState: 'state.json' });
    } catch (e) {
      // first time
      console.log(`error: ${JSON.stringify(e)}`);
      this.page = await this.browser.newPage();
      await this.page.context().storageState({ path: 'state.json' });
    }
  }

  private async successfulLoginTasks(): Promise<void> {
    this.loggedIn = true;
    this.page.context().storageState({ path: 'state.json' });
  }

  public async isLoggedIn(): Promise<boolean> {
    console.log('isLoggedIn()');
    // await this.browser.startTracing(this.page, {
    //   path: `trace-${Date.now()}.json`,
    //   screenshots: true,
    // });
    try {
      await this.page.goto(
        'https://login.paylocity.com/Escher/Escher_WebUI/EmployeeInformation/Impressions/Index/leaderboard',
        { waitUntil: 'networkidle' }
      );
      const url = await this.page.url();
      console.log(`url: ${url}`);
      // console.log('waiting...');
      // await this.page.waitForTimeout(10000);
    } catch (e) {
      console.log(`error: ${JSON.stringify(e)}`);
      // await this.browser.stopTracing();
      return false;
    }
    await this.page.reload();
    const url = await this.page.url();
    console.log(`url: ${url}`);
    if (url.startsWith('https://login.paylocity.com/Escher')) {
      this.successfulLoginTasks();
      // await this.browser.stopTracing();
      return true;
    }
    // await this.browser.stopTracing();
    return false;
  }

  private async login(
    credentials: Credentials = {
      companyId: this.credentials.companyId,
      username: this.credentials.username,
      password: this.credentials.password,
    }
  ): Promise<LoginResult> {
    this.credentials.companyId = credentials.companyId;
    this.credentials.username = credentials.username;
    this.credentials.password = credentials.password;

    let message;
    let url;

    const inputLogin = async () => {
      await this.page.waitForSelector('#CompanyId');
      await this.page.click('#CompanyId');
      await this.page.type('#CompanyId', credentials.companyId);
      await this.page.type('#Username', credentials.username);
      await this.page.type('#Password', credentials.password);
      await this.page.click('text=Login');
    };

    const loggedIn = await this.isLoggedIn();
    console.log(`loggedIn: ${loggedIn}`);

    if (loggedIn) {
      return {
        loggedIn: this.loggedIn,
        status: LoginStatus.Successful,
        message: 'Successful',
      };
    }

    url = await this.page.url();
    console.log(`url before startsWith: ${url}`);

    await inputLogin();

    url = await this.page.url();
    console.log(`url after inputLogin: ${url}`);
    if (url === 'https://access.paylocity.com/ChallengeQuestion') {
      // <label for="ChallengeAnswer">This is the Challenge Question</label>
      console.log('url: challengequestion');
      message = await this.page.locator('[for="ChallengeAnswer"]').innerText();
      console.log(message);
      return { loggedIn: false, status: LoginStatus.Challenge, message };
    }

    // check for incorrect pw
    const incorrectCredentials = await this.page.locator(
      'text=The credentials provided are incorrect'
    );
    console.log(
      `incorrectCredentials: ${JSON.stringify(incorrectCredentials)}`
    );
    if (incorrectCredentials) {
      console.log('Incorrect creds!');
      message = 'The credentials provided are incorrect';
      this.loggedIn = false;
      return {
        loggedIn: this.loggedIn,
        status: LoginStatus.Unsuccessful,
        message,
      };
    }

    // try one more time
    const tryAgain = await this.isLoggedIn();
    if (tryAgain) {
      message = '';
      return {
        loggedIn: this.loggedIn,
        status: LoginStatus.Successful,
        message,
      };
    }

    message = 'Unknown error';
    this.loggedIn = false;
    return {
      loggedIn: this.loggedIn,
      status: LoginStatus.Unsuccessful,
      message,
    };
  }

  public async tryChallenge(challengeAnswer: string): Promise<LoginResult> {
    try {
      await this.page.waitForSelector('#TrustThisDevice');
      const checked = await this.page.isChecked('#TrustThisDevice');
      if (!checked) await this.page.click('#TrustThisDevice');
      await this.page.type('#ChallengeAnswer', challengeAnswer);
      await this.page.click('text=Submit');

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

    this.successfulLoginTasks();
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
