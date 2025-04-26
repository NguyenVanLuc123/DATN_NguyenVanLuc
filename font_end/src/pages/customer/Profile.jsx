import { NavLink } from "react-router-dom";
import { useState } from "react";
import ProfileForm from "../../components/ProfileForm";
import SecurityForm from "../../components/SecurityForm"; // Import SecurityForm

function ProfileEdit({ setUser }) {
  const [activeTab, setActiveTab] = useState("personal");

  return (
    <div className="w-full h-full flex flex-col justify-center">
      <div className="mx-auto mt-6">
        <nav className="text-sm mb-4">
          <NavLink
            to="/customer/home"
            className="text-blue-500 text-body hover:underline"
          >
            Home
          </NavLink>{" "}
          &gt; <span className="text-gray-500 text-body">My Profile</span>
        </nav>
        <h2 className="text-2xl font-semibold mb-4">My Profile</h2>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`p-2 ${
              activeTab === "personal"
                ? "border-b-2 border-blue-500 font-semibold"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("personal")}
          >
            Personal Information
          </button>
          <button
            className={`p-2 ${
              activeTab === "security"
                ? "border-b-2 border-blue-500 font-semibold"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("security")}
          >
            Security
          </button>
        </div>

        {/* Nội dung Tab */}
        <div className="mt-8">
          {activeTab === "personal" ? <ProfileForm setUser={setUser} /> : null}
          {activeTab === "security" ? <SecurityForm setUser={setUser} /> : null} {/* Thêm SecurityForm */}
        </div>
      </div>
    </div>
  );
}

export default ProfileEdit;