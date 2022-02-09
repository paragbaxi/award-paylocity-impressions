import Store from 'electron-store';

import { Credentials } from './paylocity';

const store = new Store<Credentials>({
  encryptionKey: 'boogily oogily',
  defaults: { companyId: '', username: '', password: '' },
});

export const getCreds = (): Credentials => {
  const creds = store.get('creds');
  return creds as Credentials;
};

export const setCreds = (creds: Credentials) => {
  return store.set('creds', creds);
};
