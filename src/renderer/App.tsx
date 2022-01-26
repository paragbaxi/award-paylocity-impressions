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

  const handleChallengeSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    const formData = new FormData(event.currentTarget);
    event.preventDefault();
    await window.electron.ipcRenderer.challengeAnswer(
      formData.get('challengeAnswer')
    );
    // console.log(loginStatus);
    // console.log(JSON.stringify(loginStatus));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    handleClose();
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
        <div>
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
        <div>
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
        <div>
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
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            Challenge Question
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>{challenge}</Modal.Body>
        <Modal.Footer>
          <form onSubmit={handleChallengeSubmit}>
            <label htmlFor="InputChallengeAnswer" className="form-label">
              <input
                className="challenge-answer"
                id="InputChallengeAnswer"
                type="text"
                placeholder="Enter your challenge answer"
                aria-label="default input example"
                name="challengeAnswer"
              />
            </label>

            <Button variant="primary" type="submit" className="btn btn-primary">
              Submit
            </Button>
          </form>
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
