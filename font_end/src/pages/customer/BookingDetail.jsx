// src/pages/BookingDetails.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';
import addressData from "../../data/address.listJson";
import toast from 'react-hot-toast';
import Swal from 'sweetalert2'
import { socket } from "../../socket.io/socket";

// Bản đồ các chức năng và điều khoản để render checkbox
const ADD_MAP = {
    '1': 'Bluetooth',
    '2': 'GPS',
    '3': 'Camera',
    '4': 'Sun roof',
    '5': 'Child lock',
    '6': 'Child seat',
    '7': 'DVD',
    '8': 'USB'
};
const TERM_MAP = {
    '1': 'No smoking',
    '2': 'No pet',
    '3': 'No food in car',
    '4': 'Other'
};

export default function BookingDetails({ setUser }) {
    const { id } = useParams();
    const navigate = useNavigate();
    // state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [booking, setBooking] = useState(null);
    const[bookingSocket,setBookingsocket]=useState("");
    const [balance, setbalance] = useState("");
    const [customer, setcustomer] = useState("");
    const [activeTab, setActiveTab] = useState('booking');
    const [idx, setIdx] = useState(0);
    const [additional, setAdditional] = useState([]);
    const [terms, setTerms] = useState([]);

    const [formErrors, setFormErrors] = useState([]);
    const [sameAsRenter, setSameAsRenter] = useState(false);
    // State cho địa chỉ
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [selectedWard, setSelectedWard] = useState('');
    const [driverInfo, setDriverInfo] = useState({
        fullName: '',
        dateOfBirth: '',
        phoneNumber: '',
        email: '',
        nationalId: '',
        drivingLicense: '',
        drivingLicensePreview: "",
        city: '',
        district: '',
        ward: ''
    });
//socket
    
useEffect(() => {
    socket.on("SERVER_CONFIRM_DEPOSIT", (data) => {
     setBookingsocket(data.BookingStatus)
     console.log(bookingSocket)
    });

    // cleanup tránh lặp listener khi component unmount
    return () => socket.off("receive_message");
  }, []);

  useEffect(() => {
   setBookingsocket("")
  }, [booking]);

  //socket
    // fetch booking
    useEffect(() => {
        axios
            .get(`http://localhost:3000/api/v1/customer/booking/${id}`, { withCredentials: true })
            .then(res => {
                if (res.data.success) {
                    const b = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data;
                    setBooking(b);
                    
                    setbalance(res.data.user.balance);
                    setcustomer(res.data.user);

                    setAdditional(
                        res.data.car_additional_function?.additional_function_id.split('-').filter(x => x) || []
                    );
                    setTerms(
                        res.data.car_teem_of_use?.term_of_use_id.split('-').filter(x => x) || []
                    );
                    if (res.data.user) setUser(res.data.user);

                    // Tách địa chỉ
                    let city = '', district = '', ward = '';
                    if (b.driver_address) {
                        const parts = b.driver_address.split(',').map(p => p.trim());
                        parts.forEach(part => {
                            if (part.startsWith('Tỉnh') || part.startsWith('Thành phố')) {
                                city = part;
                            } else if (part.startsWith('Huyện') || part.startsWith('Quận') || part.startsWith('Thị xã')) {
                                district = part;
                            } else if (part.startsWith('Xã') || part.startsWith('Phường') || part.startsWith('Thị trấn')) {
                                ward = part;
                            }
                        });
                    }

                    // Cập nhật city -> rồi district -> rồi ward để tránh lỗi bất đồng bộ
                    setSelectedProvince(city);

                    const foundCity = addressData.find(item => item.city === city);
                    if (foundCity) {
                        setDistricts(foundCity.districts);

                        const foundDistrict = foundCity.districts.find(d => d.district === district);
                        if (foundDistrict) {
                            setWards(foundDistrict.wards);
                        }
                    }

                    setSelectedDistrict(district);
                    setSelectedWard(ward);

                    // Cập nhật driverInfo sau cùng để không bị mất state trung gian
                    setDriverInfo({
                        fullName: b.driver_name || '',
                        dateOfBirth: b.driver_date_of_birth || '',
                        phoneNumber: b.driver_phone_number || '',
                        email: b.driver_email || '',
                        nationalId: b.driver_national_id || '',
                        drivingLicensePreview: b.driver_driving_license || '',
                        drivingLicense: b.driver_driving_license || '',
                        city: city,
                        district: district,
                        ward: ward
                    });
                }
            })
            .catch(console.error);
    }, [id, setUser]);

    if (!booking) {
        return <div className="flex-grow flex items-center justify-center p-8 text-gray-500">Loading...</div>;
    }

    const {
        start_date,
        end_date,
        days,
        total_amount,
        deposit_amount,
        status,
        car_id,
    } = booking;

    const userBalance = balance;

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        const file = files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setDriverInfo(prev => ({
                    ...prev,
                    [name]: file,
                    [`${name}Preview`]: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProvinceChange = (e) => {
        const province = e.target.value;
        setSelectedProvince(province);
        setDriverInfo(prev => ({
            ...prev,
            city: province
        }));

        const found = addressData.find(item => item.city === province);
        if (found) {
            setDistricts(found.districts);
            setWards([]);
            setSelectedDistrict('');
            setSelectedWard('');
        } else {
            setDistricts([]);
        }
    };
    const handleDistrictChange = (e) => {
        const district = e.target.value;
        setSelectedDistrict(district);
        setDriverInfo(prev => ({
            ...prev,
            district: district
        }));

        const found = districts.find(d => d.district === district);
        setWards(found ? found.wards : []);
        setSelectedWard('');
    };

    const handleWardChange = (e) => {
        const ward = e.target.value;
        setSelectedWard(ward);
        setDriverInfo(prev => ({
            ...prev,
            ward: ward
        }));
    };

    const handleDriverInfoChange = (e) => {
        const { name, value } = e.target;
        setDriverInfo(prev => ({
            ...prev,
            [name]: value
        }));
    };


    const validateStep1 = () => {
        const errors = [];

        if (!sameAsRenter) {
            const requiredFields = {
                fullName: 'Họ và tên',
                dateOfBirth: 'Ngày sinh',
                phoneNumber: 'Số điện thoại',
                email: 'Email',
                nationalId: 'CCCD/CMND',
                drivingLicense: 'Giấy phép lái xe'
            };

            const missingFields = Object.entries(requiredFields)
                .filter(([key]) => !driverInfo[key])
                .map(([_, label]) => label);

            if (missingFields.length > 0) {
                errors.push(`Vui lòng điền đầy đủ thông tin: ${missingFields.join(', ')}`);
            }

            if (!selectedProvince || !selectedDistrict || !selectedWard) {
                errors.push('Vui lòng chọn đầy đủ địa chỉ');
            }
        }

        setFormErrors(errors);
        return errors.length === 0;
    };
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

     // NEW: Return Car
     const onReturnClick = async () => {
        try {
          // 1) Lấy thông tin Totalpayment
          const res = await axios.get(
            `http://localhost:3000/api/v1/customer/booking/Totalpayment/${booking.id}`,
            { withCredentials: true }
          );
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
          const ok = await handleReturnCar(daysTotal,day);
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
    
      const handleReturnCar = async (total_amount,day) => {
        try {
            socket.emit("CLINET_RETURN_CAR",booking.car_id.id)
          const response = await axios.put(
            `http://localhost:3000/api/v1/customer/booking/ReturnCar/${booking.id}/${total_amount}`,
            {day_rental:day},
            { withCredentials: true }
          );
          const b = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;
         setBooking(b);
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
    
      const showReviewPopup = (bookingId) => {
        let rating = 0;
        return Swal.fire({
          title: '⭐ Đánh giá trải nghiệm',
          html: `
            <div id="swal-star" style="display:flex;justify-content:center;gap:5px;font-size:28px;cursor:pointer;">
              ${[1,2,3,4,5].map(i => `<span data-star="${i}">☆</span>`).join('')}
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
             await axios.post(
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
    

    const handlePayment = async () => {
        try {
            setIsSubmitting(true);
            const formData = new FormData();
            formData.append('booking_id', booking.id);

            // Xử lý driver_info
            if (sameAsRenter) {
                // Chuyển renterInfo thành object thông thường
                const driverInfoObj = {
                    fullName: customer.name,
                    dateOfBirth: customer.date_of_birth,
                    phoneNumber: customer.phone_number,
                    email: customer.email,
                    nationalId: customer.national_id,
                    drivingLicense: customer.driving_license,
                    city: customer.address?.split(' - ')[0] || '',
                    district: customer.address?.split(' - ')[1] || '',
                    ward: customer.address?.split(' - ')[2] || ''
                };

                // Append từng trường của driver_info
                Object.entries(driverInfoObj).forEach(([key, value]) => {
                    formData.append(`driver_info[${key}]`, value || '');
                });

            } else {
                // Xử lý trường hợp nhập thông tin mới
                const driverInfoObj = {
                    fullName: driverInfo.fullName,
                    dateOfBirth: driverInfo.dateOfBirth,
                    phoneNumber: driverInfo.phoneNumber,
                    email: driverInfo.email,
                    nationalId: driverInfo.nationalId,
                    city: selectedProvince,
                    district: selectedDistrict,
                    ward: selectedWard
                };

                // Nếu có file driving license mới
                if (driverInfo.drivingLicense instanceof File) {
                    formData.append('drivingLicense', driverInfo.drivingLicense);
                }

                // Append từng trường của driver_info
                Object.entries(driverInfoObj).forEach(([key, value]) => {
                    formData.append(`driver_info[${key}]`, value || '');
                });

            }
            const response = await axios.put(
                `http://localhost:3000/api/v1/customer/booking/${booking.id}`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    withCredentials: true
                }
            );

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
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmPickUp  = async () => {
        try {
             socket.emit("CLINET_CONFIRM_PICK_UP",booking.car_id.id)
            const response = await axios.put(
                `http://localhost:3000/api/v1/customer/booking/In_progress/${booking.id}`,
                null,
                {
                    withCredentials: true
                }
            );
            const b = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;
            setBooking(b);
           

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
              socket.emit("CLINET_CANCEL_CAR",booking.car_id.id)
            const response = await axios.put(
                `http://localhost:3000/api/v1/customer/booking/cancel/${booking.id}`,
                null,
                {
                    withCredentials: true
                }
            );
            const b = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;
            setBooking(b);
           

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


    // carousel images
    const images = [
        car_id.front_img,
        car_id.left_img,
        car_id.right_img,
        car_id.back_img
    ].filter(Boolean);
    const prev = () => setIdx((idx - 1 + images.length) % images.length);
    const next = () => setIdx((idx + 1) % images.length);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            {/* NAV BAR */}
            <nav className="bg-white shadow-sm p-4 text-sm text-gray-700 flex items-center space-x-4 container mx-auto rounded-b-lg">
                <Link to="/customer/home" className="text-blue-600 hover:underline">Home</Link>
                <span className="text-gray-400">/</span>
                <Link to="/customer/bookings" className="text-blue-600 hover:underline">My Bookings</Link>
                <span className="text-gray-400">/</span>
                <span className="font-semibold text-gray-800">Booking Details</span>
            </nav>

            {/* MAIN CONTENT */}
            <main className="flex-grow container mx-auto px-4 sm:px-6 py-8">

                <div className="flex flex-col md:flex-row w-full">
                    {/* LEFT: IMAGE CAROUSEL */}
                    <div className="w-full md:w-2/5 relative h-64 sm:h-80 bg-gray-200">
                        <img
                            src={images[idx]}
                            alt={`slide ${idx + 1}`}
                            className="w-full h-full object-cover"
                        />
                        <button
                            onClick={prev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 text-white p-2 rounded-full"
                        >
                            ‹
                        </button>
                        <button
                            onClick={next}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 text-white p-2 rounded-full"
                        >
                            ›
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                            {images.map((_, d) => (
                                <span
                                    key={d}
                                    onClick={() => setIdx(d)}
                                    className={`w-2 h-2 rounded-full cursor-pointer border-2 ${d === idx ? 'bg-white border-white' : 'bg-transparent border-white'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                    {/* SUMMARY & ACTIONS */}
                    <div className="flex justify-between items-start w-full md:w-3/5 p-4">
                        <div>
                            <h1 className="text-2xl font-bold mb-2">{car_id.name}</h1>
                            <ul className="text-sm text-gray-700 space-y-1 mb-4">
                                <li>• From: {new Date(start_date).toLocaleString('en-GB')}</li>
                                <li>• To: {new Date(end_date).toLocaleString('en-GB')}</li>
                                <li>Days: {days} days</li>
                                <li>Base price: {car_id.price.toLocaleString()} VND/day</li>
                                <li>Total: {total_amount.toLocaleString()} VND</li>
                                <li>Deposit: {deposit_amount.toLocaleString()} VND</li>
                                <li>Booking No.: {booking.id}</li>
                                <li>
                                    Booking status:{' '}
                                    <span
                                        className={
                                            status === 'CONFIRMED'
                                                ? 'text-green-600 font-semibold'
                                                : status === 'PENDING_DEPOSIT'
                                                    ? 'text-yellow-500 font-semibold'
                                                    : status === 'IN_PROGRESS'
                                                        ? 'text-blue-500 font-semibold'
                                                        : status === 'COMPLETED'
                                                            ? 'text-green-400 font-semibold'
                                                            : 'text-gray-500 font-semibold'
                                        }
                                    >
                                        {status}
                                    </span>
                                </li>
                            </ul>
                        </div>
                        <div className="flex flex-col space-y-2">
                        {bookingSocket !== "" ?(
                                <>
                                 {bookingSocket=== 'CONFIRMED' && (
                                    <button className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"  onClick={onConfirmClick}>
                                        Confirm Pick-up
                                    </button>
                                )}
                                {bookingSocket=== 'IN_PROGRESS' && (
                                    <button className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition" onClick={onReturnClick}>
                                        Return Car
                                    </button>
                                )}
                                {(bookingSocket === 'PENDING_DEPOSIT' || bookingSocket === 'CONFIRMED') && (
                                    <button className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition" onClick={ handleCancel}>
                                        Cancel Booking
                                    </button>
                                )}
                                </>
                        ): (
                           
                                <>
                                 {booking.status === 'CONFIRMED' && (
                                <button className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"  onClick={onConfirmClick}>
                                    Confirm Pick-up
                                </button>
                            )}
                            {booking.status === 'IN_PROGRESS' && (
                                <button className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition" onClick={onReturnClick}>
                                    Return Car
                                </button>
                            )}
                            {(booking.status === 'PENDING_DEPOSIT' || booking.status === 'CONFIRMED') && (
                                <button className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition" onClick={ handleCancel}>
                                    Cancel Booking
                                </button>
                            )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
                {/* TABS */}
                <div className="w-full mt-6 p-4 flex-grow">
                    <nav className="flex border-b">
                        {['booking', 'car', 'payment'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-3 text-center font-medium ${activeTab === tab
                                    ? 'border-b-4 border-blue-600 text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {tab === 'booking'
                                    ? 'Booking Information'
                                    : tab === 'car'
                                        ? 'Car Information'
                                        : 'Payment Information'}
                            </button>
                        ))}
                    </nav>

                    <div className="p-6 text-sm text-gray-700 space-y-6">
                        {/* TAB 1: BOOKING INFORMATION */}
                        {activeTab === 'booking' && (

                            <div >
                                {formErrors.length > 0 && (
                                    <div className="col-span-1 lg:col-span-2 bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-red-800">
                                                    Please correct the following errors:
                                                </h3>
                                                <div className="mt-2 text-sm text-red-700">
                                                    <ul className="list-disc pl-5 space-y-1">
                                                        {formErrors.map((error, index) => (
                                                            <li key={index}>{error}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="col-span-1 space-y-4 lg:space-y-6">
                                    {/* Renter's Information */}
                                    <div className="bg-white p-4 lg:p-6 rounded-lg shadow-lg">
                                        <h3 className="text-lg lg:text-xl font-bold mb-4">Renter's Information</h3>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div>
                                                <p><strong>Full Name:</strong> {customer?.name}</p>
                                                <p><strong>Phone:</strong> {customer?.phone_number}</p>
                                                <p><strong>Email:</strong> {customer?.email}</p>
                                                <p><strong>National ID:</strong> {customer?.national_id}</p>
                                                <p><strong>Address:</strong> {customer?.address}</p>
                                            </div>
                                            <div>
                                                <p><strong>Driving License:</strong></p>
                                                {customer?.driving_license && (
                                                    <img
                                                        src={customer.driving_license}
                                                        alt="Driving License"
                                                        className="w-full h-40 object-cover rounded-lg mt-2"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Driver's Information */}
                                    <div className="bg-white p-4 lg:p-6 rounded-lg shadow-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg lg:text-xl font-bold">Driver's Information</h3>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={sameAsRenter}
                                                    onChange={(e) => setSameAsRenter(e.target.checked)}
                                                    className="form-checkbox h-5 w-5 text-blue-600"
                                                />
                                                <span>Same as renter</span>
                                            </label>
                                        </div>

                                        {!sameAsRenter && (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    <div className="space-y-4">
                                                        <input
                                                            type="text"
                                                            name="fullName"
                                                            placeholder="Full Name"
                                                            value={driverInfo.fullName}
                                                            onChange={handleDriverInfoChange}
                                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        />
                                                        <input
                                                            type="date"
                                                            name="dateOfBirth"
                                                            value={driverInfo.dateOfBirth ? driverInfo.dateOfBirth.slice(0, 10) : ''}
                                                            onChange={handleDriverInfoChange}
                                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        />
                                                        <input
                                                            type="tel"
                                                            name="phoneNumber"
                                                            placeholder="Phone Number"
                                                            value={driverInfo.phoneNumber}
                                                            onChange={handleDriverInfoChange}
                                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        />
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            placeholder="Email"
                                                            value={driverInfo.email}
                                                            onChange={handleDriverInfoChange}
                                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        />
                                                        <input
                                                            type="text"
                                                            name="nationalId"
                                                            placeholder="National ID"
                                                            value={driverInfo.nationalId}
                                                            onChange={handleDriverInfoChange}
                                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div className="space-y-4">
                                                        <p className="font-medium">Driving License:</p>
                                                        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                                            <input
                                                                type="file"
                                                                name="drivingLicense"
                                                                onChange={handleFileChange}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                accept="image/*"
                                                            />
                                                            {driverInfo.drivingLicensePreview ? (
                                                                <img
                                                                    src={driverInfo.drivingLicensePreview}
                                                                    alt="Driving License Preview"
                                                                    className="w-full h-40 object-cover rounded-lg"
                                                                />
                                                            ) : (
                                                                <div className="text-gray-500">
                                                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                    </svg>
                                                                    <p className="mt-1">Click or drag image here</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <select
                                                        value={selectedProvince}
                                                        onChange={handleProvinceChange}
                                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">Select Province</option>
                                                        {addressData.map((item, idx) => (
                                                            <option key={idx} value={item.city}>{item.city}</option>
                                                        ))}
                                                    </select>

                                                    {selectedProvince && (
                                                        <select
                                                            value={selectedDistrict}
                                                            onChange={handleDistrictChange}
                                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            <option value="">Select District</option>
                                                            {districts.map((d, idx) => (
                                                                <option key={idx} value={d.district}>{d.district}</option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    {selectedDistrict && (
                                                        <select
                                                            value={selectedWard}
                                                            onChange={handleWardChange}
                                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            <option value="">Select Ward</option>
                                                            {wards.map((w, idx) => (
                                                                <option key={idx} value={w}>{w}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between pt-4">
                                        <button
                                            onClick={() => navigate(`/customer/bookings`)}
                                            className="px-4 py-2 lg:px-6 lg:py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm lg:text-base"
                                        >
                                            Cancel
                                        </button>
                                        {(booking.status === "PENDING_DEPOSIT"||booking.status === "CONFIRMED" ) ? (
                                            <button
                                                onClick={() => validateStep1() && handlePayment()}
                                                className="px-4 py-2 lg:px-6 lg:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
                                            >
                                                {isSubmitting ? 'Đang xử lý...' : 'Save'}
                                            </button>
                                        ) : null}
                                    </div>


                                </div>
                            </div>
                        )}

                        {/* TAB 2: CAR INFORMATION */}
                        {activeTab === 'car' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Col 1 */}
                                <div className="space-y-1">
                                    <p>
                                        <span className="font-semibold">License plate:</span>{' '}
                                        {car_id.license_plate}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Brand:</span>{' '}
                                        {car_id.brand}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Production year:</span>{' '}
                                        {new Date(car_id.MFG).getFullYear()}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Transmission:</span>{' '}
                                        {car_id.transmission_type}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Mileage:</span>{' '}
                                        {car_id.mileage} km
                                    </p>
                                </div>
                                {/* Col 2 */}
                                <div className="space-y-1">
                                    <p>
                                        <span className="font-semibold">Color:</span>{' '}
                                        {car_id.color}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Model:</span>{' '}
                                        {car_id.model}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Seats:</span>{' '}
                                        {car_id.seat}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Fuel:</span>{' '}
                                        {car_id.fuel_type}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Fuel consumption:</span>{' '}
                                        {car_id.fuel_consumption} L/100km
                                    </p>
                                </div>
                                {/* Full-width */}
                                <div className="sm:col-span-2">
                                    <p className="font-semibold">Address:</p>
                                    <p className="text-gray-600">{car_id.location}</p>
                                    <p className="mt-2 font-semibold">Description:</p>
                                    <p className="text-gray-600 mb-4">{car_id.description}</p>

                                    {/* Additional functions */}
                                    <p className="font-semibold">Additional functions:</p>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        {Object.entries(ADD_MAP).map(([key, label]) => (
                                            <label
                                                key={key}
                                                className="flex items-center space-x-2"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={additional.includes(key)}
                                                    disabled
                                                    className="w-4 h-4"
                                                />
                                                <span>{label}</span>
                                            </label>
                                        ))}
                                    </div>

                                    {/* Terms of use */}
                                    <p className="font-semibold">Terms of use:</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        {Object.entries(TERM_MAP).map(([key, label]) => (
                                            <label
                                                key={key}
                                                className="flex items-center space-x-2"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={terms.includes(key)}
                                                    disabled
                                                    className="w-4 h-4"
                                                />
                                                <span>{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: PAYMENT INFORMATION */}
                        {activeTab === 'payment' && (
                            <div className="space-y-2">
                                <p>
                                    <span className="font-semibold ">Current balance:</span>{'   '}
                                    <span className="font-semibold  text-red-700">{userBalance.toLocaleString()} VND</span>

                                </p>
                            </div>
                        )}
                    </div>
                </div>


            </main>

            <Footer />
        </div>
    );
}
