/* eslint-disable no-console */
import { BrowserWindow } from 'electron';

import { LoginDetails, PaylocityLoginStatus } from '../interfaces';
import { setCreds } from './credentials';
import Paylocity, { LoginStatus } from './paylocity';

const auth = async (
  mainWindow: BrowserWindow | null,
  paylocity: Paylocity,
  loginDetails: LoginDetails
) => {
  if (!mainWindow) return;
  console.log(`loginDetails: ${JSON.stringify(loginDetails)}`);
  if (
    !loginDetails.challenge &&
    (loginDetails.credentials?.password === '' || !loginDetails.credentials)
  ) {
    mainWindow.show();
    return;
  }
  if (loginDetails.status === PaylocityLoginStatus.Login) {
    if (!loginDetails.credentials) return;
    const loginResult = await paylocity.tryLogin(loginDetails.credentials);
    await loginResult;
    console.log(`loginResult: ${JSON.stringify(loginResult)}`);
    if (loginResult.status === LoginStatus.Successful) {
      mainWindow.webContents.send('paylocity-login', {
        status: PaylocityLoginStatus.Login,
        challenge: 'logged in',
      });
      console.log(
        `paylocity.credentials: ${JSON.stringify(paylocity.credentials)}`
      );
      if (paylocity.credentials) setCreds(paylocity.credentials);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      mainWindow.hide();
      return;
    }
    mainWindow.show();
    if (loginResult.status === LoginStatus.Challenge) {
      if (!loginResult.message) return;
      mainWindow.webContents.send('paylocity-login', {
        status: PaylocityLoginStatus.ChallengeLogin,
        challenge: loginResult.message,
      });
      return;
    }
    if (loginResult.status === LoginStatus.Unsuccessful) {
      mainWindow.webContents.send('paylocity-login', {
        status: PaylocityLoginStatus.Login,
        challenge: 'Unsuccessful',
      });
      return;
    }
  }
  if (loginDetails.status === PaylocityLoginStatus.ChallengeLogin) {
    if (!loginDetails.challenge) return;
    console.log(
      `loginDetails.challenge: ${JSON.stringify(loginDetails.challenge)}`
    );
    const loginResult = await paylocity.tryChallenge(loginDetails.challenge);
    await loginResult;
    console.log(`loginResult: ${JSON.stringify(loginResult)}`);
    if (!loginResult.loggedIn) {
      mainWindow.webContents.send('paylocity-login', {
        status: PaylocityLoginStatus.ChallengeLogin,
        challenge: loginResult.message,
      });
      return;
    }
    mainWindow.webContents.send('paylocity-login', {
      status: PaylocityLoginStatus.ChallengeLogin,
      challenge: 'logged in',
    });
    await new Promise((resolve) => setTimeout(resolve, 3000));
    mainWindow.hide();
  }
};

export default auth;
