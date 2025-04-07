// src/api/registerApi.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

// Tạo instance axios với cấu hình mặc định
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000, // timeout sau 10 giây
  withCredentials: true // Thêm credentials nếu cần
});

export const registerUser = async (userData) => {
  try {
    // Gửi toàn bộ userData lên server
    const response = await apiClient.post('/register', userData);
    console.log('Registration successful:', response.data);
    return response;
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      response: error.response,
      request: error.request,
      config: error.config
    });
    throw error;
  }
};
