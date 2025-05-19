import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import Footer from '../../components/Footer';
import toast from 'react-hot-toast';
import { socket } from "../../socket.io/socket";
function StarRating({ rating }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center space-x-1">
      {[...Array(full)].map((_, i) => <FaStar key={i} className="text-yellow-400" />)}
      {half && <FaStarHalfAlt className="text-yellow-400" />}
      {[...Array(empty)].map((_, i) => <FaRegStar key={i} className="text-yellow-400" />)}
    </div>
  );
}


function CarCard({ car }) {
  const navigate = useNavigate();
  const images = [car.front_img, car.left_img, car.right_img, car.back_img];
  const [idx, setIdx] = useState(0);
  const prev = () => setIdx((idx - 1 + images.length) % images.length);
  const next = () => setIdx((idx + 1) % images.length);
  const [status, setStatus] = useState(car.booking)
  const [Carstatus, setCarStatus] = useState("")

  //socket
  useEffect(() => {
    socket.on("SERVER_BOOKING", (data) => {
      if (car.id == data.car_id) {
        setStatus(data.BookingStatus)
      }
    });

    socket.on("SERVER_CANCEL_CAR", (data) => {
      if (car.id == data.car_id) {
        setCarStatus("available")
        setStatus(data.BookingStatus)
      } 
    });
    socket.on("SERVER_CONFIRM_PICK_UP", (data) => {
      if (car.id == data.car_id) {
        setStatus(data.BookingStatus)
      } 
    });

      socket.on("SERVER_CONFIRM_PICK_UP", (data) => {
      if (car.id == data.car_id) {
        setStatus(data.BookingStatus)
      } 
    });

     socket.on("SERVER_RETURN_CAR", (data) => {
      if (car.id == data.car_id) {
        setStatus(data.BookingStatus)
      } 
    });
    // cleanup tránh lặp listener khi component unmount
    return () => socket.off("receive_message");
  }, []);
  //socket

  const handleConfirm_deposit = async () => {
    try {
      socket.emit("CONFIRM_DEPOSIT", car.id);
      const response = await axios.put(
        `http://localhost:3000/api/v1/owner/booking/confirmDeposit/${car.id}`,
        null,
        {
          withCredentials: true
        }
      );
      if (response.data.success) {
        setStatus(response.data.booking.status);
        toast.success(response.data.message);
      }


      // đây chỉ chạy khi status code 2xx

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
  const handleConfirm_Payment = async () => {
    try {
      socket.emit("CLIENT_CONFIRM_PAYMENT",car.id)
      const response = await axios.put(
        `http://localhost:3000/api/v1/owner/booking/ConfirmPayment/${car.id}`,
        null,
        {
          withCredentials: true
        }
      );
      if (response.data.success) {
        setCarStatus("available")
        setStatus(response.data.bookingstatus);
        toast.success(response.data.message);
      }


      // đây chỉ chạy khi status code 2xx

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
  return (
    <div className="flex flex-col md:flex-row bg-white shadow-lg rounded-lg overflow-hidden mb-4 sm:mb-8 transform hover:-translate-y-1 transition">
      <div className="relative w-full md:w-1/2 h-48 sm:h-64">
        <img src={images[idx]} alt={`${car.name} slide ${idx + 1}`} className="w-full h-full object-cover" />
        <button onClick={prev} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-2 rounded-full hover:bg-opacity-50">‹</button>
        <button onClick={next} className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-2 rounded-full hover:bg-opacity-50">›</button>
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, dot) => (
            <span key={dot} onClick={() => setIdx(dot)} className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full cursor-pointer border-2 ${dot === idx ? 'bg-white border-white' : 'bg-transparent border-white'}`} />
          ))}
        </div>
      </div>
      <div className="w-full md:w-1/2 p-4 sm:p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">{car.name}</h2>
          <div className="flex items-center mb-2">
            <StarRating rating={Math.round((car.rating || 0) * 2) / 2} />
            {!car.rating && <span className="ml-2 text-sm sm:text-base text-gray-500">No ratings yet</span>}
          </div>
          <p className="text-sm sm:text-base text-gray-600 mb-1">Rides: <span className="font-semibold">{car.rides}</span></p>
          <p className="text-base sm:text-lg font-semibold text-red-600 mb-1">{car.price.toLocaleString()} VND/day</p>
          <p className="text-sm sm:text-base text-gray-700 mb-1">Location: <span className="font-medium">{car.location}</span></p>
          <p className="text-sm sm:text-base text-gray-700">
            Status:&nbsp;
            <span className={(Carstatus !== "" ? Carstatus : car.status) === 'available'
              ? 'text-green-600 font-semibold'
              : 'text-red-600 font-semibold'}>
              {Carstatus !== "" ? Carstatus : car.status}
            </span>
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
          <button onClick={() => navigate(`/owner/car/${car.id}`)} className="text-sm sm:text-base bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-5 py-1 sm:py-2 rounded-full transition">View details</button>
          {status === 'PENDING_DEPOSIT' && (
            <button onClick={handleConfirm_deposit} className="text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white px-3 sm:px-5 py-1 sm:py-2 rounded-full transition">Confirm deposit</button>
          )}
          {status === 'PENDING_PAYMENT' && (
            <button onClick={handleConfirm_Payment} className="text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white px-3 sm:px-5 py-1 sm:py-2 rounded-full transition">Confirm payment</button>
          )}
          {(status === 'CONFIRMED') && (
            <button className="text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white px-3 sm:px-5 py-1 sm:py-2 rounded-full transition">CONFIRMED</button>
          )}
          {(status === 'IN_PROGRESS') && (
            <button className="text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white px-3 sm:px-5 py-1 sm:py-2 rounded-full transition">IN_PROGRESS</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyCars({ setUser }) {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [sort, setSort] = useState('ratingDesc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(3);
  const { state } = useLocation();


  useEffect(() => {
    if (state?.toastMessage) {
      toast.success(state.toastMessage);

      window.history.replaceState({}, document.title);
    }
  }, [state]);
  useEffect(() => {
    axios.get('http://localhost:3000/api/v1/owner/cars', { withCredentials: true })
      .then(res => {
        if (res.data.success) {
          setCars(res.data.data);
          setUser(res.data.user);
        } else {
          navigate('/customer/home');
        }
      })
      .catch(() => {
        navigate('/customer/home');
      });
  }, [setUser, navigate]);

  const sorted = useMemo(() => {
    const arr = [...cars];
    switch (sort) {
      case 'ratingDesc': return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'newest': return arr.sort((a, b) => b.id - a.id);
      case 'oldest': return arr.sort((a, b) => a.id - b.id);
      case 'priceAsc': return arr.sort((a, b) => a.price - b.price);
      case 'priceDesc': return arr.sort((a, b) => b.price - a.price);
      default: return arr;
    }
  }, [cars, sort]);

  const paged = sorted.slice((page - 1) * perPage, page * perPage);
  const total = Math.ceil(sorted.length / perPage);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm p-4 text-sm text-gray-600 flex items-center space-x-4 container mx-auto rounded-b-lg">

        <Link to="/owner/home" className="hover:underline text-blue-600">Home</Link>
        <span className="text-gray-400">/</span>
        <span className="font-semibold text-gray-800">My Cars</span>

      </nav>
      <main className="flex-grow container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-4 sm:mb-0">My Cars</h1>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 items-center w-full sm:w-auto">
            <Link
              to="/owner/car/create"
              className="w-full sm:w-auto bg-black text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-medium hover:bg-gray-800 transition text-center"
            >
              Add Car
            </Link>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="w-full sm:w-auto border border-gray-300 rounded px-3 sm:px-4 py-2"
            >
              <option value="newest">Newest to Latest</option>
              <option value="oldest">Latest to Newest</option>
              <option value="priceAsc">Price Low to High</option>
              <option value="priceDesc">Price High to Low</option>
            </select>
          </div>
        </div>
        {paged.map(car => <CarCard key={car.id} car={car} />)}
        <div className="flex flex-wrap justify-center items-center space-x-1 sm:space-x-2 mt-8 sm:mt-12">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            className="px-3 py-1 sm:px-4 sm:py-2 bg-white border rounded hover:bg-gray-100 transition"
          >
            &lt;&lt;
          </button>
          {[...Array(total)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 sm:px-4 sm:py-2 border rounded transition ${i + 1 === page ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(p + 1, total))}
            className="px-3 py-1 sm:px-4 sm:py-2 bg-white border rounded hover:bg-gray-100 transition"
          >
            &gt;&gt;
          </button>
          <select
            value={perPage}
            onChange={e => { setPerPage(+e.target.value); setPage(1); }}
            className="ml-2 sm:ml-4 border border-gray-300 rounded px-2 sm:px-4 py-1 sm:py-2"
          >
            {[3, 5, 10].map(n => (
              <option key={n} value={n}>{n} per page</option>
            ))}
          </select>
        </div>
      </main>
      <Footer />
    </div>
  );
}
