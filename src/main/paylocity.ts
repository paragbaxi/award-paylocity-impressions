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

  private browserImpressions!: Browser;

  private pageImpressions!: Page;

  public init = async () => {
    await this.browserSetup();
  };

  public tryLogin = async (credentials: Credentials): Promise<LoginResult> => {
    console.log(JSON.stringify(credentials));
    const status = await this.login(credentials);
    return status;
  };

  private browserSetup = async () => {
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
    // this.page = await this.browser.newPage();
  };

  private successfulLoginTasks = async (): Promise<void> => {
    this.loggedIn = true;
    this.page.context().storageState({ path: 'state.json' });
  };

  public isLoggedIn = async (): Promise<boolean> => {
    console.log('paylocity.isLoggedIn()');
    let url;
    try {
      await this.page.goto(
        'https://login.paylocity.com/Escher/Escher_WebUI/EmployeeInformation/Impressions/Index/leaderboard'
      );
      url = await this.page.url();
      console.log(`isLoggedIn.url: ${url}`);
      // await this.page.waitForTimeout(30000); // pause
      if (
        url.includes('redirect_uri=') &&
        url.startsWith('https://access.paylocity.com/?')
      ) {
        try {
          console.log('matches redirect');
          await this.page.waitForNavigation();
          url = await this.page.url();
          console.log(`isLoggedIn.url: ${url}`);
          if (url === 'https://access.paylocity.com/SignIn?fromSso=True') {
            await this.page.waitForNavigation();
            url = await this.page.url();
            console.log(`isLoggedIn.url: ${url}`);
          }
        } catch (e) {
          console.error(`error: ${JSON.stringify(e)}`);
          console.log('At login with redirect.');
          return false;
        }
      }
      if (url.startsWith('https://access.paylocity.com/?')) {
        console.log('waiting...');
        await this.page.waitForURL(
          'https://login.paylocity.com/Escher/Escher_WebUI/EmployeeInformation/Impressions/Index/leaderboard'
        );
        url = await this.page.url();
        console.log(`isLoggedIn.url: ${url}`);
      }
      // await this.page.waitForTimeout(10000); // pause
    } catch (e) {
      console.error(`error: ${JSON.stringify(e)}`);
      return false;
    }
    url = await this.page.url();
    console.log(`url after paylocity.isLoggedIn.try: ${url}`);
    if (url === 'https://access.paylocity.com/SignIn?fromSso=True') {
      try {
        this.page.waitForNavigation();
        url = await this.page.url();
      } catch (e) {
        console.error(`error: ${JSON.stringify(e)}`);
        // await this.browser.stopTracing();
        return false;
      }
    }
    if (url.startsWith('https://login.paylocity.com/Escher')) {
      this.successfulLoginTasks();
      return true;
    }
    console.log('end of isLoggedIn()');
    return false;
  };

  private login = async (
    credentials: Credentials = {
      companyId: this.credentials.companyId,
      username: this.credentials.username,
      password: this.credentials.password,
    }
  ): Promise<LoginResult> => {
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
      this.successfulLoginTasks();
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
    const incorrectCredentials = url === 'https://access.paylocity.com/';
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
  };

  public tryChallenge = async (
    challengeAnswer: string
  ): Promise<LoginResult> => {
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
  };

  public sendImpression = async (): Promise<boolean> => {
    console.log(`loggedIn: ${this.loggedIn}`);
    if (!this.loggedIn) {
      await this.login();
      return false;
    }
    this.browserImpressions = await chromium.launch({
      headless: false,
    });

    try {
      this.pageImpressions = await this.browserImpressions.newPage({
        storageState: 'state.json',
      });
    } catch (e) {
      // first time
      console.log(`error: ${JSON.stringify(e)}`);
      this.pageImpressions = await this.browserImpressions.newPage();
      await this.pageImpressions.context().storageState({ path: 'state.json' });
    }

    await this.pageImpressions.goto(
      'https://login.paylocity.com/Escher/Escher_WebUI/EmployeeInformation/Impressions/Index/leaderboard'
    );

    await this.pageImpressions.click('text=Award Impressions');

    return true;
  };
}
export default Paylocity;
