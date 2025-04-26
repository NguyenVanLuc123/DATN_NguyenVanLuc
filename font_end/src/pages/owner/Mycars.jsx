import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import Footer from '../../components/Footer';

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

  return (
    <div className="flex flex-col md:flex-row bg-white shadow-lg rounded-lg overflow-hidden mb-8 transform hover:-translate-y-1 transition">
      <div className="relative md:w-1/2 h-64">
        <img src={images[idx]} alt={`${car.name} slide ${idx + 1}`} className="w-full h-full object-cover" />
        <button onClick={prev} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-2 rounded-full hover:bg-opacity-50">‹</button>
        <button onClick={next} className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-2 rounded-full hover:bg-opacity-50">›</button>
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, dot) => (
            <span key={dot} onClick={() => setIdx(dot)} className={`w-3 h-3 rounded-full cursor-pointer border-2 ${dot === idx ? 'bg-white border-white' : 'bg-transparent border-white'}`} />
          ))}
        </div>
      </div>
      <div className="md:w-1/2 p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">{car.name}</h2>
          <div className="flex items-center mb-2">
            <StarRating rating={Math.round((car.rating || 0) * 2) / 2} />
            {!car.rating && <span className="ml-2 text-gray-500">No ratings yet</span>}
          </div>
          <p className="text-gray-600 mb-1">Rides: <span className="font-semibold">{car.rides}</span></p>
          <p className="text-red-600 text-lg font-semibold mb-1">{car.price.toLocaleString()} VND/day</p>
          <p className="text-gray-700 mb-1">Location: <span className="font-medium">{car.location}</span></p>
          <p className="text-gray-700">
            Status:&nbsp;
            <span className={car.status === 'available' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
              {car.status}
            </span>
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={() => navigate(`/owner/car/${car.id}`)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full transition">View details</button>
          {car.booking === 'PENDING_DEPOSIT' && (
            <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full transition">Confirm deposit</button>
          )}
          {car.booking === 'PENDING_PAYMENT' && (
            <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full transition">Confirm payment</button>
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
      case 'newest':     return arr.sort((a, b) => b.id - a.id);
      case 'oldest':     return arr.sort((a, b) => a.id - b.id);
      case 'priceAsc':   return arr.sort((a, b) => a.price - b.price);
      case 'priceDesc':  return arr.sort((a, b) => b.price - a.price);
      default: return arr;
    }
  }, [cars, sort]);

  const paged = sorted.slice((page - 1) * perPage, page * perPage);
  const total = Math.ceil(sorted.length / perPage);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm p-4 text-sm text-gray-600 flex items-center ml-20">
        <div className="flex items-center">
          <Link to="/owner/home" className="hover:underline text-blue-600">Home</Link>
          <span className="mx-2">&gt;</span>
          <span className="font-semibold ml-1">My Cars</span>
        </div>
      </nav>
      <main className="flex-grow container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold mb-4 md:mb-0">My Cars</h1>
          <div className="flex space-x-4 items-center">
            <button className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition">Add Car</button>
            <select value={sort} onChange={e => setSort(e.target.value)} className="border border-gray-300 rounded px-4 py-2">
              <option value="newest">Newest to Latest</option>
              <option value="oldest">Latest to Newest</option>
              <option value="priceAsc">Price Low to High</option>
              <option value="priceDesc">Price High to Low</option>
            </select>
          </div>
        </div>
        {paged.map(car => <CarCard key={car.id} car={car} />)}
        <div className="flex justify-center items-center space-x-2 mt-12">
          <button onClick={() => setPage(p => Math.max(p - 1, 1))} className="px-4 py-2 bg-white border rounded hover:bg-gray-100 transition">&lt;&lt;</button>
          {[...Array(total)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`px-4 py-2 border rounded transition ${i + 1 === page ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}>{i + 1}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(p + 1, total))} className="px-4 py-2 bg-white border rounded hover:bg-gray-100 transition">&gt;&gt;</button>
          <select value={perPage} onChange={e => { setPerPage(+e.target.value); setPage(1); }} className="ml-4 border border-gray-300 rounded px-4 py-2">
            {[3, 5, 10].map(n => <option key={n} value={n}>{n} per page</option>)}
          </select>
        </div>
      </main>
      <Footer />
    </div>
  );
}
