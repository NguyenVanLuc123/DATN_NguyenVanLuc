import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation, data } from 'react-router-dom';
import Footer from '../../components/Footer';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2'
import { socket } from "../../socket.io/socket";
// Booking card component with polished UI
function BookingCard({ booking, setBookings }) {
  const navigate = useNavigate();
  const [bookingSocket, setBookingsocket] = useState("");
  const images = [
    booking.car_id.front_img,
    booking.car_id.left_img,
    booking.car_id.right_img,
    booking.car_id.back_img,
  ];
  const [idx, setIdx] = useState(0);

  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  //socket 
  useEffect(() => {
    socket.on("SERVER_CONFIRM_DEPOSIT", (data) => {
      if (data.car_id == booking.car_id.id && booking.status === "PENDING_DEPOSIT") {
        setBookingsocket(data.BookingStatus)
      }
    });

    socket.on("SERVER_CONFIRM_PAYMENT", (data) => {
if (data.car_id == booking.car_id.id && booking.status === "PENDING_PAYMENT") {
        setBookingsocket(data.BookingStatus)
      }
    })
    // cleanup tránh lặp listener khi component unmount
    return () => socket.off("receive_message");
  }, []);


  useEffect(() => {
    setBookingsocket("")
  }, [booking]);
  //socket
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
  const onConfirmClick = () => {
    Swal.fire({
      title: 'Confirm Pick-up',
      text: 'Bạn có chắc chắn muốn xác nhận đã nhận xe?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Có, xác nhận',
      cancelButtonText: 'Không, huỷ',
      reverseButtons: true,
      buttonsStyling: false,            // ✨ tắt style mặc định
      customClass: {
        confirmButton: `
            px-5 py-2 
            bg-green-600 hover:bg-green-700 
            text-white font-medium 
            rounded-lg
          `,
        cancelButton: `
            px-5 py-2 
            bg-gray-300 hover:bg-gray-400 
            text-gray-800 font-medium 
            rounded-lg
          `
      }
    }).then(result => {
      if (result.isConfirmed) {
        handleConfirmPickUp()
      }
      // cancel thì tự đóng
    })
  }


  const handleConfirmPickUp = async () => {
    try {
      socket.emit("CLINET_CONFIRM_PICK_UP", booking.car_id.id)
      const response = await axios.put(
        `http://localhost:3000/api/v1/customer/booking/In_progress/${booking.id}`,
        null,
        {
          withCredentials: true
        }
      );
      const b = response.data.BookingresultMycar;
      setBookings(b);
      console.log(booking)
      console.log(b)


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
  const handleCancel = async () => {
    try {
      socket.emit("CLINET_CANCEL_CAR", booking.car_id.id)
      const response = await axios.put(
        `http://localhost:3000/api/v1/customer/booking/cancel/${booking.id}`,
        null,
        {
          withCredentials: true
        }
      );
      const b = response.data.BookingresultMycar;
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
  const onReturnClick = async () => {
    try {
      console.log("nut retuen")
      // 1) Lấy thông tin Totalpayment
      const res = await axios.get(
        `http://localhost:3000/api/v1/customer/booking/Totalpayment/${booking.id}`,
        { withCredentials: true }
      );
      console.log(res.data)
      const { message, day, daysTotal } = res.data;

      // 2) Popup Return Car với custom nút
      const result = await Swal.fire({
        title: `<span style="color:#e74c3c">🚗 Return Car</span>`,
        html: `
          <p style="font-size:1rem; color:#34495e">${message}</p>
          <p><strong style="color:#2980b9">Số ngày thuê:</strong> ${day}</p>
          <p><strong style="color:#c0392b">Số tiền còn lại:</strong> ${daysTotal.toLocaleString()} VND</p>
        `,
        icon: 'info',
        iconColor: '#8e44ad',
        background: '#fdfbfb',
        color: '#2c3e50',

        showCancelButton: true,
        confirmButtonText: 'Có, trả xe',
        cancelButtonText: 'Không',

        // ✨ custom nút
        buttonsStyling: false,
        customClass: {
          confirmButton: `
            px-5 py-2 
            bg-green-600 hover:bg-green-700 
            text-white font-medium 
            rounded-lg
          `,
          cancelButton: `
            px-5 py-2 
            bg-gray-300 hover:bg-gray-400 
            text-gray-800 font-medium 
            rounded-lg
          `
        },
        reverseButtons: true,
      });

      if (!result.isConfirmed) return;

      // 3) Gọi API ReturnCar
      const ok = await handleReturnCar(daysTotal, day);
      if (ok) {
        // 4) Nếu thành công, show popup đánh giá
        await showReviewPopup(booking);
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: '❌ Lỗi',
        text: 'Không lấy được thông tin thanh toán.',
        icon: 'error',
        confirmButtonText: 'OK',
        buttonsStyling: false,
        customClass: {
          confirmButton: `
            px-5 py-2 
            bg-red-600 hover:bg-red-700 
            text-white font-medium 
            rounded-lg
          `
        }
      });
    }
  };

  const handleReturnCar = async (total_amount, day) => {
    try {
      socket.emit("CLINET_RETURN_CAR", booking.car_id.id)
      const response = await axios.put(
        `http://localhost:3000/api/v1/customer/booking/ReturnCar/${booking.id}/${total_amount}`,
        { day_rental: day },
        { withCredentials: true }
      );
      setBookings(response.data.BookingresultMycar);
      Swal.fire({
        title: '✅ Thành công',
        text: response.data.message,
        icon: 'success',
        confirmButtonText: 'OK',
        buttonsStyling: false,
        customClass: {
          confirmButton: `
            px-5 py-2 
            bg-green-600 hover:bg-green-700 
            text-white font-medium 
            rounded-lg
          `
        }
      });
      return true;
    } catch (error) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi trả xe!';
      Swal.fire({
        title: '❌ Thất bại',
        text: msg,
        icon: 'error',
        confirmButtonText: 'OK',
        buttonsStyling: false,
        customClass: {
          confirmButton: `
            px-5 py-2 
            bg-red-600 hover:bg-red-700 
            text-white font-medium 
            rounded-lg
          `
        }
      });
      return false;
    }
  };

  const showReviewPopup = (booking) => {
    let rating = 0;
    return Swal.fire({
      title: '⭐ Đánh giá trải nghiệm',
      html: `
        <div id="swal-star" style="display:flex;justify-content:center;gap:5px;font-size:28px;cursor:pointer;">
          ${[1, 2, 3, 4, 5].map(i => `<span data-star="${i}">☆</span>`).join('')}
        </div>
        <textarea id="swal-report" class="swal2-textarea" placeholder="Viết nhận xét (tuỳ chọn)"></textarea>
      `,
      showCancelButton: true,
      cancelButtonText: 'Skip',
      confirmButtonText: 'Send',
      focusConfirm: false,

      // ✨ custom nút đánh giá
      buttonsStyling: false,
      customClass: {
        confirmButton: `
          px-5 py-2 
          bg-blue-600 hover:bg-blue-700 
          text-white font-medium 
          rounded-lg
        `,
        cancelButton: `
          px-5 py-2 
          bg-gray-300 hover:bg-gray-400 
          text-gray-800 font-medium 
          rounded-lg
        `
      },

      preConfirm: () => {
        if (rating === 0) {
          Swal.showValidationMessage('Chọn ít nhất 1 sao để đánh giá');
        }
        const report = document.getElementById('swal-report').value;
        return { rating, report };
      },
      didOpen: () => {
        const stars = Swal.getPopup().querySelectorAll('#swal-star span');
        stars.forEach(el => {
          const idx = +el.dataset.star;
          el.addEventListener('mouseenter', () => {
            stars.forEach(s => s.textContent = +s.dataset.star <= idx ? '★' : '☆');
          });
          el.addEventListener('mouseleave', () => {
            stars.forEach(s => s.textContent = +s.dataset.star <= rating ? '★' : '☆');
          });
          el.addEventListener('click', () => {
            rating = idx;
            stars.forEach(s => s.textContent = +s.dataset.star <= rating ? '★' : '☆');
          });
        });
      }
    }).then(async result => {
      if (result.isConfirmed) {
        try {
          const response = await axios.post(
            `http://localhost:3000/api/v1/customer/booking/Feedback/${booking.car_id.id}`,
            {
              rating: result.value.rating,
              report: result.value.report
            },
            { withCredentials: true }
          );
          Swal.fire({
            title: 'Cảm ơn!',
            text: 'Bạn đã gửi đánh giá thành công.',
            icon: 'success',
            confirmButtonText: 'OK',
            reverseButtons: true,
            buttonsStyling: false,
            customClass: {
              confirmButton: `
                px-5 py-2 
                bg-green-600 hover:bg-green-700 
                text-white font-medium 
                rounded-lg
              `
            }
          });
        } catch {
          Swal.fire({
            title: '❌',
            text: 'Gửi đánh giá thất bại.',
            icon: 'error',
            confirmButtonText: 'OK',
            buttonsStyling: false,
            customClass: {
              confirmButton: `
                px-5 py-2 
                bg-red-600 hover:bg-red-700 
                text-white font-medium 
                rounded-lg
              `
            }
          });
        }
      }
    });
  };

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
              className={`w-3 h-3 rounded-full border-2 focus:outline-none ${dot === idx ? 'bg-white border-white' : 'bg-transparent border-white'
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
            {bookingSocket !== "" ? (
              <>
                <p>
                  Status: <span className={`${statusStyles[bookingSocket] || 'text-gray-500'} font-semibold`}>{bookingSocket}</span>
                </p>
              </>
            ) : (<>
              <p>
                Status: <span className={`${statusStyles[booking.status] || 'text-gray-500'} font-semibold`}>{booking.status}</span>
              </p>
            </>)}
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => navigate(`/customer/bookingdetail/${booking.id}`)}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            View Details
          </button>
          {bookingSocket !== "" ? (
            <>
              {bookingSocket === 'CONFIRMED' && (
                <button className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition" onClick={onConfirmClick}>
                  Confirm Pick-up
                </button>
              )}
              {bookingSocket === 'IN_PROGRESS' && (
                <button className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition" onClick={onReturnClick}>
                  Return Car
                </button>
              )}
              {(bookingSocket === 'PENDING_DEPOSIT' || bookingSocket === 'CONFIRMED') && (
                <button className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition" onClick={handleCancel}>
                  Cancel Booking
                </button>
              )}
            </>
          ) : (<>
            {booking.status === 'CONFIRMED' && (
              <button className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition" onClick={onConfirmClick}>
                Confirm Pick-up
              </button>
            )}
            {booking.status === 'IN_PROGRESS' && (
              <button className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition" onClick={onReturnClick}>
                Return Car
              </button>
            )}
            {(booking.status === 'PENDING_DEPOSIT' || booking.status === 'CONFIRMED') && (
              <button className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition" onClick={handleCancel}>
                Cancel Booking
              </button>
            )}
          </>)}

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
              className={`px-3 py-1 border rounded transition ${i + 1 === page ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
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
