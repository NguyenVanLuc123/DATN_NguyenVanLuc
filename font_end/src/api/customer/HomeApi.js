// src/api/HomeApi.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

export const fetchHomeData = async () => {
    try {
        const response = await axios.get(`${API_URL}/customer/home`, { withCredentials: true });
        return response.data;
    } catch (error) {
        return { success: false, message: error.response?.data?.message || 'Đã xảy ra lỗi' };
    }
};


