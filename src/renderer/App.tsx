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
  const [disabled, setDisabled] = useState(false);
  const [challengeDisabled, setChallengeDisabled] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleDisabled = () => {
    setDisabled(true);
  };

  useEffect(() => {
    window.electron.ipcRenderer.on(
      'challenge-question',
      (challengeQuestion: any) => {
        console.log(`Received ${challengeQuestion} from main thread`);
        if (challengeQuestion === 'logged in') {
          console.log(`Received login-successful from main thread`);
          setLoggedIn(true);
        } else {
          setChallenge(challengeQuestion);
          setChallengeDisabled(false);
          handleShow();
        }
      }
    );
    // window.electron.ipcRenderer.on('login-successful', () => {
    //   console.log(`Received login-successful from main thread`);
    //   setLoggedIn(true);
    // });
  });

  const handleChallengeSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    const formData = new FormData(event.currentTarget);
    event.preventDefault();
    setChallengeDisabled(true);
    await window.electron.ipcRenderer.challengeAnswer(
      formData.get('challengeAnswer')
    );
    handleClose();
    setChallengeDisabled(false);
    // console.log(loginStatus);
    // console.log(JSON.stringify(loginStatus));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    setDisabled(true);
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
      {loggedIn ? (
        <h1>Logged in successfully!</h1>
      ) : (
        <>
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
                  disabled={disabled}
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
                  disabled={disabled}
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
                  disabled={disabled}
                />
              </label>
            </div>
            {disabled ? (
              <button type="submit" className="btn btn-primary" disabled>
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                />
                &nbsp;Loading...
              </button>
            ) : (
              <button type="submit" className="btn btn-primary">
                Login
              </button>
            )}
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
                    aria-label="default input example"
                    name="challengeAnswer"
                    disabled={challengeDisabled}
                  />
                </label>
                {challengeDisabled ? (
                  <Button
                    variant="primary"
                    type="submit"
                    className="btn btn-primary"
                  >
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    />
                    {disabled ? '&nbsp;Loading...' : 'Submit'}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    type="submit"
                    className="btn btn-primary"
                  >
                    Submit
                  </Button>
                )}
              </form>
            </Modal.Footer>
          </Modal>
        </>
      )}
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
