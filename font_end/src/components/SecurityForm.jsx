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
        navigate('/customer/home'); // Chuyển hướng về trang home
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        // Kiểm tra xem confirmPassword có khớp với newPassword không
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
<form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-[800px] mx-auto">

            <h2 className="text-2xl font-semibold mb-4">Change Password</h2>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {successMessage && <div className="text-green-500 mb-4">{successMessage}</div>}

            <div className="mb-4">
                <label className="block font-medium">New Password:</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                />
            </div>

            <div className="mb-4">
                <label className="block font-medium">Confirm Password:</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                />
            </div>

            <div className="flex justify-between mt-6">
                <button type="button" className="text-red-500 hover:underline" onClick={handleDiscard}>
                    Discard
                </button>
                <button
                    type="submit"
                    className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loading}
                >
                    {loading ? 'Changing...' : 'Change Password'}
                </button>
            </div>
        </form>
    );
};

export default SecurityForm;