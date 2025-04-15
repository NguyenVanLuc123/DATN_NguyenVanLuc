// OtpInput.jsx
import React, { useState } from 'react';

const OtpInput = ({ onSubmit }) => {
    const [otp, setOtp] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(otp);
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-5 border rounded shadow bg-white">
            <h2 className="text-2xl font-bold mb-4 text-center">Nhập mã OTP</h2>
            <form onSubmit={handleSubmit}>
                <label className="block text-sm font-medium text-gray-700" htmlFor="otp">Mã OTP</label>
                <input
                    type="text"
                    id="otp"
                    className="mt-1 block w-full p-2 border border-gray-300 rounded"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                />
                <button type="submit" className="mt-4 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Xác nhận</button>
            </form>
        </div>
    );
};

export default OtpInput;