const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    paylocityLogin(login) {
      ipcRenderer.send('paylocity-login', login);
    },
    on(channel, func) {
      const validChannels = [
        'ipc-example',
        'paylocity-login',
        'challenge-question',
        'challenge-answer',
        // 'login-successful',
      ];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    once(channel, func) {
      const validChannels = [
        'ipc-example',
        'paylocity-login',
        'challenge-question',
        'challenge-answer',
        // 'login-successful',
      ];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.once(channel, (event, ...args) => func(...args));
      }
    },
    async challengeQuestionOnce(channel, func) {
      const validChannels = ['challenge-question'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.once(channel, (event, ...args) => func(...args));
      }
    },
    challengeQuestion(question) {
      ipcRenderer.send('challenge-question', question);
    },
    challengeAnswer(answer) {
      ipcRenderer.send('challenge-answer', answer);
    },
    // loginSuccessful() {
    //   ipcRenderer.send('login-successful');
    // },
  },
});
