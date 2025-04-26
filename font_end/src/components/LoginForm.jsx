// src/components/LoginForm.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/LoginApi';
import { fetchHomeData} from '../api/customer/HomeApi'; // Import API để kiểm tra xác thực

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(''); // Thêm state để lưu thông báo
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetchHomeData(); // Gọi API kiểm tra xác thực
                
                if (response.account.is_owner === 0) {
                    navigate('/customer/home'); // Nếu không phải owner, điều hướng đến trang customer
                }
                else{
                    navigate('/owner/home'); 
                }
            } catch (error) {
                console.log("lỗi lấy dữ liệu",error.message);
            }
        };
    
        checkAuth();
    }, [navigate]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); // Reset thông báo trước khi gửi

        try {
            const response = await loginUser(email, password);
            if (response.data.is_owner===0) {
                navigate('/customer/home');
            }
            else if(response.data.is_owner===1){
                navigate('/owner/home');
            } else {
                setMessage(response.message); // Hiển thị thông báo từ phản hồi
            }
        } catch (error) {
            setMessage(error.response.data.message || 'Đã xảy ra lỗi trong quá trình đăng nhập');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-8 w-96">
                <h2 className="text-2xl font-bold text-center mb-6">LOG IN USING YOUR ACCOUNT</h2>
                <div className="mb-4">
                    <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">Your email address</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>
                <div className="mb-4">
                    <a href="/forgot-password" className="text-blue-500 text-sm">Forgot your password?</a>
                </div>
                <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
                    LOG IN
                </button>
                {message && <div className="mt-4 text-red-500 text-sm text-center">{message}</div>} {/* Hiển thị thông báo */}
            </form>
        </div>
    );
};

export default LoginForm;