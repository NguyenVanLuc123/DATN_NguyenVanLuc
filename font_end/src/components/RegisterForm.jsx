// src/components/RegisterForm.jsx
import React, { useState } from 'react';
import { registerUser } from '../api/RegisterApi';
import {  showError } from '../utils/notification';
import '../styles/styles.css';
import { useNavigate} from 'react-router-dom';
const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    is_owner: "0",
    agreeToTerms: false
  });
  const navigate = useNavigate();
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    if (!formData.agreeToTerms) {
      setMessage({ type: 'error', text: 'Please agree to the Terms and Conditions' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data to submit
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        is_owner: parseInt(formData.is_owner)
      };

      console.log('Submitting data:', submitData);

      const response = await registerUser(submitData);
      
      console.log('Server response:', response);

      if (response && response.data) {
        navigate('/login')
      }
    } catch (error) {
      console.error('Form submission error:', error);

      if (error.response) {
        // Server returned an error
        const errorMessage = error.response.data.message || 'An error occurred during registration';
        setMessage({ type: 'error', text: errorMessage });
        showError(errorMessage);
        console.log('Server error response:', error.response.data);
      } else if (error.request) {
        // No response received
        console.log('No response received:', error.request);
        setMessage({ 
          type: 'error', 
          text: 'Could not connect to the server. Please check your network connection and CORS.' 
        });
        showError('Could not connect to the server');
      } else {
        // Other errors
        console.log('Error details:', error);
        setMessage({ type: 'error', text: 'An error occurred. Please try again later.' });
        showError('An error occurred. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-form">
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="account-type">
            <label>
              <input
                type="radio"
                name="is_owner"
                value="0"
                checked={formData.is_owner === "0"}
                onChange={handleChange}
              />
              I want to rent a car
            </label>
            <label>
              <input
                type="radio"
                name="is_owner"
                value="1"
                checked={formData.is_owner === "1"}
                onChange={handleChange}
              />
              I am a car owner
            </label>
          </div>

          <div className="terms">
            <input
              type="checkbox"
              id="agreeToTerms"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
            />
            <label htmlFor="agreeToTerms">
              I agree to the Terms and Conditions
            </label>
          </div>

          <button 
            type="submit" 
            className="register-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registering...' : 'Sign Up'}
          </button>
        </form>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterForm;
