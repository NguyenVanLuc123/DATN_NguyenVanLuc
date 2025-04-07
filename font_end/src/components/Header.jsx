import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/styles.css';

const Header = () => {
  return (
    <header className="header">
      <Link to="/" className="header-logo">
        <span>🚗</span>
        <span>Thuê xe ngay!</span>
      </Link>
      <nav className="header-nav">
        <Link to="/about">Về chúng tôi</Link>
        <Link to="/signup">Đăng ký</Link>
        <Link to="/login">Đăng nhập</Link>
      </nav>
    </header>
  );
};

export default Header; 