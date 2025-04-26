// src/api/customer/ProfileApi.js
import axios from 'axios';

export const fetchProfileData = async () => {
    try {
        const response = await axios.get('http://localhost:3000/api/v1/customer/profile', {
            withCredentials: true, 
        });
        return response.data; 
    } catch (error) {
        console.error("Error fetching profile data:", error);
        throw error; 
    }
};