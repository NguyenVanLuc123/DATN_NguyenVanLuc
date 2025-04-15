// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Register from './pages/Register';
import About from './pages/About';
import Login from './pages/Login';
import ResetPasswordPage from './pages/ResetPasswordPage'
import './styles/styles.css';
import './index.css';


function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <Routes>
          <Route path="/signup" element={<Register />} />
          <Route path="/" element={<About />}/>
          <Route path="/login" element={<Login />}/>
          <Route path="/forgot-password" element={<ResetPasswordPage />}/>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
