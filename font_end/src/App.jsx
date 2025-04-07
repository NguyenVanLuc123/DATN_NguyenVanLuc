// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Register from './pages/Register';
import About from './pages/About';
import './styles/styles.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <Routes>
          <Route path="/signup" element={<Register />} />
          <Route path="/about" element={<About />}/>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
