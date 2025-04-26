import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import { IoMdArrowDropdownCircle } from "react-icons/io";
import axios from 'axios';

const Header = ({ user, setUser }) => {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const toggleDropdown = () => {
        setDropdownOpen(!isDropdownOpen);
    };

    const handLogout = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/v1/logout', { withCredentials: true });
            if (response.data.success) {
                setUser(null);
                navigate("/");
            }
        } catch (error) {
            console.error("Đã xảy ra lỗi khi đăng xuất:", error.response?.data?.message || error.message);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="bg-white shadow-sm">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center">
                    <span className="text-3xl mr-2">🚗</span>
                    <span className="font-bold text-2xl">Rent a car today!</span>
                </div>
                <div className="flex items-center space-x-4 text-sm font-medium">
                    <button
                        className="text-gray-600 hover:underline"
                        onClick={() => navigate('/')}
                    >
                        About us
                    </button>

                    {user ? (
                        <div className="relative flex items-center gap-1" ref={dropdownRef}>
                            <FaUserCircle className="text-2xl cursor-pointer text-gray-600" onClick={() => navigate('/customer/home')} />
                            <span className="font-semibold cursor-pointer text-gray-600" onClick={toggleDropdown}>
                                {user.name}
                            </span>
                            <IoMdArrowDropdownCircle className="text-xl cursor-pointer text-gray-600" onClick={toggleDropdown} />

                            {isDropdownOpen && (
                              <div className="absolute top-full right-0 mt-3 translate-x-6 w-48 bg-white border rounded shadow-lg z-10">

                                    <Link to="/profile" className="block px-4 py-2 text-gray-600 hover:bg-gray-200" onClick={() => setDropdownOpen(false)}>My profile</Link>

                                    {user.is_owner === 0 ? (
                                        <>
                                            <Link to="/bookings" className="block px-4 py-2 text-gray-600 hover:bg-gray-200" onClick={() => setDropdownOpen(false)}>My bookings</Link>
                                            <Link to="/wallet" className="block px-4 py-2 text-gray-600 hover:bg-gray-200" onClick={() => setDropdownOpen(false)}>My Wallet</Link>
                                        </>
                                    ) : (
                                        <>
                                            <Link to="/owner/cars" className="block px-4 py-2 text-gray-600 hover:bg-gray-200" onClick={() => setDropdownOpen(false)}>My cars</Link>
                                            <Link to="/wallet" className="block px-4 py-2 text-gray-600 hover:bg-gray-200" onClick={() => setDropdownOpen(false)}>My Wallet</Link>
                                            <Link to="/reports" className="block px-4 py-2 text-gray-600 hover:bg-gray-200" onClick={() => setDropdownOpen(false)}>My Reports</Link>
                                        </>
                                    )}

                                    <button onClick={handLogout} className="block w-full text-gray-600 text-left px-4 py-2 hover:bg-gray-200">Log out</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link to="/signup" className="px-4 py-2 bg-blue-500 text-white rounded hover:opacity-80">SIGN UP</Link>
                            <Link to="/login" className="px-4 py-2 border border-gray-300 rounded hover:bg-stone-300">LOG IN</Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
