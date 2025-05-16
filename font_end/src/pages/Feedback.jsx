import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Footer from '../components/Footer';
import { FaStar } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { fetchHomeData } from '../../src/api/customer/HomeApi';

const FeedbackPage = ({ setUser }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [counts, setCounts] = useState({});
  const [filterStar, setFilterStar] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isOwner, setIsOwner] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchHomeData();
        if (response.success) {
          setUser(response.data);
          setIsOwner(response.data.is_owner !== 0);
        }
      } catch (error) {
        console.error('Error fetching home data:', error);
      }
    };
    fetchData();
  }, [setUser]);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/v1/owner/feeback', { withCredentials: true });
        if (res.data.success) {
          const data = res.data.data;
          setFeedbacks(data);
          const total = data.reduce((sum, f) => sum + f.rating, 0);
          setAvgRating((total / data.length).toFixed(2));
          const c = { 5:0,4:0,3:0,2:0,1:0 };
          data.forEach(f => c[f.rating]++);
          setCounts(c);
        }
      } catch (err) {
        console.error('Error fetching feedback:', err);
      }
    };
    fetchFeedback();
  }, []);

  // filter and paginate
  const filtered = filterStar ? feedbacks.filter(f => f.rating === filterStar) : feedbacks;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paged = filtered.slice(startIdx, startIdx + itemsPerPage);
  const handleFilter = star => { setFilterStar(star); setCurrentPage(1); };
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  return (
    <div className="container mx-auto p-6">
      <nav className="bg-white shadow-sm p-4 text-sm text-gray-600 flex items-center space-x-4 rounded-b-lg mb-4">
        <Link to="/owner/home" className="hover:underline text-blue-600">Home</Link>
        <span className="text-gray-400">/</span>
        <span className="font-semibold text-gray-800">My Reports</span>
      </nav>
      <h1 className="text-3xl font-semibold mb-4">Feed Back</h1>

      {isOwner && (
        <section className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-medium mb-2">Average Ratings</h2>
          <div className="flex items-center space-x-4">
            <span className="text-4xl font-bold">{avgRating}</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={`h-6 w-6 ${i < Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="mt-4 flex space-x-2">
          <button onClick={() => handleFilter(null)} className={`px-3 py-1 border rounded ${filterStar===null?'bg-blue-50':''}`}>All ({feedbacks.length})</button>
          {[5,4,3,2,1].map(star=>(
            <button key={star} onClick={()=>handleFilter(star)} className={`px-3 py-1 border rounded ${filterStar===star?'bg-blue-50':''}`}>{star} Stars ({counts[star]||0})</button>
          ))}
        </div>
      </section>

      <section className="space-y-6 mb-8">
        {paged.map(fb=>(
          <div key={fb.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-500">👤</span>
                </div>
                <span className="font-semibold">{fb.customer.name}</span>
              </div>
              <span className="text-gray-500 text-sm">{new Date(fb.created_date).toLocaleString()}</span>
            </div>
            {fb.comment && <p className="mt-2 text-gray-700">{fb.comment}</p>}
            <div className="mt-2 flex">
              {[...Array(5)].map((_,i)=>(<FaStar key={i} className={`h-5 w-5 ${i<fb.rating?'text-yellow-400':'text-gray-300'}`}/>))}
            </div>
            <div className="mt-4 flex items-center">
              <img src={fb.car.front_img} alt={fb.car.name} className="h-24 w-32 object-cover rounded mr-4"/>
              <div><h3 className="font-medium">{fb.car.name}</h3></div>
            </div>
          </div>
        ))}
      </section>

      {/* Pagination with prev/next */}
      <div className="flex justify-center items-center space-x-2 mb-6">
        <button onClick={prevPage} disabled={currentPage===1} className="px-3 py-1 border rounded">Prev</button>
        {[...Array(totalPages)].map((_,i)=>(
          <button key={i+1} onClick={()=>setCurrentPage(i+1)} className={`px-3 py-1 border rounded ${currentPage===i+1?'bg-blue-500 text-white':''}`}>{i+1}</button>
        ))}
        <button onClick={nextPage} disabled={currentPage===totalPages} className="px-3 py-1 border rounded">Next</button>
      </div>

      <Footer />
    </div>
  );
};

export default FeedbackPage;