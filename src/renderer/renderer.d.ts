export interface IElectronAPI {
  ipcRenderer: any;
  paylocityLogin(arg0: {
    companyId: string;
    email: string;
    password: string;
  }): Promise<boolean>;
  challengeQuestion(question: string): Promise<boolean>;
  challengeAnswer(answer: string): Promise<boolean>;
  // loginSuccessful(): void;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
