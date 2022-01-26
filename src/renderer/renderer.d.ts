export interface IElectronAPI {
  ipcRenderer: any;
  paylocityLogin(arg0: {
    companyId: string;
    email: string;
    password: string;
  }): Promise<boolean>;
  challengeQuestion(answer: string): Promise<boolean>;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
