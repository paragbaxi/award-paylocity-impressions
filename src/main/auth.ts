import { BrowserWindow } from 'electron';

import { LoginDetails, PaylocityLoginStatus } from '../interfaces';
import Paylocity, { LoginStatus } from './paylocity';

const auth = async (
  mainWindow: BrowserWindow | null,
  paylocity: Paylocity,
  loginDetails: LoginDetails
) => {
  if (!mainWindow) return;
  console.log(`loginDetails: ${JSON.stringify(loginDetails)}`);
  if (loginDetails.status === PaylocityLoginStatus.Login) {
    if (!loginDetails.credentials) return;
    const loginResult = await paylocity.tryLogin(loginDetails.credentials);
    await loginResult;
    console.log(`loginResult: ${JSON.stringify(loginResult)}`);
    if (loginResult.status === LoginStatus.Challenge) {
      if (!loginResult.message) return;
      mainWindow.webContents.send('paylocity-login', {
        status: PaylocityLoginStatus.ChallengeLogin,
        challenge: loginResult.message,
      });
      return;
    }
    if (loginResult.status === LoginStatus.Successful) {
      mainWindow.webContents.send('paylocity-login', {
        status: PaylocityLoginStatus.Login,
        challenge: 'logged in',
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
    console.log(loginDetails.challenge);
    const loginResult = await paylocity.tryChallenge(loginDetails.challenge);
    await loginResult;
    console.log(JSON.stringify(loginResult));
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
  }
};

export default auth;
