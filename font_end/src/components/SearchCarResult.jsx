import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { FiGrid, FiList } from "react-icons/fi";
import Footer from '../components/Footer';
import SearchForm from "./SearchForm";
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

function StarRating({ rating }) {
  const stars = [];
  const fullStars = Math.floor(rating); // sao đầy
  const halfStar = rating - fullStars >= 0.5; // có nửa sao không?
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  for (let i = 0; i < fullStars; i++) {
    stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
  }
  if (halfStar) {
    stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
  }
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400" />);
  }

  return <div className="flex items-center space-x-0.5">{stars}</div>;
}


function SearchCarResult({ setUser }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const city = searchParams.get('city');
  const district = searchParams.get('district');
  const ward = searchParams.get('ward');

  const [cars, setCars] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setLocalUser] = useState(null);

  // Layout & sorting & pagination
  const [viewMode, setViewMode] = useState('grid');
  const [sortOrder, setSortOrder] = useState('newest');
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchCars = async () => {
      const params = new URLSearchParams();
      city && params.append('city', city);
      district && params.append('district', district);
      ward && params.append('ward', ward);
      try {
        const resp = await axios.get(
          `http://localhost:3000/api/v1/customer/search_car?${params.toString()}`,
          { withCredentials: true }
        );
        if (resp.data.success) {
          setErrorMessage("");
          setCars(resp.data.data);
          if (resp.data.user?.length) {
            setUser(resp.data.user[0]);
            setLocalUser(resp.data.user[0]);

          }
        } else {
          setErrorMessage(resp.data.message);
        }
      } catch {
        setCars([])
        setErrorMessage("No cars found");
      }
    };
    fetchCars();
  }, [city, district, ward, setUser]);

  // Sort logic
  const sortedCars = useMemo(() => {
    const copy = [...cars];
    switch (sortOrder) {
      case 'priceAsc': return copy.sort((a, b) => a.price - b.price);
      case 'priceDesc': return copy.sort((a, b) => b.price - a.price);
      case 'oldest': return copy.reverse();
      default: return copy;
    }
  }, [cars, sortOrder]);

  const totalPages = Math.ceil(sortedCars.length / itemsPerPage);
  const displayCars = sortedCars.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
       <nav className="bg-white shadow-sm p-4 text-sm text-gray-600 flex items-center ml-20">
    <div className="flex items-center">
      <Link to="/customer/home" className="hover:underline text-blue-600 ">Home</Link>
      <span className="mx-2">&gt;</span>
      <span className="font-semibold ml-1">Search Results</span>
    </div>
  </nav>
      <SearchForm />
      <main className="flex-grow container mx-auto px-4 py-6">
        {/* Breadcrumb/Search Summary */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Search Results</h2>
          <p className="text-sm text-gray-600">
            {city && `Province: ${city}`}
            {district && ` | District: ${district}`}
            {ward && ` | Ward: ${ward}`}
          </p>
          {errorMessage && <div className="mt-4 text-red-500">{errorMessage}</div>}
        </div>

        {/* Controls: view & sort */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              <FiGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              <FiList size={20} />
            </button>
          </div>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1"
          >
            <option value="newest">Newest to Latest</option>
            <option value="oldest">Latest to Newest</option>
            <option value="priceAsc">Price Low to High</option>
            <option value="priceDesc">Price High to Low</option>
          </select>
        </div>

        {/* Results */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCars.map((car, idx) => (
              <div key={idx} className="bg-white rounded shadow p-4 flex flex-col">
                <img src={car.front_img || '/placeholder.jpg'} alt={car.name} className="w-full h-40 object-cover rounded mb-2" />
                <h3 className="font-semibold text-lg truncate">{car.name}</h3>
                <div className="text-sm text-gray-600 flex flex-col">
                  {car.rating
                    ? <StarRating rating={Math.round(car.rating * 2) / 2} />
                    : 'No ratings'}
                  <span>{car.rides ?? 0} rides</span>
                </div>

                <p className="text-sm text-gray-600">{car.location}</p>
                <p className="mt-2 font-bold text-red-600">{car.price} USD/Day</p>
                <span className={`mt-1 text-sm capitalize ${car.status === 'available' ? 'text-green-600' : 'text-red-600'}`}>{car.status}</span>
                <div className="mt-auto flex space-x-2">
                  <button onClick={() => navigate('/book', { state: { car, user } })} className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Rent now</button>
                  <button onClick={() => navigate(`/details/${car.id}`)}className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-blue-600">View details</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Ratings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Rides</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayCars.map((car, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><img src={car.front_img || '/placeholder.jpg'} alt={car.name} className="h-12 w-20 object-cover rounded" /></td>
                    <td className="px-6 py-4 whitespace-nowrap">{car.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap"> <div className="text-sm text-gray-600 flex flex-col">
                  {car.rating
                    ? <StarRating rating={Math.round(car.rating * 2) / 2} />
                    : 'No ratings'}
                </div></td>
                    <td className="px-6 py-4 whitespace-nowrap">{car.rides ?? 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap ">{car.price} USD</td>
                    <td className="px-6 py-4 whitespace-nowrap">{car.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">{car.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button onClick={() => navigate('/book', { state: { car, user } })} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Rent now</button>
                      <button onClick={() => navigate(`/details/${car.id}`, { state: { car, user } })} className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600">View details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="space-x-2">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 border rounded hover:bg-gray-200 disabled:opacity-50">Previous</button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => handlePageChange(i + 1)} className={`px-3 py-1 border rounded ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}>{i + 1}</button>
            ))}
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 border rounded hover:bg-gray-200 disabled:opacity-50">Next</button>
          </div>
          <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-gray-300 rounded px-2 py-1">
            {[5, 10, 20, 30].map(n => <option key={n} value={n}>{n} per page</option>)}
          </select>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default SearchCarResult;
