import { Credentials } from 'main/paylocity';

import { LoginDetails } from '../interfaces';

export interface IElectronAPI {
  ipcRenderer: any;
  paylocityLogin(loginDetails: LoginDetails): Promise<boolean>;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
