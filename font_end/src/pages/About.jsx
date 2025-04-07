// src/pages/About/About.jsx hoặc src/components/About/About.jsx
import React from 'react';
import '../styles/About.css';

const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="left-column">
            <h1>Looking for a vehicle?</h1>
            <h2>You're at the right place.</h2>
            <p>Choose between 1000s of private cars for rent at really low prices!</p>
            <button className="primary-button">Find a Rental Car Near You</button>
          </div>
          <div className="right-column">
            <h1>Are you a car owner?</h1>
            <p>List your car and make money from your asset today!</p>
            <button className="primary-button">List Your Car Today</button>
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="why-us">
        <h2>Why us?</h2>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon money"></div>
            <h3>Save money</h3>
            <p>We have no setup or registration fees. You only get charged when you rent a car. So get started for FREE!</p>
          </div>
          <div className="feature">
            <div className="feature-icon convenient"></div>
            <h3>Convenient</h3>
            <p>We have a large selection of well-maintained cars to suit your needs throughout the country</p>
          </div>
          <div className="feature">
            <div className="feature-icon legal"></div>
            <h3>Legal and insurance</h3>
            <p>We fully cover all rentals and even provide roadside assistance. Our rating system and detailed checks provide safety</p>
          </div>
          <div className="feature">
            <div className="feature-icon support"></div>
            <h3>24/7 support</h3>
            <p>Our team is ready to support you all the time through our 24/7 hotline and services</p>
          </div>
        </div>
      </section>

      {/* Where to find us Section */}
      <section className="locations">
        <h2>Where to find us?</h2>
        <div className="locations-grid">
          <div className="location-card">
            <h3>Hanoi</h3>
            <p>50+ cars</p>
          </div>
          <div className="location-card">
            <h3>Ho Chi Minh city</h3>
            <p>100+ cars</p>
          </div>
          <div className="location-card">
            <h3>Da Nang - Hoi An</h3>
            <p>30+ cars</p>
          </div>
          <div className="location-card">
            <h3>Nha Trang</h3>
            <p>25+ cars</p>
          </div>
          <div className="location-card">
            <h3>Da Lat</h3>
            <p>20+ cars</p>
          </div>
          <div className="location-card">
            <h3>Quang Ninh</h3>
            <p>15+ cars</p>
          </div>
        </div>
      </section>

      {/* About Page Footer */}
      <section className="about-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>RENT CARS</h3>
            <ul>
              <li><a href="/search">Search Cars and Rates</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>CUSTOMER ACCESS</h3>
            <ul>
              <li><a href="/booking">Manage My Booking</a></li>
              <li><a href="/wallet">My Wallet</a></li>
              <li><a href="/my-car">My Car</a></li>
              <li><a href="/login">Log In</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>JOIN US</h3>
            <ul>
              <li><a href="/signup">New User Sign Up</a></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;