// src/pages/About/About.jsx hoặc src/components/About/About.jsx
import React from 'react';
import {useNavigate } from 'react-router-dom';


const About = () => {
  // Test data
  const locations = [
    { name: "Hanoi", cars: "50+ cars" },
    { name: "Ho Chi Minh city", cars: "100+ cars" },
    { name: "Da Nang - Hoi An", cars: "30+ cars" },
    { name: "Nha Trang", cars: "25+ cars" },
    { name: "Da Lat", cars: "20+ cars" },
    { name: "Quang Ninh", cars: "15+ cars" },
  ];
  const navigate=useNavigate();

  const features = [
    {
      icon: "💰",
      title: "Save money",
      description:
        "We have no setup or registration fees. You only get charged when you rent a car. So get started for FREE!",
    },
    {
      icon: "🎯",
      title: "Convenient",
      description:
        "We have a large selection of well-maintained cars to suit your needs throughout the country",
    },
    {
      icon: "⚖️",
      title: "Legal and insurance",
      description:
        "We fully cover all rentals and even provide roadside assistance. Our rating system and detailed checks provide safety",
    },
    {
      icon: "🎧",
      title: "24/7 support",
      description:
        "Our team is ready to support you all the time through our 24/7 hotline and services",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hero Section */}
      <div className="bg-gray-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">
                Looking for a vehicle?
                <br />
                You're at the right place.
              </h2>
              <p className="mb-6">
                Choose between 1000s of private cars for rent at really low prices!
              </p>
              <button className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 transition-colors" onClick={()=>navigate("/search_car_result")}>
                Find a Rental Car Near You
              </button>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Are you a car owner?</h2>
              <p className="mb-6">
                List your car and make money from your asset today!
              </p>
              <button className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 transition-colors" onClick={()=>navigate("/login")}>
                List Your Car Today
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Why choose us?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-lg shadow-md">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">What people say?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((_, index) => (
              <div key={index} className="flex items-start space-x-4 bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Locations Section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Where to find us?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {locations.map((location, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-bold mb-2">{location.name}</h3>
                <p className="text-sm text-gray-600">{location.cars}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold mb-4">RENT CARS</h3>
              <p className="text-sm">Search Cars and Rates</p>
            </div>
            <div>
              <h3 className="font-bold mb-4">CUSTOMER ACCESS</h3>
              <div className="space-y-2 text-sm">
                <p>Manage My Booking</p>
                <p>My Wallet</p>
                <p>My Car</p>
                <p>Log In</p>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-4">JOIN US</h3>
              <p className="text-sm">New User Sign Up</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;