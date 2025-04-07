// src/components/RegisterForm.jsx
import React, { useState } from 'react';
import { registerUser } from '../api/RegisterApi';
import { showSuccess, showError } from '../utils/notification';
import '../styles/styles.css';

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
      setMessage({ type: 'error', text: 'Vui lòng đồng ý với Điều khoản và Điều kiện' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Chuẩn bị dữ liệu gửi đi
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
        setMessage({ type: 'success', text: response.data.message || 'Đăng ký thành công' });
        showSuccess(response.data.message || 'Đăng ký thành công');
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          is_owner: "0",
          agreeToTerms: false
        });
      }
    } catch (error) {
      console.error('Form submission error:', error);

      if (error.response) {
        // Server trả về lỗi
        const errorMessage = error.response.data.message || 'Có lỗi xảy ra khi đăng ký';
        setMessage({ type: 'error', text: errorMessage });
        showError(errorMessage);
        console.log('Server error response:', error.response.data);
      } else if (error.request) {
        // Không nhận được response
        console.log('No response received:', error.request);
        setMessage({ 
          type: 'error', 
          text: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và CORS.' 
        });
        showError('Không thể kết nối đến server');
      } else {
        // Lỗi khác
        console.log('Error details:', error);
        setMessage({ type: 'error', text: 'Có lỗi xảy ra. Vui lòng thử lại sau.' });
        showError('Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-form">
        <h2>Đăng ký</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Họ và tên</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Nhập họ và tên của bạn"
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
              placeholder="Nhập email của bạn"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Số điện thoại</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="Nhập số điện thoại của bạn"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Nhập mật khẩu"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Xác nhận lại mật khẩu"
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
              Tôi muốn thuê xe
            </label>
            <label>
              <input
                type="radio"
                name="is_owner"
                value="1"
                checked={formData.is_owner === "1"}
                onChange={handleChange}
              />
              Tôi là chủ xe
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
              Tôi đồng ý với Điều khoản và Điều kiện
            </label>
          </div>

          <button 
            type="submit" 
            className="register-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
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
