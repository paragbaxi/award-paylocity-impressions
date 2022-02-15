import log from 'electron-log';
/* eslint-disable no-console */
import { Browser, chromium, Page } from 'playwright';

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

const paylocityImpressionsUrl =
  'https://login.paylocity.com/Escher/Escher_WebUI/EmployeeInformation/Impressions/Index/leaderboard';

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
    log.info(JSON.stringify(credentials));
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
      log.info('loaded state');
    } catch (e) {
      // first time
      log.info(`error: ${JSON.stringify(e)}`);
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
    log.info('paylocity.isLoggedIn()');
    let url;
    try {
      await this.page.goto(paylocityImpressionsUrl);
      url = await this.page.url();
      log.info(`isLoggedIn.url: ${url}`);
      if (url === 'https://access.paylocity.com/SignIn?fromSso=True') {
        await this.page.waitForNavigation();
        url = await this.page.url();
        log.info(`isLoggedIn.url after Sso=True: ${url}`);
      }
      // await this.page.waitForTimeout(30000); // pause
      if (
        url.includes('redirect_uri=') &&
        url.startsWith('https://access.paylocity.com/?')
      ) {
        try {
          log.info('matches redirect');
          await this.page.waitForNavigation();
          url = await this.page.url();
          log.info(`isLoggedIn.url: ${url}`);
          if (url === 'https://access.paylocity.com/SignIn?fromSso=True') {
            await this.page.waitForNavigation();
            url = await this.page.url();
            log.info(`isLoggedIn.url: ${url}`);
          } else {
            return false;
          }
        } catch (e) {
          log.error(`error: ${JSON.stringify(e)}`);
          log.info('At login with redirect.');
          return false;
        }
      }
      if (url.startsWith('https://access.paylocity.com/?')) {
        log.info('waiting...');
        await this.page.waitForURL(paylocityImpressionsUrl);
        url = await this.page.url();
        log.info(`isLoggedIn.url: ${url}`);
      }
      // await this.page.waitForTimeout(10000); // pause
    } catch (e) {
      log.error(`error: ${JSON.stringify(e)}`);
      return false;
    }
    url = await this.page.url();
    log.info(`url after paylocity.isLoggedIn.try: ${url}`);
    if (url === 'https://access.paylocity.com/SignIn?fromSso=True') {
      try {
        this.page.waitForNavigation();
        url = await this.page.url();
      } catch (e) {
        log.error(`error: ${JSON.stringify(e)}`);
        // await this.browser.stopTracing();
        return false;
      }
    }
    if (url.startsWith('https://login.paylocity.com/Escher')) {
      if (url !== paylocityImpressionsUrl) {
        await this.page.goto(paylocityImpressionsUrl);
      }
      this.successfulLoginTasks();
      return true;
    }
    log.info('end of isLoggedIn()');
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
    log.info(`loggedIn: ${loggedIn}`);

    if (loggedIn) {
      this.successfulLoginTasks();
      return {
        loggedIn: this.loggedIn,
        status: LoginStatus.Successful,
        message: 'Successful',
      };
    }

    url = await this.page.url();
    log.info(`url before startsWith: ${url}`);

    await inputLogin();

    url = await this.page.url();
    log.info(`url after inputLogin: ${url}`);
    if (url === 'https://access.paylocity.com/ChallengeQuestion') {
      // <label for="ChallengeAnswer">This is the Challenge Question</label>
      log.info('url: challengequestion');
      message = await this.page.locator('[for="ChallengeAnswer"]').innerText();
      log.info(message);
      return { loggedIn: false, status: LoginStatus.Challenge, message };
    }

    // check for incorrect pw
    const incorrectCredentials = url === 'https://access.paylocity.com/';
    log.info(`incorrectCredentials: ${JSON.stringify(incorrectCredentials)}`);
    if (incorrectCredentials) {
      log.info('Incorrect creds!');
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
    let url;
    try {
      await this.page.waitForSelector('#TrustThisDevice');
      const checked = await this.page.isChecked('#TrustThisDevice');
      if (!checked) await this.page.click('#TrustThisDevice');
      await this.page.type('#ChallengeAnswer', challengeAnswer);
      await this.page.click('text=Submit');

      url = await this.page.url();
      log.info(`url: ${url}`);
      if (url === 'https://access.paylocity.com/ChallengeQuestion') {
        // <label for="ChallengeAnswer">This is the Challenge Question</label>
        const message = await this.page
          .locator('[for="ChallengeAnswer"]')
          .innerText();
        log.info(message);
        this.loggedIn = false;
        return {
          loggedIn: this.loggedIn,
          status: LoginStatus.Challenge,
          message,
        };
      }

      await this.page.waitForURL('https://access.paylocity.com/**');
    } catch (e) {
      log.info(`error: ${JSON.stringify(e)}`);
      this.loggedIn = false;
      return {
        loggedIn: this.loggedIn,
        status: LoginStatus.Unsuccessful,
        message: 'Unsuccessful',
      };
    }

    url = await this.page.url();
    log.info(`tryChallenge.url after waitForUrl = ${url}`);
    if (url !== paylocityImpressionsUrl) {
      log.info('tryChallenge.url not at impressions');
      await this.page.waitForNavigation();
      url = await this.page.url();
      log.info(`tryChallenge.url.goto impressions = ${url}`);
      if (url === 'https://access.paylocity.com/SignIn?fromSso=True') {
        await this.page.waitForNavigation();
        url = await this.page.url();
        log.info(`tryChallenge.goto.waitForNavigation.url: ${url}`);
        await this.page.goto(paylocityImpressionsUrl);
      }
    }

    this.successfulLoginTasks();
    return {
      loggedIn: this.loggedIn,
      status: LoginStatus.Successful,
      message: 'Successful',
    };
  };

  public sendImpression = async (): Promise<boolean> => {
    let url;
    log.info(`loggedIn: ${this.loggedIn}`);
    if (!this.loggedIn) {
      await this.login();
      return false;
    }
    if (!this.browserImpressions) {
      this.browserImpressions = await chromium.launch({
        headless: false,
      });
    }

    try {
      this.pageImpressions = await this.browserImpressions.newPage({
        storageState: 'state.json',
      });
    } catch (e) {
      // first time
      log.info(`error: ${JSON.stringify(e)}`);
      this.pageImpressions = await this.browserImpressions.newPage();
      await this.pageImpressions.context().storageState({ path: 'state.json' });
    }

    url = await this.pageImpressions.url();
    log.info(`sendImpression.loadState.url: ${url}`);
    if (url !== paylocityImpressionsUrl) {
      await this.pageImpressions.goto(paylocityImpressionsUrl);
      log.info(`sendImpression.goto.url: ${url}`);
      if (url === 'https://access.paylocity.com/SignIn?fromSso=True') {
        await this.pageImpressions.waitForNavigation();
        url = await this.pageImpressions.url();
        log.info(`sendImpression.goto.waitForNavigation.url: ${url}`);
      }
    }

    url = await this.pageImpressions.url();
    if (url !== paylocityImpressionsUrl) {
      await this.pageImpressions.goto(paylocityImpressionsUrl);
    }
    await this.pageImpressions.click('text=Award Impressions');

    return true;
  };
}
export default Paylocity;
