
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Register from './pages/Register';
import About from './pages/About';
import Login from './pages/Login';
import ResetPasswordPage from './pages/ResetPasswordPage';
import './styles/styles.css';
import './index.css';
import HomeUser from './pages/customer/Home';
import Profile from './pages/customer/Profile';
import SearchCarResult from './components/SearchCarResult';
import CarDetails from './pages/CarDetails';
import MyCars from './pages/owner/Mycars';
import EditCars from './pages/owner/Editcar';
import { Toaster } from 'react-hot-toast';
import CreateCar from './pages/owner/CreateCar';
import BookingForm from './pages/customer/Booking';
import MyBookings from './pages/customer/MyBooking';
import BookingDetails from './pages/customer/BookingDetail';

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <div className="app">
        <Header user={user} setUser={setUser} />
        <Routes>
          <Route path="/signup" element={<Register />} />
          <Route path="/" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ResetPasswordPage />} />
          <Route path="/customer/home" element={<HomeUser setUser={setUser} />} />
          <Route path="/customer/booking/:id" element={<BookingForm setUser={setUser} />} />
          <Route path="/customer/bookings" element={<MyBookings setUser={setUser} />} />
          <Route path="/customer/bookingdetail/:id" element={<BookingDetails setUser={setUser} />} />
          <Route path="/profile" element={<Profile setUser={setUser} />} />
          <Route path="/owner/home" element={<HomeUser setUser={setUser} />} />
          <Route path="/search_car_result" element={<SearchCarResult setUser={setUser} />} />
          <Route path="/details/:id" element={<CarDetails setUser={setUser} />} />
          <Route path="/owner/cars" element={<MyCars setUser={setUser} />} />
          <Route path="/owner/car/:id" element={<EditCars setUser={setUser} />} />
          <Route path="/owner/car/create" element={<CreateCar setUser={setUser} />} />
          
        </Routes>
        {/* Thêm Toaster để hiển thị toast notifications */}
        <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
      </div>
    </Router>
  );
}

export default App;