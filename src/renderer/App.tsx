import 'bootswatch/dist/minty/bootstrap.min.css';
import './App.css';
import 'bootstrap';

import { MemoryRouter as Router, Route, Routes } from 'react-router-dom';

import icon from '../../assets/icon.svg';

const Hello = () => {
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    const formData = new FormData(event.currentTarget);
    event.preventDefault();
    window.electron.ipcRenderer.paylocityLogin({
      companyId: formData.get('companyId'),
      email: formData.get('email'),
      password: formData.get('password'),
    });
  };
  return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <h1>Login</h1>
        <div className="mb-3">
          <label htmlFor="InputCompanyId" className="form-label">
            Company ID
            <input
              type="text"
              className="form-control"
              id="InputCompanyId"
              placeholder="Enter your Company ID"
              name="companyId"
            />
          </label>
        </div>
        <div className="mb-3">
          <label htmlFor="InputEmail" className="form-label">
            Email address
            <input
              type="email"
              className="form-control"
              id="InputEmail"
              aria-describedby="emailHelp"
              placeholder="Enter your email"
              name="email"
            />
          </label>
          <div id="emailHelp" className="form-text">
            We will never share your email with anyone else.
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="InputPassword" className="form-label">
            Password
            <input
              type="password"
              className="form-control"
              id="InputPassword"
              placeholder="Enter your password"
              name="password"
            />
          </label>
        </div>
        <button type="submit" className="btn btn-primary">
          Login
        </button>
      </form>

      <h1>electron-react-boilerplate</h1>
      <div className="Hello">
        <a
          href="https://electron-react-boilerplate.js.org/"
          target="_blank"
          rel="noreferrer"
        >
          <button type="button">
            <span role="img" aria-label="books">
              📚
            </span>
            Read our docs
          </button>
        </a>
        <a
          href="https://github.com/sponsors/electron-react-boilerplate"
          target="_blank"
          rel="noreferrer"
        >
          <button type="button">
            <span role="img" aria-label="books">
              🙏
            </span>
            Donate
          </button>
        </a>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
