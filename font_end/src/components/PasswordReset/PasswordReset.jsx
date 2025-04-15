// PasswordReset.jsx
import React, { useState } from 'react';
import EmailInput from './EmailInput';
import OtpInput from './OtpInput';
import ChangePassword from './ChangePassword';
import { sendForgotPasswordEmail, verifyOtp, changePassword } from '../../api/PasswordResetApi';

const PasswordReset = () => {
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');

    const handleEmailSubmit = async (email) => {
        try {
            const response = await sendForgotPasswordEmail(email);
            console.log('Response from API (Forgot Password):', response);
            if (response.success) {
                setStep(2); 
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError('Đã xảy ra lỗi. Vui lòng thử lại.');
        }
    };

    const handleOtpSubmit = async (otp) => {
        try {
            const response = await verifyOtp(otp);
            if (response.success) {
                setStep(3); // Move to Change Password step
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError('Đã xảy ra lỗi. Vui lòng thử lại.');
        }
    };

    const handleChangePasswordSubmit = async (newPassword) => {
        try {
            const response = await changePassword(newPassword);
            if (response.success) {
                // Redirect to login page
                window.location.href = '/login';
            } else {
                setError(response.message);
            }
        } catch (err) {
            setError('Đã xảy ra lỗi. Vui lòng thử lại.');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-5 border rounded shadow bg-white">
            {error && <p className="text-red-500">{error}</p>}
            {step === 1 && <EmailInput onSubmit={handleEmailSubmit} />}
            {step === 2 && <OtpInput onSubmit={handleOtpSubmit} />}
            {step === 3 && <ChangePassword  onSubmit={handleChangePasswordSubmit} />}
        </div>
    );
};

export default PasswordReset;