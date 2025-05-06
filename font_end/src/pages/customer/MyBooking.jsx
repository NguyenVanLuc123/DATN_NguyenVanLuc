import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Footer from '../../components/Footer';
import toast from 'react-hot-toast';

// Booking card component with polished UI
function BookingCard({ booking,setBookings }) {
  const navigate = useNavigate();
  const images = [
    booking.car_id.front_img,
    booking.car_id.left_img,
    booking.car_id.right_img,
    booking.car_id.back_img,
  ];
  const [idx, setIdx] = useState(0);
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  // Helper to format date
  const fmt = (dateStr) =>
    new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const handleCancel = async () => {
      try {
          const response = await axios.put(
              `http://localhost:3000/api/v1/customer/booking/cancel/${booking.id}`,
              null,
              {
                  withCredentials: true
              }
          );
          const b =  response.data.BookingresultMycar;
          setBookings(b);
  
          // đây chỉ chạy khi status code 2xx
          toast.success(response.data.message);
      } catch (error) {
          // error.response chỉ có khi server trả 4xx/5xx
          if (error.response && error.response.data) {
              // server trả về { success: false, message: '...' }
              toast.error(error.response.data.message);
          } else {
              // lỗi mạng hoặc không có response
              toast.error('Có lỗi xảy ra khi đặt xe. Vui lòng thử lại!');
          }
          console.error('Booking failed:', error);
      }
  }
  // Status color mapping
  const statusStyles = {
    CONFIRMED: 'text-green-700',
    PENDING_DEPOSIT: 'text-yellow-600',
    IN_PROGRESS: 'text-blue-600',
    COMPLETED: 'text-green-500',
    PENDING_PAYMENT: 'text-red-600',
  };

  return (
    <div className="flex flex-col md:flex-row bg-white shadow-lg rounded-2xl overflow-hidden mb-8 hover:shadow-xl transition-shadow">
      {/* Image Carousel */}
      <div className="md:w-2/5 relative h-60">
        <img
          src={images[idx]}
          alt={`${booking.car_id.name} slide ${idx + 1}`}
          className="w-full h-full object-cover"
        />
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60"
        >
          ‹
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-60"
        >
          ›
        </button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2">
          {images.map((_, dot) => (
            <button
              key={dot}
              onClick={() => setIdx(dot)}
              className={`w-3 h-3 rounded-full border-2 focus:outline-none ${
                dot === idx ? 'bg-white border-white' : 'bg-transparent border-white'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Details & Actions */}
      <div className="md:w-3/5 p-6 flex flex-col justify-between">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold mb-2 text-gray-900">
            {booking.car_id.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
            <p>From: <span className="font-medium text-gray-900">{fmt(booking.start_date)}</span></p>
            <p>To: <span className="font-medium text-gray-900">{fmt(booking.end_date)}</span></p>
            <p>Days: <span className="font-medium text-gray-900">{booking.days}</span></p>
            <p>Price/Day: <span className="font-medium text-teal-600">{booking.car_id.price} VND</span></p>
            <p>Total: <span className="font-medium text-indigo-600">{booking.total_amount} VND</span></p>
            <p>Deposit: <span className="font-medium text-amber-600">{booking.deposit_amount} VND</span></p>
            <p>Booking No: <span className="font-medium text-gray-900">{booking.id}</span></p>
            <p>
              Status: <span className={`${statusStyles[booking.status] || 'text-gray-500'} font-semibold`}>{booking.status}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => navigate(`/customer/bookingdetail/${booking.id}`)}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            View Details
          </button>
          {booking.status === 'CONFIRMED' && (
            <button className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
              Confirm Pick-up
            </button>
          )}
          {booking.status === 'IN_PROGRESS' && (
            <button className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
              Return Car
            </button>
          )}
          {(booking.status === 'PENDING_DEPOSIT' || booking.status === 'CONFIRMED') && (
            <button className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition" onClick={() => handleCancel()}>
              Cancel Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Main bookings page
export default function MyBookings({ setUser }) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const { state } = useLocation();

  useEffect(() => {
    if (state?.toastMessage) {
      toast.success(state.toastMessage);
      window.history.replaceState({}, document.title);
    }
  }, [state]);

  useEffect(() => {
    axios
      .get('http://localhost:3000/api/v1/customer/listbooking', { withCredentials: true })
      .then((res) => {
        if (res.data.success) {
          setBookings(res.data.data);
          setUser(res.data.user);
        } else {
          navigate('/customer/home');
        }
      })
      .catch(() => navigate('/customer/home'));
  }, [setUser, navigate]);

 
  // Sort and paginate
  const sorted = useMemo(() => {
    const arr = [...bookings];
    switch (sort) {
      case 'newest': return arr.sort((a, b) => b.id - a.id);
      case 'oldest': return arr.sort((a, b) => a.id - b.id);
      case 'priceAsc': return arr.sort((a, b) => a.total_amount - b.total_amount);
      case 'priceDesc': return arr.sort((a, b) => b.total_amount - a.total_amount);
      default: return arr;
    }
  }, [bookings, sort]);

  const paged = sorted.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(sorted.length / perPage);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <nav className="bg-white shadow p-4 text-gray-700 flex items-center space-x-4 container mx-auto rounded-b-lg">
        <Link to="/owner/home" className="text-blue-600 hover:underline">
          Home
        </Link>
        <span className="text-gray-400">/</span>
        <span className="font-semibold text-gray-800">My Bookings</span>
      </nav>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">My Bookings</h1>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="mt-4 sm:mt-0 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-700"
          >
            <option value="newest">Newest to Oldest</option>
            <option value="oldest">Oldest to Newest</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
          </select>
        </div>

        {paged.map((booking) => (
          <BookingCard key={booking.id} booking={booking} setBookings={setBookings} />
        ))}

        {/* Pagination */}
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            className="px-3 py-1 border rounded hover:bg-gray-100"
          >
            &lt;&lt;
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 border rounded transition ${
                i + 1 === page ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            className="px-3 py-1 border rounded hover:bg-gray-100"
          >
            &gt;&gt;
          </button>
          <select
            value={perPage}
            onChange={e => {
              setPerPage(+e.target.value);
              setPage(1);
            }}
            className="ml-4 border border-gray-300 rounded px-3 py-1"
          >
            {[3, 5, 10].map(n => (
              <option key={n} value={n}>
                {n} per page
              </option>
            ))}
          </select>
        </div>
      </main>

      <Footer />
    </div>
  );
}
