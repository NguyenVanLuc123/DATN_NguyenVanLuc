import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import Footer from '../../components/Footer';
import addressData from '../../data/address.listJson';
import toast from 'react-hot-toast';

function StarRating({ rating }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center space-x-1 text-yellow-400">
      {[...Array(full)].map((_, i) => <FaStar key={i} />)}
      {half && <FaStarHalfAlt />}
      {[...Array(empty)].map((_, i) => <FaRegStar key={i} />)}
    </div>
  );
}

export default function EditCarDetails({ setUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [car, setCar] = useState(null);
  const [form, setForm] = useState({
    license_plate: '',
    brand: '',
    MFG: '',
    transmission_type: '',
    fuel_type: '',
    color: '',
    model: '',
    seat: '',
    mileage: '',
    fuel_consumption: '',
    description: '',
    base_price: '',
    required_deposit: '',
    status: '',
    front_img: null,
    left_img: null,
    back_img: null,
    right_img: null,
    front_imgPreview: '',
    left_imgPreview: '',
    back_imgPreview: '',
    right_imgPreview: ''
  });
  const [additional, setAdditional] = useState([]);
  const [terms, setTerms] = useState([]);
  const [activeTab, setActiveTab] = useState('basic');

  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');

  const [provinces] = useState(addressData.map(item => item.city));
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  useEffect(() => {
    axios.get(`http://localhost:3000/api/v1/customer/search_car/${id}`, { withCredentials: true })
      .then(({ data }) => {
        if (!data.success) return navigate('/owner/cars');
        const c = data.data[0];
        setCar(c);
        if (data.user?.length) setUser(data.user[0]);

        const [cityVal, districtVal, wardVal] = (c.location || '').split(' - ');
        setCity(cityVal);
        setDistrict(districtVal);
        setWard(wardVal);

        setForm({
          name: c.name,
          license_plate: c.license_plate,
          brand: c.brand,
          MFG: c.MFG?.slice(0, 10) || '',
          transmission_type: c.transmission_type,
          fuel_type: c.fuel_type,
          color: c.color,
          model: c.model,
          seat: c.seat,
          mileage: c.mileage,
          fuel_consumption: c.fuel_consumption,
          description: c.description,
          base_price: c.price,
          required_deposit: c.required_deposit,
          status: c.status,
          front_imgPreview: c.front_img,
          left_imgPreview: c.left_img,
          back_imgPreview: c.back_img,
          right_imgPreview: c.right_img
        });

        setAdditional(data.additonal.find(a => a.car_id === c.id)?.additional_function_id.split('-') || []);
        setTerms(data.team_of_user.find(t => t.car_id === c.id)?.term_of_use_id.split('-') || []);

        const prov = addressData.find(item => item.city === cityVal);
        setDistricts(prov?.districts.map(d => d.district) || []);
        const distObj = prov?.districts.find(d => d.district === districtVal);
        setWards(distObj?.wards || []);
      })
      .catch(() => navigate('/owner/cars'));
  }, [id, navigate, setUser]);

  if (!car) return <div className="flex-grow flex items-center justify-center">Loading...</div>;

  const handleInput = field => e => setForm({ ...form, [field]: e.target.value });
  const handleCheckbox = (arr, setArr) => e => {
    const v = e.target.value;
    setArr(e.target.checked ? [...arr, v] : arr.filter(x => x !== v));
  };

  const handleProvinceChange = e => {
    const newCity = e.target.value;
    const prov = addressData.find(item => item.city === newCity);
    setDistricts(prov?.districts.map(d => d.district) || []);
    setWards([]);
    setCity(newCity);
    setDistrict('');
    setWard('');
  };

  const handleDistrictChange = e => {
    const newDistrict = e.target.value;
    const prov = addressData.find(item => item.city === city);
    const distObj = prov?.districts.find(d => d.district === newDistrict);
    setWards(distObj?.wards || []);
    setDistrict(newDistrict);
    setWard('');
  };

  const handleWardChange = e => setWard(e.target.value);

  const handleImage = e => {
    const { name, files } = e.target;
    const file = files[0];
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setForm(prev => ({ ...prev, [name]: file, [`${name}Preview`]: previewURL }));
    }
  };

  const handleSave = () => {
    setLoading(true);
    setLoading(true);
    const formDataToSend = new FormData();
    // Gán chỉ 1 lần base_price và required_deposit
    for (const key in form) {
      if (['front_img','left_img','back_img','right_img'].includes(key)) {
        if (form[key] instanceof File) formDataToSend.append(key, form[key]);
      } else if (!key.endsWith('Preview')  && key !== 'required_deposit') {
        formDataToSend.append(key, form[key]);
      }
    }

    formDataToSend.append('required_deposit', form.required_deposit);
    formDataToSend.append('location', `${city} - ${district} - ${ward}`);
    formDataToSend.append('additional_function_id', additional.join('-'));
    formDataToSend.append('term_of_use_id', terms.join('-'));

    axios.put(`http://localhost:3000/api/v1/owner/cars/edit/${id}`, formDataToSend, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true
    })
      .then(res => {
        if (res.data.success) {
          toast.success(res.data.message);
        } else {
          toast.error(res.data.message);
        }
      })
      .catch(err => {
        const msg = err.response?.data?.message || err.message;
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  };

  const images = [car.front_img, car.left_img, car.back_img, car.right_img].filter(Boolean);
  const settings = { dots: true, arrows: true, infinite: false, speed: 500, slidesToShow: 1, slidesToScroll: 1, draggable: true, swipeToSlide: true };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm p-4 text-sm text-gray-600 flex items-center ml-4 sm:ml-20">
        <Link to="/owner/home" className="hover:underline text-blue-600">Home</Link>
        <span className="mx-2">&gt;</span>
        <Link to="/owner/cars" className="hover:underline text-blue-600">My Cars</Link>
        <span className="mx-2">&gt;</span>
        <span className="font-semibold">Edit Details</span>
      </nav>

      <main className="container mx-auto p-4 sm:p-6">
        {/* Car preview section */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Image slider */}
          <div className="w-full lg:w-2/3 bg-white rounded-lg shadow-lg overflow-visible">
            <Slider {...settings} className="h-48 sm:h-64">
              {images.map((src, i) => (
                <div key={i} className="h-48 sm:h-64 flex items-center justify-center bg-gray-200">
                  <img src={src} alt={`Slide ${i+1}`} className="object-cover w-full h-full" />
                </div>
              ))}
            </Slider>
          </div>

          {/* Car info */}
          <div className="w-full lg:w-1/3 bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{car.name}</h2>
            </div>
            <div className="flex items-center mb-2 space-x-4">
              <StarRating rating={Math.round((car.rating || 0) * 2) / 2} />
              <span className="font-medium">{car.rides} rides</span>
            </div>
            <p className="mb-2"><span className="font-medium">Price:</span> <span className="text-red-600">{form.base_price} VND/day</span></p>
            <p className="mb-4"><span className="font-medium">Location:</span> {`${city} - ${district} - ${ward}`}</p>
            <div className="flex items-center gap-2 mb-4">
              <label className="font-medium">Status</label>
              <select value={form.status} onChange={handleInput('status')} className={`border rounded p-1 font-semibold ${form.status==='available'?'text-green-600':form.status==='busy'?'text-orange-500':'text-gray-500'}`}>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="stopped">Stopped</option>
              </select>
              <button
                type="submit"
                onClick={handleSave}
                className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${loading?'opacity-50 cursor-not-allowed':''}`}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs section */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Tab buttons */}
          <div className="flex flex-wrap sm:flex-nowrap border-b">
            {['basic', 'details', 'pricing'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 sm:py-3 text-center text-sm sm:text-base ${
                  activeTab === tab 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {activeTab === 'basic' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {['license_plate', 'brand', 'MFG', 'color', 'model', 'seat'].map(f => (
                  <div key={f} className="flex justify-between items-center">
                    <label className="font-medium capitalize">{f.replace(/_/g, ' ')}</label>
                    <input type={f === 'seat' ? 'number' : f === 'MFG' ? 'date' : 'text'} value={form[f] || ''} onChange={handleInput(f)} className="border p-1 rounded w-48 text-right" />
                  </div>
                ))}
                <div className="flex justify-between items-center">
                  <label className="font-medium">Transmission</label>
                  <select value={form.transmission_type} onChange={handleInput('transmission_type')} className="border p-1 rounded w-48">
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <label className="font-medium">Fuel Type</label>
                  <select value={form.fuel_type} onChange={handleInput('fuel_type')} className="border p-1 rounded w-48">
                    <option value="gasoline">Gasoline</option>
                    <option value="diesel">Diesel</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <label className="font-medium">Mileage</label>
                  <input type="number" value={form.mileage || ''} onChange={handleInput('mileage')} className="border w-full p-1 rounded" />
                  <label className="font-medium">Fuel consumption</label>
                  <input type="number" value={form.fuel_consumption || ''} onChange={handleInput('fuel_consumption')} className="border w-full p-1 rounded" />
                  <label className="font-medium">Description</label>
                  <textarea rows={3} value={form.description || ''} onChange={handleInput('description')} className="border w-full p-1 rounded" />
                </div>
                <div className="space-y-4">
                  <label className="font-medium">Province</label>
                  <select value={city} onChange={handleProvinceChange} className="border w-full p-1 rounded">
                    <option value="">Select</option>
                    {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <label className="font-medium">District</label>
                  <select value={district} onChange={handleDistrictChange} className="border w-full p-1 rounded">
                    <option value="">Select</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <label className="font-medium">Ward</label>
                  <select value={ward} onChange={handleWardChange} className="border w-full p-1 rounded">
                    <option value="">Select</option>
                    {wards.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <p className="font-medium mb-2">Images</p>
                  <div className="grid grid-cols-2 gap-4">
                    {['front_img', 'left_img', 'back_img', 'right_img'].map(f => (
                      <div key={f} className="space-y-1">
                        <label className="font-medium capitalize">
                          {f.replace('_img', '')}
                        </label>
                        <img src={form[f + 'Preview']} alt={f} className="h-80 w-full object-cover border rounded" />
                        <input
                          type="file"
                          name={f} // Đặt name riêng biệt
                          onChange={handleImage}
                          className="w-full text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <p className="font-medium mb-2">Additional Functions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries({ 1: 'Bluetooth', 2: 'GPS', 3: 'Camera', 4: 'Sun roof', 5: 'Child lock', 6: 'Child seat', 7: 'DVD', 8: 'USB' }).map(([k, l]) => (
                      <label key={k} className="flex items-center space-x-2"><input type="checkbox" value={k} checked={additional.includes(k)} onChange={handleCheckbox(additional, setAdditional)} /><span>{l}</span></label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2"><label className="font-medium">Base price</label><input type="number" value={form.base_price || ''} onChange={handleInput('base_price')} className="border w-32 p-1 rounded" /><span>VND/Day</span></div>
                <div className="flex items-center space-x-2"><label className="font-medium">Required deposit</label><input type="number" value={form.required_deposit || ''} onChange={handleInput('required_deposit')} className="border w-32 p-1 rounded" /><span>VND</span></div>
                <p className="font-medium">Terms of Use</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries({ 1: 'No smoking', 2: 'No pet', 3: 'No food in car', 4: 'Other' }).map(([k, l]) => (
                    <label key={k} className="flex items-center space-x-2"><input type="checkbox" value={k} checked={terms.includes(k)} onChange={handleCheckbox(terms, setTerms)} /><span>{l}</span></label>
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