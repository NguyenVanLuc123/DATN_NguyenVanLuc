// src/pages/customer/Booking.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { fetchHomeData } from '../../api/customer/HomeApi';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import addressData from "../../data/address.listJson";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Footer from '../../components/Footer';
import toast from 'react-hot-toast';
import { socket } from "../../socket.io/socket";
const BookingForm = ({ setUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formErrors, setFormErrors] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [renterInfo, setRenterInfo] = useState(null);
  const [sameAsRenter, setSameAsRenter] = useState(false);
  const [pickupDateTime, setPickupDateTime] = useState(null);
  const [days, setDays] = useState(null);
  const [returnDateTime, setReturnDateTime] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [bookingNumber, setBookingNumber] = useState('');
  const [carDetail, setCarDetail] = useState(null);
  //hàm về VNpay thanh toán
  const [vnpayUrl, setVnpayUrl] = useState('');
  const [bankPaid, setBankPaid] = useState(false);
  const popupRef = useRef(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [isPayingViaVnpay, setIsPayingViaVnpay] = useState(false);
  // State cho địa chỉ
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [user_id,setUserid]=useState("");
  const [driverInfo, setDriverInfo] = useState(() => {
    const saved = localStorage.getItem('driverInfo');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        localStorage.removeItem('driverInfo');
      }
    }
    return {
      fullName: '',
      dateOfBirth: '',
      phoneNumber: '',
      email: '',
      nationalId: '',
      drivingLicense: '',
      city: '',
      district: '',
      ward: ''
    };
  });
  

  // Cấu hình cho image slider
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000
  };

  const { state,search } = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWard, setSelectedWard] = useState('');
  const [location, setLocation] = useState(() => state?.PickUpLocation ||'');

  // 2) pickupLocation: "city-district-ward"
  const [pickUpLocation, setPickupLocation] = useState(() => {
    if (!state?.PickUpLocation) return '';
    const params = new URLSearchParams(state.PickUpLocation);
    const city     = params.get('city');
    const district = params.get('district');
    const ward     = params.get('ward');
    return [city, district, ward].filter(Boolean).join('-');
  });
  useEffect(() => {
   
    const params = new URLSearchParams(search);
    const paidParam = params.get('paid') === 'true';
    const stepParam = Number(params.get('step')) || 1;
  
    // đọc từ localStorage nếu không có param
    const paidLS = localStorage.getItem('paymentCompleted') === 'true';
    const methodLS = localStorage.getItem('selectedPaymentMethod') || '';
  
    const paid = paidParam || paidLS;
    setBankPaid(paid);
    setPaymentCompleted(paid);
  
    // set lại phương thức nếu có trong LS
    if (methodLS) setSelectedPaymentMethod(methodLS);
  
    // quyết định bước hiện tại
    if (paid && stepParam < 2) {
      setCurrentStep(2);
    } else {
      setCurrentStep(stepParam);
    }
  }, [search]);
  useEffect(() => {
    if (sameAsRenter ) {
      const info = {
        fullName: renterInfo.name,
        dateOfBirth: renterInfo.date_of_birth?.split('T')[0] || '',
        phoneNumber: renterInfo.phone_number,
        email: renterInfo.email,
        nationalId: renterInfo.national_id,
        drivingLicense: renterInfo.driving_license,
        city: renterInfo.address?.split(' - ')[0] || '',
        district: renterInfo.address?.split(' - ')[1] || '',
        ward: renterInfo.address?.split(' - ')[2] || ''
      };
      setDriverInfo(info);
      localStorage.setItem('driverInfo', JSON.stringify(info));
    }
  }, [sameAsRenter]);
  // 📌 Lưu driverInfo
useEffect(() => {
  localStorage.setItem('driverInfo', JSON.stringify(driverInfo));
}, [driverInfo]);

useEffect(() => {
  const car_id_save=localStorage.getItem('car_id')
  if(car_id_save){
    navigate(`/customer/booking/${car_id_save}`)
  }
}, [id]);

// 📌 Lưu pickupLocation
useEffect(() => {
  
  if (pickUpLocation) {
    localStorage.setItem('pickUpLocation', pickUpLocation);
  }
}, [pickUpLocation]);

  // Hàm mở popup
  const openVnpayPopup = () => {
    if (!vnpayUrl) return;
    setIsPayingViaVnpay(true);
    const width = 600, height = 800;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    popupRef.current = window.open(
      vnpayUrl,
      'vnpayWindow',
      `width=${width},height=${height},left=${left},top=${top}`
    );

     // Polling: kiểm tra popup đã bị user đóng hay chưa
     const timer = setInterval(() => {
      if (popupRef.current?.closed) {
        clearInterval(timer);
        setIsPayingViaVnpay(false);
      }
    }, 500);
  };

  // Nhận message từ vnpay-return.html
  useEffect(() => {
    function handleMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (event.data === 'VNPAY_SUCCESS') {
        setBankPaid(true);
        setPaymentCompleted(true);
          // lưu vào localStorage
  localStorage.setItem('paymentCompleted', 'true');
  localStorage.setItem('car_id', id);
  // chuyển bước luôn (tránh phải reload mới điều hướng)
  setCurrentStep(2);
        toast.success('Thanh toán thành công!');
      } else if (event.data === 'VNPAY_FAIL') {
        toast.error('Thanh toán thất bại.');
      }
      // Đóng popup nếu còn mở
      setIsPayingViaVnpay(false);
      if (popupRef.current) popupRef.current.close();
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (selectedPaymentMethod === 'banking') {
      const price=calculateTotal().deposit;
      const payload = {
        amount: calculateTotal().deposit,


        returnUrl: `http://localhost:3000/api/v1/vnpay/return/booking/${user_id}/${price}`
      };

      
      axios.post(
        'http://localhost:3000/api/v1/vnpay/create',
        payload,
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      )
        .then(res => {
          console.log('VNPay URL:', res.data.url);
          setVnpayUrl(res.data.url);
        })
        .catch(err => {
          console.error('Error creating VNPay URL:', err);
          toast.error('Không tạo được link VNPay');
        });
    }
  }, [selectedPaymentMethod]);
 

  // Fetch thông tin người thuê và xe
  useEffect(() => {
   
    const fetchData = async () => {
      try {
        // Fetch thông tin người thuê
        const renterResponse = await fetchHomeData();
        if (renterResponse.success) {
          setRenterInfo(renterResponse.data);
          setUser(renterResponse.data);
           setUserid(renterResponse.data.user_id)
        } else {
          navigate('/login');
          return;
        }

        // Fetch thông tin xe
        const carResponse = await axios.get(
          `http://localhost:3000/api/v1/customer/search_car/${id}`,
          { withCredentials: true }
        );

        if (carResponse.data.success) {
          setCarDetail(carResponse.data.data[0]);
        }
      } catch (error) {
        if(!localStorage.getItem('car_id')){
        
        navigate(`/search_car_result?${localStorage.getItem('Location')}`)
        };
      }
    };

    fetchData();
  }, [id, navigate, setUser]);

  // Các hàm xử lý địa chỉ
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

  // Generate VNPay QR code URL when bank payment selected
  // Giả sử trong BookingForm.jsx, bên trong useEffect:


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

  const calculateTotal = () => {
    if (!pickupDateTime || !returnDateTime || !carDetail) return { days: 0, pricePerDay: 0, total: 0, deposit: 0 };

    const days = Math.ceil((returnDateTime - pickupDateTime) / (1000 * 60 * 60 * 24));
    const price = carDetail?.price || 0;
    const deposit = carDetail?.required_deposit || 15000000;
    localStorage.setItem("days",days);
    return {
      days,
      pricePerDay: price,
      total: days * price,
      deposit: deposit
    };
  };

  const validateStep1 = () => {
    const errors = [];

    if (!pickupDateTime || !returnDateTime) {
      errors.push('Vui lòng chọn thời gian thuê và trả xe');
    } else {
      // Kiểm tra thời gian trả phải sau thời gian thuê
      if (returnDateTime <= pickupDateTime) {
        errors.push('Thời gian trả xe phải sau thời gian thuê xe');
      }
    }

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
  useEffect(() => {
    const ls = localStorage;
    if (ls.getItem('pickupDateTime')) {
      setPickupDateTime(new Date(ls.getItem('pickupDateTime')));
    }
     if (ls.getItem('days')) {
    setDays(ls.getItem('days'));
    }
    if (ls.getItem('returnDateTime')) {
      setReturnDateTime(new Date(ls.getItem('returnDateTime')));
    }
    const method = ls.getItem('selectedPaymentMethod');
    if (method) setSelectedPaymentMethod(method);
  
    if (ls.getItem('pickUpLocation')) {
      setPickupLocation(ls.getItem('pickUpLocation'));
    }
    if (ls.getItem('driverInfo')) {
      setDriverInfo(JSON.parse(ls.getItem('driverInfo')));
    }
    // total/deposit bạn đã khôi phục trong renderStep2
  }, []);  
  const handlePayment = async () => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      // Thêm các thông tin cơ bản
      formData.append('car_id', id);
      formData.append('pickup_datetime', pickupDateTime.toISOString());
      formData.append('return_datetime', returnDateTime.toISOString());
      formData.append('payment_method', selectedPaymentMethod);
      formData.append('total_amount', localStorage.getItem("totalAmount"));
      formData.append('deposit_amount', localStorage.getItem("depositAmount"));
      formData.append('pickUpLocation', pickUpLocation);
      formData.append('days',localStorage.getItem("days"))

      // Xử lý driver_info
      if (sameAsRenter) {
        // Chuyển renterInfo thành object thông thường
        const driverInfoObj = {
          fullName: renterInfo.name,
          dateOfBirth: renterInfo.date_of_birth,
          phoneNumber: renterInfo.phone_number,
          email: renterInfo.email,
          nationalId: renterInfo.national_id,
          drivingLicense: renterInfo.driving_license,
          city: renterInfo.address?.split(' - ')[0] || '',
          district: renterInfo.address?.split(' - ')[1] || '',
          ward: renterInfo.address?.split(' - ')[2] || ''
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
      socket.emit("CLIENT_BOOKING",id);
      const response = await axios.post(
        'http://localhost:3000/api/v1/customer/booking',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        }
      );
      if(response.data.status){
        console.log(response.data.message)
        navigate(`/search_car_result?${localStorage.getItem('Location')}`,{state: { toastMessage: response.data.message }})

      }
      else{
        toast.success('Đặt xe thành công!');
        setBookingNumber(response.data.data.bookingId );
        setCurrentStep(3);
      }
      // đây chỉ chạy khi status code 2xx
     localStorage.removeItem('days');
      localStorage.removeItem('pickupDateTime');
      localStorage.removeItem('returnDateTime');
      localStorage.removeItem('totalAmount');
      localStorage.removeItem('depositAmount');
      localStorage.removeItem('selectedPaymentMethod');
      localStorage.removeItem('paymentCompleted');
      localStorage.removeItem('pickUpLocation');
      localStorage.removeItem('driverInfo');
      localStorage.removeItem('car_id');
      localStorage.removeItem('Location');

      

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

  const renderStep1 = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
      {/* Hiển thị thông báo lỗi */}
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
      {/* Car Information */}
      <div className="col-span-1">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-4 lg:mb-6">
          <Slider {...sliderSettings} className="w-full h-48 lg:h-64">
            {carDetail && [
              carDetail.front_img,
              carDetail.back_img,
              carDetail.left_img,
              carDetail.right_img
            ].map((img, index) => (
              <div key={index} className="h-64">
                <img
                  src={img}
                  alt={`${carDetail.name} view ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </Slider>
          <div className="p-4 lg:p-6">
            <h3 className="text-2xl font-bold mb-4">{carDetail?.name}</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-gray-600">Ratings: </span>
                <div className="flex ml-2">
                  {[...Array(5)].map((_, index) => (
                    <span key={index} className="text-yellow-400">
                      {index < (carDetail?.rating || 0) ? "★" : "☆"}
                    </span>
                  ))}
                </div>
                <span className="ml-2 text-gray-600">({carDetail?.rating || 'No ratings'})</span>
              </div>
              <p className="text-gray-600">Number of rides: {carDetail?.rides || 0}</p>
              <p className="text-lg font-semibold text-red-600">
                Price: {carDetail?.price?.toLocaleString()} VND/day
              </p>
              <p className="text-gray-600">Location: {carDetail?.location}</p>
              <p className="text-gray-600">
                Status: <span className="text-green-600 font-semibold">{carDetail?.status || 'Available'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <div className="col-span-1 space-y-4 lg:space-y-6">
        {/* Renter's Information */}
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-lg">
          <h3 className="text-lg lg:text-xl font-bold mb-4">Renter's Information</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <p><strong>Full Name:</strong> {renterInfo?.name}</p>
              <p><strong>Phone:</strong> {renterInfo?.phone_number}</p>
              <p><strong>Email:</strong> {renterInfo?.email}</p>
              <p><strong>National ID:</strong> {renterInfo?.national_id}</p>
              <p><strong>Address:</strong> {renterInfo?.address}</p>
            </div>
            <div>
              <p><strong>Driving License:</strong></p>
              {renterInfo?.driving_license && (
                <img
                  src={renterInfo.driving_license}
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
                    value={driverInfo.dateOfBirth}
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

        {/* Rental Period */}
        <div className="bg-white p-4 lg:p-6 rounded-lg shadow-lg">
          <h3 className="text-lg lg:text-xl font-bold mb-4">Thời Gian Thuê Xe</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-medium">Ngày giờ nhận xe</label>
              <DatePicker
                selected={pickupDateTime}
                onChange={date => {
                  setPickupDateTime(date);
                  if (returnDateTime && returnDateTime <= date) {
                    const newReturnDate = new Date(date);
                    newReturnDate.setDate(date.getDate() + 1);
                    setReturnDateTime(newReturnDate);
                  }
                }}
                showTimeSelect
                dateFormat="dd/MM/yyyy HH:mm"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                minDate={new Date()}
                placeholderText="Chọn ngày giờ nhận xe"
                timeFormat="HH:mm"
                timeIntervals={30}
                timeCaption="Giờ"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Ngày giờ trả xe</label>
              <DatePicker
                selected={returnDateTime}
                onChange={date => setReturnDateTime(date)}
                showTimeSelect
                dateFormat="dd/MM/yyyy HH:mm"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                minDate={pickupDateTime || new Date()}
                minTime={pickupDateTime ? new Date(pickupDateTime) : new Date()}
                maxTime={new Date(new Date().setHours(23, 59))}
                placeholderText="Chọn ngày giờ trả xe"
                timeFormat="HH:mm"
                timeIntervals={30}
                timeCaption="Giờ"
                disabled={!pickupDateTime}
              />
            </div>
          </div>
          {pickupDateTime && returnDateTime && (
            <div className="mt-4 text-sm text-gray-600">
              Thời gian thuê: {calculateTotal().days} ngày
            </div>
          )}
        </div>


        {/* Booking Summary */}
        {(pickupDateTime && returnDateTime) && (
          <div className="bg-white p-4 lg:p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">Booking Summary</h3>
            <div className="space-y-2">
              <p className="flex justify-between">
                <span>Number of days:</span>
                <span className="font-semibold">{calculateTotal().days}</span>
              </p>
              <p className="flex justify-between">
                <span>Price per day:</span>
                <span className="font-semibold">{calculateTotal().pricePerDay.toLocaleString()} VND</span>
              </p>
              <p className="flex justify-between">
                <span>Total:</span>
                <span className="font-semibold text-blue-600">{calculateTotal().total.toLocaleString()} VND</span>
              </p>
              <p className="flex justify-between">
                <span>Deposit:</span>
                <span className="font-semibold text-red-600">{calculateTotal().deposit.toLocaleString()} VND</span>
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <button
            onClick={() => navigate(`/search_car_result?${location}`)}
            className="px-4 py-2 lg:px-6 lg:py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm lg:text-base"
          >
            Cancel
          </button>
          <button
             onClick={() => {
                 if (!validateStep1()) return;
                 // Lưu ngày giờ và số tiền
                 localStorage.setItem('pickupDateTime', pickupDateTime.toISOString());
                 localStorage.setItem('returnDateTime', returnDateTime.toISOString());
                 const { total, deposit } = calculateTotal();
                localStorage.setItem('totalAmount', total);
                 localStorage.setItem('depositAmount', deposit);
                 
                 setCurrentStep(2);
               }}
            className="px-4 py-2 lg:px-6 lg:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const totalToShow = Number(localStorage.getItem('totalAmount')) ?? calculateTotal().total;
    const depositToShow = Number(localStorage.getItem('depositAmount')) ?? calculateTotal().deposit;
    return (
      <div className="max-w-2xl mx-auto px-4 lg:px-0">
        <div className="bg-white p-4 lg:p-8 rounded-lg shadow-lg">
          <h3 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Phương Thức Thanh Toán</h3>
          <div className="space-y-4 lg:space-y-6">

            {/* Chỉ hiện lựa chọn khi chưa thanh toán hoàn tất */}
            {!paymentCompleted && (
              <>
                {/* Ví của tôi */}
                <label className="block p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="wallet"
                    checked={selectedPaymentMethod === 'wallet'}
                    onChange={e => {
                        setSelectedPaymentMethod(e.target.value);
                         localStorage.setItem('selectedPaymentMethod', e.target.value);
                       }}
                    disabled={paymentCompleted|| isPayingViaVnpay}
                    className="mr-3 h-5 w-5 text-blue-600"
                  />
                  <span className="font-medium">Ví của tôi</span>
                  <div className="ml-8 mt-2">
                    <div className="text-sm text-gray-600">
                      Số dư hiện tại: <span className="font-semibold text-blue-600">{renterInfo?.balance?.toLocaleString() || 0} VND</span>
                    </div>
                    {calculateTotal().deposit > (renterInfo?.balance || 0) && (
                      <div className="mt-2 text-sm text-red-600">
                        * Số dư không đủ để đặt cọc ({calculateTotal().deposit.toLocaleString()} VND)
                      </div>
                    )}
                  </div>
                </label>

                {/* Tiền mặt */}
                <label className="block p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={selectedPaymentMethod === 'cash'}
                    onChange={e => {
                      setSelectedPaymentMethod(e.target.value);
                       localStorage.setItem('selectedPaymentMethod', e.target.value);
                     }}
                    disabled={paymentCompleted|| isPayingViaVnpay}
                    className="mr-3 h-5 w-5 text-blue-600"
                  />
                  <span className="font-medium">Tiền mặt</span>
                  <div className="ml-8 mt-2">
                    <div className="text-sm text-gray-600 mb-2">
                      Quy trình thanh toán tiền mặt:
                    </div>
                    <ol className="list-decimal ml-4 text-sm text-gray-600">
                      <li>Nhân viên sẽ liên hệ qua số điện thoại {renterInfo?.phone_number}</li>
                      <li>Đặt cọc {calculateTotal().deposit.toLocaleString()} VND khi nhận xe</li>
                      <li>Thanh toán {calculateTotal().total.toLocaleString()} VND khi trả xe</li>
                      <li>Nhận lại tiền cọc sau khi hoàn tất thủ tục trả xe</li>
                    </ol>
                  </div>
                </label>

                {/* Chuyển khoản ngân hàng */}
                <label className="block p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="banking"
                    checked={selectedPaymentMethod === 'banking'}
                    onChange={e => { setSelectedPaymentMethod(e.target.value);localStorage.setItem('selectedPaymentMethod', e.target.value); setBankPaid(false);setIsPayingViaVnpay(false); }}
                    disabled={paymentCompleted}
                    className="mr-3 h-5 w-5 text-blue-600"
                  />
                  <span className="font-medium">Chuyển khoản ngân hàng</span>
                </label>
              </>
            )}

            {/* Nút Thanh toán VNPAY (chỉ khi chọn bank & chưa thanh toán xong) */}
            {selectedPaymentMethod === 'banking' && !paymentCompleted && (
              <div className="p-4 border rounded-lg space-y-4">
                {vnpayUrl
                  ? (
                    <button
                      onClick={openVnpayPopup}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Thanh toán VNPAY
                    </button>
                  )
                  : <p>Đang tạo link thanh toán...</p>
                }
              </div>
            )}

            {/* Thông báo đã thanh toán thành công */}
            {paymentCompleted && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                🎉 Bạn đã thanh toán thành công bằng VNPAY.
              </div>
            )}

          </div>

          {/* Tổng quan và nút điều hướng */}
          <div className="mt-6 lg:mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Tổng Quan Thanh Toán:</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Tổng tiền thuê xe:</span>
                  <span className="font-semibold">{totalToShow.toLocaleString()} VND</span>
                </div>
                <div className="flex justify-between">
                  <span>Tiền đặt cọc:</span>
                 
                  <span className="font-semibold text-red-600">{depositToShow.toLocaleString()} VND</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span>Phương thức thanh toán:</span>
                  <span className="font-semibold">
                    {selectedPaymentMethod === 'wallet' && 'Ví của tôi'}
                    {selectedPaymentMethod === 'cash' && 'Tiền mặt'}
                    {selectedPaymentMethod === 'banking' && 'Chuyển khoản'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Nút Quay lại & Xác nhận thanh toán */}
          <div className="flex justify-between mt-6 lg:mt-8">
            {!paymentCompleted &&(<button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Quay lại
            </button>)}
            
            <button
              onClick={handlePayment}
              disabled={
                isSubmitting ||
                !selectedPaymentMethod ||
                (selectedPaymentMethod === 'wallet' && calculateTotal().deposit > (renterInfo?.balance || 0)) ||
                (selectedPaymentMethod === 'banking' && !bankPaid)
              }
              className={`px-4 py-2 rounded-lg text-sm lg:text-base flex items-center justify-center ${selectedPaymentMethod === 'banking' && !bankPaid ||!selectedPaymentMethod
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'

                }`}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
            </button>
          </div>
        </div>
      </div>
    );
  };



  const renderStep3 = () => (
    <div className="max-w-2xl mx-auto px-4 lg:px-0">
      <div className="bg-white p-6 lg:p-8 rounded-lg shadow-lg text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-4">Booking Successful!</h3>
          <p className="text-gray-600">
            You've successfully booked {carDetail?.name} from{' '}
            {new Date(pickupDateTime).toLocaleString()} to{' '}
            {new Date(returnDateTime).toLocaleString()}.
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-8">
          <p className="text-lg font-medium mb-2">Your booking number is:</p>
          <p className="text-2xl font-bold text-blue-600">{bookingNumber}</p>
        </div>

        <p className="text-gray-600 mb-8">
          Our operator will contact you with further guidance about pickup.
        </p>

        <div className="flex flex-col lg:flex-row justify-center space-y-4 lg:space-y-0 lg:space-x-4">
          <button
            onClick={() => navigate('/customer/home')}
            className="px-4 py-2 lg:px-6 lg:py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm lg:text-base"
          >
            Go to homepage
          </button>
          <button
            onClick={() => navigate(`/search_car_result?${location}`)}
            className="px-4 py-2 lg:px-6 lg:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
          >
            Book another car
          </button>
          <button
            onClick={() => navigate(`/customer/bookingdetail/${bookingNumber}`)}
            className="px-4 py-2 lg:px-6 lg:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm lg:text-base"
          >
            View Booking
          </button>
        </div>  
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        <div className="container mx-auto px-4 py-4 lg:py-8">
          {/* Stepper */}
          <div className="flex justify-between mb-6 lg:mb-8">
            {['Booking Information', 'Payment', 'Finish'].map((step, index) => (
              <div
                key={index}
                className={`flex-1 text-center relative ${currentStep >= index + 1 ? 'text-blue-600' : 'text-gray-400'
                  }`}
              >
                <div className="mb-2">
                  <span className={`w-8 h-8 rounded-full inline-flex items-center justify-center ${currentStep >= index + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                    }`}>
                    {index + 1}
                  </span>
                </div>
                <span className="text-sm font-medium">{step}</span>
                {index < 2 && (
                  <div className={`absolute top-4 left-1/2 w-full h-0.5 ${currentStep > index + 1 ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                )}
              </div>
            ))}
          </div>

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BookingForm;