// src/pages/CarDetails.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import Slider from "react-slick";
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Footer from '../components/Footer';

function StarRating({ rating }) {
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  return (
    <div className="flex items-center text-yellow-400 space-x-1">
      {Array(fullStars).fill().map((_, i) => <FaStar key={i} />)}
      {halfStar && <FaStarHalfAlt />}
      {Array(emptyStars).fill().map((_, i) => <FaRegStar key={i} />)}
    </div>
  );
}

export default function CarDetails({ setUser }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [car, setCar] = useState(null);
  const [additional, setAdditional] = useState([]);
  const [terms, setTerms] = useState([]);
  const [ownerUser, setOwnerUser] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    axios.get(`http://localhost:3000/api/v1/customer/search_car/${id}`, { withCredentials: true })
      .then(({ data }) => {
        if (data.success) {
          const c = data.data[0];
          setCar(c);
          if (data.user?.length) {
            setUser(data.user[0]);
            setOwnerUser(data.user[0]);
          }
          setAdditional(data.additonal.find(a => a.car_id === c.id)?.additional_function_id.split('-') || []);
          setTerms(data.team_of_user.find(t => t.car_id === c.id)?.term_of_use_id.split('-') || []);
        }
      })
      .catch(console.error);
  }, [id, setUser]);

  if (!car) {
    return <div className="flex-grow flex items-center justify-center text-gray-500">Loading car details...</div>;
  }

  // Slider settings
  const settings = {
    dots: true,
    arrows: true,         // bật mũi tên
    infinite: false,      // nếu bạn không muốn carousel loop mãi, đổi thành false
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    draggable: true,      // cho phép kéo chuột
    swipeToSlide: true,   // kéo thả trượt đến slide tiếp theo
  };

  const images = [car.front_img, car.left_img, car.back_img, car.right_img].filter(Boolean);

  const ADD_MAP = { '1': 'Bluetooth', '2': 'GPS', '3': 'Camera', '4': 'Sun roof', '5': 'Child lock', '6': 'Child seat', '7': 'DVD', '8': 'USB' };
  const TERM_MAP = { '1': 'No smoking', '2': 'No pet', '3': 'No food in car', '4': 'Other' };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Breadcrumb */}
   
  <nav className="bg-white shadow-sm p-4 text-sm text-gray-600 flex items-center ml-20">
    <div className="flex items-center">
      <Link to="/customer/home" className="hover:underline text-blue-600 ">Home</Link>
      <span className="mx-2">&gt;</span>
      <span onClick={() => navigate(-1)} className="hover:underline cursor-pointer text-blue-600">Search Results</span>
      <span className="mx-2">&gt;</span>
      <span className="font-semibold ml-1">Car Details</span>
    </div>
  </nav>
  <h1 className="text-2xl font-bold text-center">Car Details</h1>

      {/* Main Content */}
      <main className="flex-grow container mx-auto p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Image slider */}
          <div className="lg:w-2/3 bg-white rounded-lg shadow-lg overflow-visible relative">
            <Slider {...settings} className="relative">
              {images.map((src, idx) => (
                <div key={idx} className="h-80 flex items-center justify-center bg-gray-200">
                  <img src={src} alt={`Car view ${idx+1}`} className="object-cover h-full w-full" />
                </div>
              ))}
            </Slider>
          </div>

          {/* Details panel */}
          <div className="lg:w-1/3 bg-white rounded-lg shadow-lg p-6 flex flex-col">
            <h2 className="text-2xl font-bold mb-4">{car.name}</h2>
            <div className="flex items-center mb-2">
              <span className="font-medium mr-2">Ratings:</span>
              {car.rating
                ? <StarRating rating={Math.round(car.rating * 2) / 2} />
                : <span className="text-gray-500">(No ratings yet)</span>
              }
            </div>
            <p className="mb-1"><span className="font-medium">Rides:</span> {car.rides}</p>
            <p className="mb-1"><span className="font-medium">Price:</span> <span className="text-lg text-red-600">{car.price} USD/Day</span></p>
            <p className="mb-1"><span className="font-medium">Location:</span> {car.location}</p>
            <p className="mb-4">
              <span className="font-medium">Status:</span> 
              <span className={`ml-1 font-semibold ${car.status === 'available' ? 'text-green-600' : 'text-red-600'}`}> 
                {car.status.charAt(0).toUpperCase() + car.status.slice(1)}
              </span>
            </p>
            <button
              onClick={() => navigate(`/book/${car.id}`)}
              className="mt-auto bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
            >
              Rent Now
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 bg-white rounded-lg shadow-lg">
          <div className="flex border-b">
            {['basic','details','terms'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-center font-medium ${activeTab===tab ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {tab === 'basic' ? 'Basic Info' : tab === 'details' ? 'Details' : 'Terms of Use'}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Info */}
            {activeTab === 'basic' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p><span className="font-medium">License Plate:</span> {car.license_plate}</p>
                  <p><span className="font-medium">Brand:</span> {car.brand}</p>
                  <p><span className="font-medium">Year:</span> {new Date(car.MFG).getFullYear()}</p>
                  <p><span className="font-medium">Transmission:</span> {car.transmission_type}</p>
                  <p><span className="font-medium">Documents:</span></p>
                  <ul className="list-disc list-inside text-gray-700">
                    <li>Registration paper: Verified</li>
                    <li>Certificate of Inspection: Verified</li>
                    <li>Insurance: Not available</li>
                  </ul>
                  <p className="text-sm text-gray-500 mt-2">* Full documents visible after deposit</p>
                </div>
                <div className="space-y-2">
                  <p><span className="font-medium">Color:</span> {car.color}</p>
                  <p><span className="font-medium">Model:</span> {car.model}</p>
                  <p><span className="font-medium">Seats:</span> {car.seat}</p>
                  <p><span className="font-medium">Fuel Type:</span> {car.fuel_type}</p>
                </div>
              </div>
            )}

            {/* Details */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                <p><span className="font-medium">Mileage:</span> {car.mileage} km</p>
                <p><span className="font-medium">Fuel Consumption:</span> {car.fuel_consumption} L/100km</p>
                <p><span className="font-medium">Address:</span> {ownerUser ? car.location : <em className="text-gray-500">Visible after deposit</em>}</p>
                <p><span className="font-medium">Description:</span> {car.description}</p>
                <div>
                  <p className="font-medium mb-2">Additional Functions:</p>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(ADD_MAP).map(([key,label]) => (
                      <label key={key} className="flex items-center space-x-2">
                        <input type="checkbox" checked={additional.includes(key)} disabled className="w-4 h-4"/>
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Terms */}
            {activeTab === 'terms' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Base Price:</span>
                  <input value={car.price.toLocaleString()} readOnly className="border px-2 py-1 w-28 text-right rounded" />
                  <span>VND / Day</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Deposit:</span>
                  <input value={car.required_deposit.toLocaleString()} readOnly className="border px-2 py-1 w-28 text-right rounded" />
                  <span>VND</span>
                </div>
                <p className="font-medium">Terms of Use:</p>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(TERM_MAP).map(([key,label]) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input type="checkbox" checked={terms.includes(key)} disabled className="w-4 h-4"/>
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

