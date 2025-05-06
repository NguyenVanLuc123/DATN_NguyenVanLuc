import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SecurityForm = ({ setUser }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleDiscard = () => {
        navigate('/customer/home');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.put(
                'http://localhost:3000/api/v1/customer/changepassword',
                { newPassword },
                { withCredentials: true }
            );

            if (response.data.success) {
                setError('');
                toast.success(response.data.message);
                setUser(response.data.data);
            } else {
                setError(response.data.message);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            setError(error.response?.data?.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form 
            onSubmit={handleSubmit} 
            className="bg-white p-4 sm:p-6 rounded-lg shadow-md w-full sm:w-[600px] md:w-[700px] lg:w-[800px] mx-auto my-4 sm:my-8"
        >
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">Change Password</h2>
            
            {/* Error and Success Messages */}
            {error && (
                <div className="text-red-500 mb-4 text-sm sm:text-base">
                    {error}
                </div>
            )}
            {successMessage && (
                <div className="text-green-500 mb-4 text-sm sm:text-base">
                    {successMessage}
                </div>
            )}

            {/* New Password Field */}
            <div className="mb-4">
                <label className="block font-medium text-sm sm:text-base mb-1 sm:mb-2">
                    New Password:
                </label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2 border rounded text-sm sm:text-base"
                    required
                />
            </div>

            {/* Confirm Password Field */}
            <div className="mb-4">
                <label className="block font-medium text-sm sm:text-base mb-1 sm:mb-2">
                    Confirm Password:
                </label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2 border rounded text-sm sm:text-base"
                    required
                />
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-0 mt-6">
                <button 
                    type="button" 
                    className="text-red-500 hover:underline text-sm sm:text-base order-2 sm:order-1" 
                    onClick={handleDiscard}
                >
                    Discard
                </button>
                <button
                    type="submit"
                    className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm sm:text-base order-1 sm:order-2 
                        ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loading}
                >
                    {loading ? 'Changing...' : 'Change Password'}
                </button>
            </div>
        </form>
    );
};

export default SecurityForm;