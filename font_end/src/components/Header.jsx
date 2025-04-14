import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-2xl mr-2">🚗</span>
          <span className="font-bold">Rent a car today!</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="text-gray-600 cursor-pointer hover:underline"
          >
            ABOUT US
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:opacity-80"
          >
            SIGN UP
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 border border-gray-300 rounded hover:bg-stone-300"
          >
            LOG IN
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header; 