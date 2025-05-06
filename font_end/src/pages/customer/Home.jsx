// src/pages/customer/Home.jsx
import React, { useEffect, useState } from 'react';
import { fetchHomeData } from '../../api/customer/HomeApi';
import Footer from '../../components/Footer';
import SearchForm from "../../components/SearchForm";
import { useNavigate, NavLink,useLocation } from 'react-router-dom';
import {
    FaMoneyBillWave,
    FaUserFriends,
    FaShieldAlt,
    FaHeadset,
    FaImage,
} from "react-icons/fa";
import toast from 'react-hot-toast';
const CustomerHome = ({ setUser }) => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [account, setAccount] = useState(null);
    const navigate = useNavigate();
    const { state } = useLocation();
    useEffect(() => {
      if (state?.toastMessage) {
        toast.success(state.toastMessage);

        window.history.replaceState({}, document.title);
      }
    }, [state]);
    useEffect(() => {
        const fetchData = async () => {
            const response = await fetchHomeData();
            if (response.success) {
                setData(response.data);
                setUser(response.data); 
                setAccount(response.account);
                const currentPath = window.location.pathname;
                
                if(response.account.is_owner===0&& currentPath !== "/customer/home"){
                    navigate("/customer/home");
                }
                else if(response.account.is_owner !== 0 && currentPath !== "/owner/home") {
                    navigate("/owner/home");
                }
            }
             else {
                setError(response.message);
                navigate("/");
            }
          
           
        };

        fetchData();
    }, [setUser, navigate]);

    if (error) return <div>{error}</div>;
    if (!account) return <div>Loading...</div>;

    const features = [
        {
            icon: '💰',
            title: 'How the insurance works',
            description: 'From the minute you hand the keys over till the second you get them back you are covered. Your private insurance is not affected.',
        },
        {
            icon: '🆓',
            title: "It's completely free",
            description: 'We offer both owners and renters free sign ups. It’s only once a vehicle is rented out that a share is deducted to cover admin and insurance.',
        },
        {
            icon: '💲',
            title: 'You decide the price',
            description: 'When you list a car you decide the price. We can help with recommendations as to price, but ultimately you decide!',
        },
        {
            icon: '🚗',
            title: 'Handing over your vehicle',
            description: 'You arrange the time and location for the exchange of your vehicle with the renter. Both parties will need to agree and sign the vehicle rental sheet before and after key handover.',
        },
        {
            icon: '✅',
            title: 'You are in charge',
            description: 'All renters are pre-screened by us to ensure safety and get your approval. If you do not feel comfortable with someone you are able to decline a booking.',
        },
        {
            icon: '💳',
            title: 'Set payment',
            description: 'We pay you once a month and you can always view how much your car has earned under your user profile.',
        },
    ];

    // === Giao diện cho người có xe muốn cho thuê ===
    if (account.is_owner !== 0) {
        return (
            <div className="min-h-screen bg-gray-100">
                <div className="py-12 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold">
                        Have a car for rent? Don’t miss out on your benefits
                    </h1>
                </div>

                <div className="bg-white py-16">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {features.slice(0, 3).map((f, i) => (
                                <div key={i}>
                                    <div className="flex items-center space-x-3 mb-4">
                                        <span className="text-4xl">{f.icon}</span>
                                        <h3 className="text-xl font-bold">{f.title}</h3>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed">{f.description}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-12">
                            {features.slice(3).map((f, i) => (
                                <div key={i}>
                                    <div className="flex items-center space-x-3 mb-4">
                                        <span className="text-4xl">{f.icon}</span>
                                        <h3 className="text-xl font-bold">{f.title}</h3>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed">{f.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="py-12 bg-gray-100">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-2xl font-bold mb-6">
                            Make more money on your car right now
                        </h2>
                        <NavLink
                            to="/owner/cars"
                            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded"
                        >
                            List your car today
                        </NavLink>
                    </div>
                </div>

                <footer className="bg-white border-t py-8">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                            <div>
                                <h3 className="font-bold mb-3">RENT CARS</h3>
                                <p>Search Cars and Rates</p>
                            </div>
                            <div>
                                <h3 className="font-bold mb-3">CUSTOMER ACCESS</h3>
                                <ul className="space-y-2">
                                    <li>Manage My Booking</li>
                                    <li>My Wallet</li>
                                    <li>My Car</li>
                                    <li>Log In</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-bold mb-3">JOIN US</h3>
                                <p>New User Sign Up</p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        );
    }

    // === Giao diện cho người dùng thuê xe ===
    return (
        <div className="w-full flex flex-col justify-center">
            {/* Hero Section */}
            <section className="flex flex-col lg:flex-row justify-between px-10 lg:px-24 py-5 lg:py-10 text-center lg:text-left">
                <div className="flex-1 space-y-4">
                    <h1 className="text-5xl font-extrabold text-green-800 leading-tight">
                        Looking for a vehicle? You’re at the right place.
                    </h1>
                    <p className="text-lg text-green-900/80 ">
                        We have a large selection of locally owned cars available for you to choose from. Rental plans are customized to suit your needs.
                    </p>
                    <p className="text-lg text-green-900/80">
                        With over <span className="font-bold">300+ cars</span> located nationwide, we will have something for you.
                    </p>
                </div>
                <div className="flex-[1.1]">
                    <SearchForm />
                </div>
            </section>

            {/* Why Us */}
            <section className="px-6 lg:px-24 py-10">
                <h1 className="text-5xl font-extrabold text-green-800 text-center">Why us?</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                    <WhyUsCard icon={<FaMoneyBillWave size={50} />} title="Save money" text="No setup or registration fees. You only pay when you rent a car. Get started for FREE!" />
                    <WhyUsCard icon={<FaUserFriends size={50} />} title="Convenient" text="Large selection of privately owned cars to suit your needs throughout the country." />
                    <WhyUsCard icon={<FaShieldAlt size={50} />} title="Legal and insurance" text="We cover all rentals and provide roadside assistance. Our rating system ensures safety." />
                    <WhyUsCard icon={<FaHeadset size={50} />} title="24/7 support" text="Our team is available anytime to assist you with our 24/7 hotline and services." />
                </div>
            </section>

            {/* Testimonials */}
            <section className="px-6 lg:px-24 py-10">
                <h1 className="text-5xl font-extrabold text-green-800 text-center">What people say?</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-6">
                    <Testimonial text="Super easy to rent! The process was smooth and quick." />
                    <Testimonial text="The best car rental service I’ve ever used. Highly recommended!" />
                    <Testimonial text="I love how flexible the rental options are. Great experience!" />
                    <Testimonial text="Support was excellent! The car was in great condition too." />
                </div>
            </section>

            {/* Where to find us */}
            <section className="px-6 lg:px-24 py-10">
                <h1 className="text-5xl font-extrabold text-green-800 text-center">Where to find us?</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    <WhereToFindUs text="Hà Nội" amount={90} />
                    <WhereToFindUs text="TP. HCM" amount={10} />
                    <WhereToFindUs text="Đà Nẵng" amount={20} />
                    <WhereToFindUs text="Thái Nguyên" amount={20} />
                </div>
            </section>

            <Footer />
        </div>
    );
};

const WhereToFindUs = ({ text, amount }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-row items-center gap-4 transform hover:scale-105 transition duration-300">
        <div className="border rounded-full border-gray-300 w-16 h-16 flex items-center justify-center text-green-700">
            <FaImage />
        </div>
        <div className="absolute bottom-0 left-2">
            <p className="text-lg font-semibold text-green-900/80">{text}</p>
            <span className="text-lg font-medium text-green-900/80">{amount} +car</span>
        </div>
    </div>
);

const WhyUsCard = ({ icon, title, text }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center transform hover:scale-105 transition duration-300">
        <div className="border rounded-full border-gray-300 w-20 h-20 flex items-center justify-center text-green-700">
            {icon}
        </div>
        <h3 className="font-bold text-2xl text-green-800 mt-4">{title}</h3>
        <p className="text-lg text-green-900/80 mt-2">{text}</p>
    </div>
);

const Testimonial = ({ text }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-row items-center gap-4 transform hover:scale-105 transition duration-300">
        <div className="border rounded-full border-gray-300 w-16 h-16 flex items-center justify-center text-green-700">
            <FaUserFriends size={40} />
        </div>
        <p className="text-lg text-green-900/80">{text}</p>
    </div>
);

export default CustomerHome;
