// EmailInput.jsx
import React, { useState } from 'react';

const EmailInput = ({ onSubmit }) => {
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(email);
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-5 border rounded shadow bg-white">
            <h2 className="text-2xl font-bold mb-4 text-center">Nhập email của bạn</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    className="mt-1 block w-full p-2 border border-gray-300 rounded"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <button type="submit" className="mt-4 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Gửi</button>
            </form>
        </div>
    );
};

export default EmailInput;