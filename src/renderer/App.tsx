// import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import 'bootstrap';

import React, { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import Modal from 'react-bootstrap/Modal';
import { MemoryRouter as Router, Route, Routes } from 'react-router-dom';

import icon from '../../assets/icon.svg';

const Hello = () => {
  const [challenge, setChallenge] = useState('');
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  useEffect(() => {
    window.electron.ipcRenderer.on(
      'challenge-question',
      (challengeQuestion: any) => {
        console.log(
          `this is the renderer thread, received ${challengeQuestion} from main thread`
        );
        setChallenge(challengeQuestion);
        handleShow();
      }
    );
  });

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    const formData = new FormData(event.currentTarget);
    event.preventDefault();
    const loginStatus = await window.electron.ipcRenderer.paylocityLogin({
      companyId: formData.get('companyId'),
      username: formData.get('username'),
      password: formData.get('password'),
    });
    // console.log(loginStatus);
    // console.log(JSON.stringify(loginStatus));
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
          <label htmlFor="InputUsername" className="form-label">
            Username
            <input
              type="text"
              className="form-control"
              id="InputUsername"
              placeholder="Enter your username"
              name="username"
            />
          </label>
          <div id="emailHelp" className="form-text">
            We will never share your username with anyone else.
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
      <Modal
        show={show}
        onHide={handleClose}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Challenge Question</Modal.Title>
        </Modal.Header>
        <Modal.Body>{challenge}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary">Understood</Button>
        </Modal.Footer>
      </Modal>
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
