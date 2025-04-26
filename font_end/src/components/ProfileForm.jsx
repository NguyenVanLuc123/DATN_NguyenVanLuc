import { useEffect, useState } from "react";
import axios from "axios";
import addressData from "../data/address.listJson";
import { fetchProfileData } from "../api/customer/ProfileApi";
import { useNavigate } from 'react-router-dom';

const ProfileForm = ({ setUser }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    phoneNumber: "",
    drivingLicense: null,
    drivingLicensePreview: "",
    dateOfBirth: "",
    img: null,
    imgPreview: "",
    nationalId: "",
    balance: 0,
  });

  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]); // Thêm state cho wards
  const [selectedWard, setSelectedWard] = useState(''); // Thêm state cho ward
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleDiscard = () => {
    navigate('/customer/home'); // Chuyển hướng về trang home
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileResponse = await fetchProfileData();
        if (profileResponse.success) {
          const data = profileResponse.data;
          const addressParts = data.address ? data.address.split(" - ") : []; // Tách địa chỉ

          setFormData({
            name: data.name || "",
            email: data.email || "",
            address: data.address || "",
            phoneNumber: data.phone_number || "",
            imgPreview: data.img || "",
            drivingLicensePreview: data.driving_license || "",
            dateOfBirth: data.date_of_birth ? data.date_of_birth.split("T")[0] : "",
            nationalId: data.national_id || "",
            balance: data.balance || 0,
          });
          setUser(profileResponse.data);
          // Cập nhật tỉnh, huyện và phường
          if (addressParts.length === 3) {
            setSelectedProvince(addressParts[0]); // Tỉnh
            setSelectedDistrict(addressParts[1]); // Huyện
            setSelectedWard(addressParts[2]); // Phường

            // Cập nhật danh sách quận dựa trên tỉnh đã chọn
            const selected = addressData.find(item => item.city === addressParts[0]);
            if (selected) {
              setDistricts(selected.districts); // Lấy danh sách quận từ addressData
              const districtSelected = selected.districts.find(d => d.district === addressParts[1]);
              if (districtSelected) {
                setWards(districtSelected.wards); // Lấy danh sách phường từ quận đã chọn
              }
            }
          }
        } else {
          setError(profileResponse.message);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        setError("Failed to load profile data");
      }
    };
    loadProfile();
  }, [setUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value || "",
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        [name]: file,
        [`${name}Preview`]: previewURL,
      }));
    }
  };

  const handleProvinceChange = (e) => {
    const province = e.target.value;
    setSelectedProvince(province);
    const selected = addressData.find(item => item.city === province);

    // Cập nhật danh sách quận dựa trên tỉnh đã chọn
    if (selected) {
      setDistricts(selected.districts); // Lấy danh sách quận từ addressData
      setWards([]); // Đặt lại danh sách phường
      setSelectedDistrict(''); // Đặt lại quận đã chọn
      setSelectedWard(''); // Đặt lại phường đã chọn
    } else {
      setDistricts([]); // Nếu không tìm thấy, đặt lại danh sách quận
    }

    setFormData((prev) => ({
      ...prev,
      address: `${province} - `, // Cập nhật địa chỉ
    }));
  };

  const handleDistrictChange = (e) => {
    const district = e.target.value;
    setSelectedDistrict(district);
    const selected = districts.find(d => d.district === district);
    setWards(selected ? selected.wards : []); // Cập nhật danh sách phường dựa trên quận đã chọn
    setSelectedWard(''); // Đặt lại phường đã chọn
    setFormData((prev) => ({
      ...prev,
      address: `${selectedProvince} - ${district}`, // Cập nhật địa chỉ
    }));
  };

  const handleWardChange = (e) => {
    const ward = e.target.value;
    setSelectedWard(ward);
    setFormData((prev) => ({
      ...prev,
      address: `${selectedProvince} - ${selectedDistrict} - ${ward}`, // Cập nhật địa chỉ
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formDataToSend = new FormData();
    for (const key in formData) {
      if (key === "img" || key === "drivingLicense") {
        if (formData[key] instanceof File) {
          formDataToSend.append(key, formData[key]);
        }
      } else if (!key.endsWith("Preview")) {
        formDataToSend.append(key, formData[key]);
      }
    }

    try {
      const response = await axios.put(
        "http://localhost:3000/api/v1/customer/profile",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );
      if (response.data.success) {
        setError("");
        setSuccessMessage("Profile updated successfully!");
        setUser({ ...formData, img: formData.imgPreview, drivingLicense: formData.drivingLicensePreview }); // Cập nhật user sau khi thành công
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.response?.data?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">My Profile</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {successMessage && <div className="text-green-500 mb-4">{successMessage}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block font-medium">Profile Image:</label>
          {formData.imgPreview && (
            <img
              src={formData.imgPreview}
              alt="Profile Preview"
              className="w-32 h-32 object-cover mb-2 border rounded"
            />
          )}
          <div className="relative">
            <input
              type="file"
              name="img"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="border rounded p-2 text-center bg-gray-100">
              Click to select an image
            </div>
          </div>
        </div>

        <div>
          <label className="block font-medium">Full Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Email Address:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Phone Number:</label>
          <input
            type="text"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Date of Birth:</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium">National ID:</label>
          <input
            type="text"
            name="nationalId"
            value={formData.nationalId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Driving License:</label>
          {formData.drivingLicensePreview && (
            <img
              src={formData.drivingLicensePreview}
              alt="Driving License Preview"
              className="w-32 h-32 object-cover mb-2 border rounded"
            />
          )}
          <div className="relative">
            <input
              type="file"
              name="drivingLicense"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="border rounded p-2 text-center bg-gray-100">
              Click to select a driving license
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block font-medium">Address:</label>
          <select
            value={selectedProvince}
            onChange={handleProvinceChange}
            className="border rounded w-full p-2 mb-2"
          >
            <option value="">Select a province</option>
            {addressData.map((item, index) => (
              <option key={index} value={item.city}>{item.city}</option>
            ))}
          </select>
          {selectedProvince && (
            <select
              value={selectedDistrict}
              onChange={handleDistrictChange}
              className="border rounded w-full p-2 mb-2"
            >
              <option value="">Select a district</option>
              {districts.map((district, index) => (
                <option key={index} value={district.district}>{district.district}</option>
              ))}
            </select>
          )}
          {selectedDistrict && (
            <select
              value={selectedWard}
              onChange={handleWardChange}
              className="border rounded w-full p-2"
            >
              <option value="">Select a ward</option>
              {wards.map((ward, index) => (
                <option key={index} value={ward}>{ward}</option>
              ))}
            </select>
          )}
        </div>

        <div className="mt-4">
          <label className="block font-medium">Balance:</label>
          <input
            type="number"
            name="balance"
            value={formData.balance}
            disabled
            className="w-full p-2 border bg-gray-100 rounded"
          />
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button type="button" className="text-red-500 hover:underline" onClick={handleDiscard}>
          Discard
        </button>
        <button
          type="submit"
          className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Save'}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;