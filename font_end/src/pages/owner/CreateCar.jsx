import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import Slider from 'react-slick';
import toast from 'react-hot-toast';
import addressData from '../../data/address.listJson';
import { fetchHomeData } from '../../api/customer/HomeApi';
import Footer from '../../components/Footer';
export default function CreateCar({ setUser }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [rating, setRating] = useState(0);
  const [rideCount] = useState(0);

  const [form, setForm] = useState({
    license_plate: '', color: '', brand: '', model: '', MFG: '', seat: '',
    transmission_type: 'automatic', fuel_type: 'gasoline',
    mileage: '', fuel_consumption: '', description: '',
    city: '', district: '', ward: '',
    additional: [], terms: [],
    base_price: '', required_deposit: '',
    front_img: null, left_img: null, back_img: null, right_img: null,
    front_imgPreview: '', left_imgPreview: '', back_imgPreview: '', right_imgPreview: '',
    status: 'Available',
  });

  useEffect(() => {
    async function init() {
      const res = await fetchHomeData();
      if (res.success) setUser(res.data);
    }
    init();
  }, []);

  const provinces = addressData.map(i => i.city);
  const [districts, setDistricts] = useState([]);
  const [wardsList, setWardsList] = useState([]);

  const handleInput = f => e => setForm(prev => ({ ...prev, [f]: e.target.value }));
  const handleCheck = (field, value) => setForm(prev => {
    const arr = prev[field];
    const next = arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value];
    return { ...prev, [field]: next };
  });
  const handleImg = f => e => {
    const file = e.target.files[0];
    if (file) setForm(prev => ({ ...prev, [f]: file, [`${f}Preview`]: URL.createObjectURL(file) }));
  };

  const onProv = e => {
    const city = e.target.value;
    const prov = addressData.find(i => i.city === city);
    setDistricts(prov?.districts.map(d => d.district) || []);
    setWardsList([]);
    setForm(prev => ({ ...prev, city, district: '', ward: '' }));
  };
  const onDist = e => {
    const district = e.target.value;
    const prov = addressData.find(i => i.city === form.city);
    const obj = prov?.districts.find(d => d.district === district);
    setWardsList(obj?.wards || []);
    setForm(prev => ({ ...prev, district, ward: '' }));
  };
  const onWard = e => setForm(prev => ({ ...prev, ward: e.target.value }));

  const validateStep = () => {
    let errs = {};
    if (step === 1) {
      ['license_plate','color','brand','model','MFG','seat','transmission_type','fuel_type']
        .forEach(f => { if (!form[f]) errs[f] = 'Required'; });
    }
    if (step === 2) {
      ['mileage','fuel_consumption','city','district','ward']
        .forEach(f => { if (!form[f]) errs[f] = 'Required'; });
      if (form.additional.length === 0) errs.additional = 'Chọn ít nhất 1 chức năng';
    }
    if (step === 3) {
      ['base_price','required_deposit']
        .forEach(f => { if (!form[f]) errs[f] = 'Required'; });
      if (form.terms.length === 0) errs.terms = 'Chọn ít nhất 1 điều khoản';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const prev = () => setStep(s => s - 1);

  const submit = () => {
    setLoading(true);
    const data = new FormData();
    Object.keys(form).forEach(k => {
      if (k.endsWith('Preview') || ['city','district','ward','additional','terms'].includes(k)) return;
      const v = form[k];
      if (['front_img','left_img','back_img','right_img'].includes(k)) {
        if (v instanceof File) data.append(k, v);
      } else {
        data.append(k, v);
      }
    });
    data.append('location', `${form.city} - ${form.district} - ${form.ward}`);
    data.append('additional_function_id', form.additional.join('-'));
    data.append('term_of_use_id', form.terms.join('-'));

    axios.post('http://localhost:3000/api/v1/owner/cars/create', data, { withCredentials: true })
      .then(r => {   navigate('/owner/cars',{
        state: { toastMessage: 'Tạo xe thành công!' }, replace: true
       })})
      .catch(e => toast.error(e.response?.data?.message || e.message))
      .finally(() => setLoading(false));
  };


    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm p-4 text-sm text-gray-600 flex items-center ml-4 sm:ml-20">
                <div className="flex items-center">
                    <Link to="/owner/cars" className="hover:underline text-blue-600">My cars</Link>
                    <span className="mx-2">&gt;</span>
                    <span>Add a car</span>
                </div>
            </nav>
            <main className="flex-grow container mx-auto px-4 sm:px-6 py-4 sm:py-8">
                <div className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Add a car</div>
                <div className="flex flex-wrap sm:flex-nowrap gap-2 mb-6 sm:mb-8">
                    {['Basic', 'Details', 'Pricing', 'Finish'].map((t, i) => (
                        <button
                            key={t}
                            onClick={() => {
                                const target = i + 1;
                                if (target > step) {
                                    if (validateStep()) setStep(target);
                                } else {
                                    setStep(target);
                                }
                            }}
                            className={`flex-1 px-2 sm:px-3 py-1 text-sm sm:text-base rounded ${
                                step === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                            }`}
                        >
                            Step {i + 1}: {t}
                        </button>
                    ))}
                </div>

                {step === 1 && (
                    <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-white p-4 sm:p-6 rounded shadow">
                            {['license_plate', 'color', 'brand', 'model', 'seat'].map(f => (
                                <div key={f} className="w-full">
                                    <label className="block mb-1 text-sm sm:text-base capitalize">
                                        {f.replace('_', ' ')}*
                                    </label>
                                    <input
                                        type={f === 'seat' ? 'number' : 'text'}
                                        min="1"
                                        value={form[f]}
                                        onChange={handleInput(f)}
                                        className="w-full border p-2 rounded text-sm sm:text-base"
                                    />
                                    {errors[f] && (
                                        <p className="text-red-500 text-xs sm:text-sm">{errors[f]}</p>
                                    )}
                                </div>
                            ))}

                            {/* Chỗ MFG */}
                            <div className="w-full">
                                <label className="block mb-1 text-sm sm:text-base">MFG*</label>
                                <input
                                    type="date"
                                    value={form.MFG}
                                    onChange={handleInput('MFG')}
                                    className="w-full border p-2 rounded text-sm sm:text-base"
                                />
                                {errors.MFG && <p className="text-red-500 text-xs sm:text-sm">{errors.MFG}</p>}
                            </div>
                            <div className="w-full">
                                <label className="block mb-1 text-sm sm:text-base">Transmission*</label>
                                <div className="flex space-x-2">
                                    {['automatic', 'manual'].map(v => (
                                        <button key={v} onClick={() => setForm({ ...form, transmission_type: v })}
                                            className={`px-4 py-2 rounded ${form.transmission_type === v ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>{v}</button>
                                    ))}
                                </div>
                                {errors.transmission_type && <p className="text-red-500 text-xs sm:text-sm">Required</p>}
                            </div>
                            <div className="w-full">
                                <label className="block mb-1 text-sm sm:text-base">Fuel*</label>
                                <div className="flex space-x-2">
                                    {['gasoline', 'diesel'].map(v => (
                                        <button key={v} onClick={() => setForm({ ...form, fuel_type: v })}
                                            className={`px-4 py-2 rounded ${form.fuel_type === v ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>{v}</button>
                                    ))}
                                </div>
                                {errors.fuel_type && <p className="text-red-500 text-xs sm:text-sm">Required</p>}
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="bg-white p-4 sm:p-6 rounded shadow">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="w-full">
                                <label className="block mb-1 text-sm sm:text-base">Mileage*</label>
                                <input  min="1" type="number" value={form.mileage} onChange={handleInput('mileage')} className="w-full border p-2 rounded text-sm sm:text-base" />
                                {errors.mileage && <p className="text-red-500 text-xs sm:text-sm">Required</p>}
                            </div>
                            <div className="w-full">
                                <label className="block mb-1 text-sm sm:text-base">Fuel consumption*</label>
                                <input min="1" type="number" value={form.fuel_consumption} onChange={handleInput('fuel_consumption')} className="w-full border p-2 rounded text-sm sm:text-base" />
                                {errors.fuel_consumption && <p className="text-red-500 text-xs sm:text-sm">Required</p>}
                            </div>
                            <div className="w-full">
                                <label className="block mb-1 text-sm sm:text-base">Address*</label>
                                <select value={form.city} onChange={onProv} className="w-full border p-2 rounded text-sm sm:text-base">
                                    <option value="">Province</option>
                                    {provinces.map(p => <option key={p}>{p}</option>)}
                                </select>
                                {errors.city && <p className="text-red-500 text-xs sm:text-sm">Required</p>}
                                <select value={form.district} onChange={onDist} className="mt-2 w-full border p-2 rounded text-sm sm:text-base">
                                    <option value="">District</option>
                                    {districts.map(d => <option key={d}>{d}</option>)}
                                </select>
                                {errors.district && <p className="text-red-500 text-xs sm:text-sm">Required</p>}
                                <select value={form.ward} onChange={onWard} className="mt-2 w-full border p-2 rounded text-sm sm:text-base">
                                    <option value="">Ward</option>
                                    {wardsList.map(w => <option key={w}>{w}</option>)}
                                </select>
                                {errors.ward && <p className="text-red-500 text-xs sm:text-sm">Required</p>}
                            </div>
                            <div className="w-full">
                                <label className="block mb-1 text-sm sm:text-base">Description</label>
                                <textarea value={form.description} onChange={handleInput('description')} rows={3} className="w-full border p-2 rounded text-sm sm:text-base" />
                            </div>

                            <div className="w-full">
                                <p className="mb-2 font-medium text-sm sm:text-base">Additional functions</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries({ 1: 'Bluetooth', 2: 'GPS', 3: 'Camera', 4: 'Sun roof', 5: 'Child lock', 6: 'Child seat', 7: 'DVD', 8: 'USB' })
                                        .map(([k, l]) => (
                                            <label key={k} className="flex items-center space-x-2">
                                                <input type="checkbox" value={k} checked={form.additional.includes(k)} onChange={() => handleCheck('additional', k)} /><span>{l}</span>
                                            </label>
                                        ))}
                                </div>
                            </div>

                            <div className="w-full">
                                <p className="mb-2 font-medium text-sm sm:text-base">Images</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {['front_img', 'left_img', 'back_img', 'right_img'].map(f => (
                                        <div key={f}>
                                            <label className="block mb-1 text-sm sm:text-base capitalize">{f.replace('_', ' ').replace('_img', '')}</label>
                                            {form[`${f}Preview`] && <img src={form[`${f}Preview`]} alt={f} className="h-32 w-full object-cover mb-2" />}
                                            <input type="file" accept="image/*" onChange={handleImg(f)} className="w-full text-sm" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="bg-white p-4 sm:p-6 rounded shadow">
                        <div className="grid gap-6">
                            <div className="flex space-x-2 items-center">
                                <label className="w-40 text-sm sm:text-base">Base price*</label>
                                <input min="1" type="number" value={form.base_price} onChange={handleInput('base_price')} className="border p-2 rounded w-full text-sm sm:text-base" />
                                <span>VND/Day</span>
                            </div>
                            {errors.base_price && <p className="text-red-500 text-xs sm:text-sm">Required</p>}
                            <div className="flex space-x-2 items-center">
                                <label className="w-40 text-sm sm:text-base">Required deposit*</label>
                                <input min="1" type="number" value={form.required_deposit} onChange={handleInput('required_deposit')} className="border p-2 rounded w-full text-sm sm:text-base" />
                                <span>VND</span>
                            </div>
                            {errors.required_deposit && <p className="text-red-500 text-xs sm:text-sm">Required</p>}
                            <p className="font-medium text-sm sm:text-base">Terms of use</p>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries({ 1: 'No smoking', 2: 'No pet', 3: 'No food in car', 4: 'Other' })
                                    .map(([k, l]) => (
                                        <label key={k} className="flex items-center space-x-2">
                                            <input type="checkbox" value={k} checked={form.terms.includes(k)} onChange={() => handleCheck('terms', k)} /><span>{l}</span>
                                        </label>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="bg-white p-4 sm:p-6 rounded shadow">
                        <p className="mb-4 font-medium text-sm sm:text-base">Preview</p>
                        <div className="mb-6">
                            <Slider dots arrows slidesToShow={1} slidesToScroll={1} infinite={false} draggable swipeToSlide>
                                {['front_imgPreview', 'left_imgPreview', 'back_imgPreview', 'right_imgPreview']
                                    .filter(f => form[f])
                                    .map((f, i) => <div key={i}><img src={form[f]} alt={i} className="object-cover w-full h-64" /></div>)}
                            </Slider>
                        </div>
                        <div className="mt-4">
                            <h2 className="text-xl sm:text-2xl font-semibold mb-2">{form.brand} {form.model}</h2>
                            <p><span className="font-medium">License:</span> {form.license_plate}</p>
                            <p className="flex items-center">
                                <span className="font-medium mr-2">Rating:</span>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <span key={i}
                                        className="inline-block w-5 h-5 mr-1 cursor-pointer text-gray-300"
                                        onClick={() => setRating(i)}
                                    >
                                        ★
                                    </span>
                                ))}
                            </p>
                            <p>
                                <span className="font-medium">Ride:</span> {rideCount}
                            </p>
                            <p><span className="font-medium">Price:</span> {form.base_price} VND/day</p>
                            <p><span className="font-medium">Location:</span> {`${form.city} - ${form.district} - ${form.ward}`}</p>
                            <p><span className="font-medium">Status:</span> <span className="text-green-600">Available</span></p>
                        </div>
                    </div>
                )}

                <div className="flex justify-between mt-6">
                    {step > 1 && (
                        <button 
                            onClick={prev}
                            className="px-4 py-2 text-sm sm:text-base text-gray-600 hover:text-gray-800"
                        >
                            Back
                        </button>
                    )}
                    {step < 4 ? (
                        <button
                            onClick={next}
                            className="px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={submit}
                            disabled={loading}
                            className="px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit'}
                        </button>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
