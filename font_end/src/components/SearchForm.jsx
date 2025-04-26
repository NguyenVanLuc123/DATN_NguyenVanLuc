
import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import addressData from "../data/address.listJson";

function SearchForm() {
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState('');
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleProvinceChange = (e) => {
    const province = e.target.value;
    setSelectedProvince(province);
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
    const found = districts.find(d => d.district === district);
    setWards(found ? found.wards : []);
    setSelectedWard('');
  };

  const handleWardChange = (e) => {
    setSelectedWard(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedProvince && !selectedDistrict && !selectedWard) {
      setError("Please select at least one field (province, district, or ward).");
      return;
    }

    // Build query parameters
    const params = {};
    if (selectedProvince)  params.city     = selectedProvince;
    if (selectedDistrict)  params.district = selectedDistrict;
    if (selectedWard)      params.ward     = selectedWard;

    const queryString = new URLSearchParams(params).toString();

    // Navigate with query string
    navigate(`/search_car_result?${queryString}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl p-6 mt-6 bg-green-700 rounded-md mx-auto">
      <h2 className="text-white font-bold text-3xl mb-4">Search for Rental Cars</h2>
      {error && <div className="text-yellow-500 mb-4">{error}</div>}

      <div className="mb-4">
        <label className="block font-medium text-white">Province:</label>
        <select
          value={selectedProvince}
          onChange={handleProvinceChange}
          className="border rounded w-full p-2 mb-2"
        >
          <option value="">Select a province</option>
          {addressData.map((item, idx) => (
            <option key={idx} value={item.city}>{item.city}</option>
          ))}
        </select>
      </div>

      {selectedProvince && (
        <div className="mb-4">
          <label className="block font-medium text-white">District:</label>
          <select
            value={selectedDistrict}
            onChange={handleDistrictChange}
            className="border rounded w-full p-2 mb-2"
          >
            <option value="">Select a district</option>
            {districts.map((d, idx) => (
              <option key={idx} value={d.district}>{d.district}</option>
            ))}
          </select>
        </div>
      )}

      {selectedDistrict && (
        <div className="mb-4">
          <label className="block font-medium text-white">Ward:</label>
          <select
            value={selectedWard}
            onChange={handleWardChange}
            className="border rounded w-full p-2"
          >
            <option value="">Select a ward</option>
            {wards.map((w, idx) => (
              <option key={idx} value={w}>{w}</option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Search
      </button>
    </form>
  );
}

export default SearchForm;