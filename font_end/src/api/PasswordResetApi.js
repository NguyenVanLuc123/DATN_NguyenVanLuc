// PasswordResetApi.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

export const sendForgotPasswordEmail = async (email) => {
    try {
        const response = await axios.post(`${API_URL}/forgotPassword`, { email },{ withCredentials: true });
        return response.data; 
    } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Đã xảy ra lỗi' };
    }
};

export const verifyOtp = async (otp) => { // Chỉ nhận otp
    try {
        const response = await axios.post(`${API_URL}/otp`, { otp },{ withCredentials: true }); // Chỉ gửi otp

        return response.data;
    } catch (error) {
       
        return { success: false, message: error.response?.data?.message || 'Đã xảy ra lỗi' };
    }
};

export const changePassword = async (newPassword) => { // Chỉ nhận newPassword
    try {
        const response = await axios.patch(`${API_URL}/changePassword`, { newPassword },{ withCredentials: true }); // Chỉ gửi newPassword
        return response.data; 
    } catch (error) {
       
        return { success: false, message: error.response?.data?.message || 'Đã xảy ra lỗi' };
    }
};