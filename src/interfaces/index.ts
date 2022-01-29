import { Credentials } from 'main/paylocity';

export enum PaylocityLoginStatus {
  Login = 'LOGIN',
  Logout = 'LOGOUT',
  ChallengeLogin = 'CHALLENGE_LOGIN',
}

export interface LoginDetails {
  status: PaylocityLoginStatus;
  credentials?: Credentials;
  challenge?: string;
}

export enum IpcChannels {
  PaylocityLogin = 'PAYLOCITY_LOGIN',
}
