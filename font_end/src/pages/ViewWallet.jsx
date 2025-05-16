import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { FaCalendarAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { fetchHomeData } from '../../src/api/customer/HomeApi';

const WalletPage = ({ setUser }) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const startRef = useRef(null);
  const endRef = useRef(null);
  const [vnpayUrl, setVnpayUrl] = useState('');
  const popupRef = useRef(null);
  const [showPayment, setShowPayment] = useState(false);
  const [isPayingViaVnpay, setIsPayingViaVnpay] = useState(false);
  const [price_to_up, setPriceToUp] = useState("");
  const [user_id, setUserId] = useState("");

  // 1) Hàm fetch lại balance từ server
  const fetchWallet = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/v1/wallet', { withCredentials: true });
      if (res.data.success) {
        setBalance(res.data.users_wallet[0].balance);
      }
    } catch (err) {
      console.error('Error fetching wallet:', err);
      toast.error('Failed to load balance');
    }
  };

  // Lần đầu load: fetch user info + wallet
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchHomeData();
        if (response.success) {
          setUser(response.data);
          setUserId(response.data.user_id);
        }
      } catch (error) {
        console.error('Error fetching home data:', error);
      }
    };
    fetchData();
    fetchWallet();
  }, [setUser]);

  // Tìm giao dịch theo ngày
  const searchTransactions = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    if (startDate > endDate) {
      toast.error('Start date must be before end date');
      return;
    }
    try {
      const payload = { start_date: `${startDate} 00:00:00`, end_date: `${endDate} 23:59:59` };
      const res = await axios.post('http://localhost:3000/api/v1/findTransction', payload, { withCredentials: true });
      if (res.data.success) {
        setTransactions(res.data.transaction);
        toast.success('Transactions loaded');
      } else {
        toast.error(res.data.message || 'No transactions');
      }
    } catch (err) {
      console.error('Error searching transactions:', err);
      toast.error('Search failed');
    }
  };

  // Mở popup VNPAY
  const openVnpayPopup = () => {
    if (!vnpayUrl) return;
    setIsPayingViaVnpay(true);
    const width = 600, height = 800;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    popupRef.current = window.open(
      vnpayUrl,
      'vnpayWindow',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    const timer = setInterval(() => {
      if (popupRef.current?.closed) {
        clearInterval(timer);
        setIsPayingViaVnpay(false);
      }
    }, 500);
  };

  // Nhận message từ popup
  useEffect(() => {
    function handleMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (event.data === 'VNPAY_SUCCESS') {
        // Sau khi success: fetch lại số dư
        fetchWallet();
        toast.success('Nạp tiền thành công!');
      } else if (event.data === 'VNPAY_FAIL') {
        toast.error('Thanh toán thất bại.');
      }
      setIsPayingViaVnpay(false);
      popupRef.current?.close();
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Tạo URL VNPAY khi showPayment hoặc price_to_up thay đổi
  useEffect(() => {
    if (showPayment && price_to_up) {
      const payload = {
        amount: price_to_up,
        returnUrl: `http://localhost:3000/api/v1/vnpay/return/top_up/${user_id}/${price_to_up}`
      };
      axios.post('http://localhost:3000/api/v1/vnpay/create', payload, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      })
      .then(res => {
        setVnpayUrl(res.data.url);
      })
      .catch(err => {
        console.error('Error creating VNPay URL:', err);
        toast.error('Không tạo được link VNPay');
      });
    }
  }, [showPayment, price_to_up, user_id]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm p-4 text-sm text-gray-600 flex items-center space-x-4 container mx-auto rounded-b-lg">
        <Link to="/owner/home" className="hover:underline text-blue-600">Home</Link>
        <span className="text-gray-400">/</span>
        <span className="font-semibold text-gray-800">My Wallet</span>
      </nav>
      <main className="flex-grow container mx-auto p-6">
        <h1 className="text-3xl font-semibold mb-6">My Wallet</h1>

        {/* Balance & Payment Section */}
        <div className="bg-white p-8 rounded-2xl shadow-lg mb-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Balance Info */}
            <div>
              <p className="text-gray-600 text-lg">Your current balance:</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {balance.toLocaleString()} VND
              </p>
            </div>

            {/* Top-up Form */}
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="number"
                  onChange={e => setPriceToUp(e.target.value)}
                  className="w-full pl-4 pr-16 py-3 border border-gray-300 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Nhập số tiền"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">VND</span>
              </div>
              <div className="flex justify-between space-x-4">
                <button className="flex-1 py-3 bg-yellow-400 text-black font-medium rounded-2xl hover:bg-yellow-500 transition duration-200">
                  Withdraw
                </button>
                <button
                  onClick={() => setShowPayment(true)}
                  className="flex-1 py-3 bg-green-500 text-white font-medium rounded-2xl hover:bg-green-600 transition duration-200"
                >
                  Top-up
                </button>
              </div>
              {showPayment && (
                vnpayUrl ? (
                  <button
                    onClick={openVnpayPopup}
                    className="w-full py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition duration-200"
                  >
                    Thanh toán VNPAY
                  </button>
                ) : (
                  <p className="text-gray-500 italic">Đang tạo link thanh toán...</p>
                )
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* ...phần lọc giữ nguyên... */}
            <div>
              <label className="block text-gray-700">From</label>
              <div className="relative">
                <input
                  ref={startRef}
                  type="date"
                  className="w-full border-gray-300 rounded px-3 py-2"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={e => setStartDate(e.target.value)}
                />
                <FaCalendarAlt
                  onClick={() => startRef.current?.showPicker?.()}
                  className="cursor-pointer absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-700">To</label>
              <div className="relative">
                <input
                  ref={endRef}
                  type="date"
                  className="w-full border-gray-300 rounded px-3 py-2"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={e => setEndDate(e.target.value)}
                />
                <FaCalendarAlt
                  onClick={() => endRef.current?.showPicker?.()}
                  className="cursor-pointer absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>
            <div>
              <button
                onClick={searchTransactions}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white p-6 rounded-lg shadow">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">No</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Method</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Date time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr key={tx.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="border px-4 py-2 text-center">{idx + 1}</td>
                  <td className="border px-4 py-2">
                    {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()} VND
                  </td>
                  <td className="border px-4 py-2 text-center">{tx.method}</td>
                  <td className="border px-4 py-2 text-center">{tx.type}</td>
                  <td className="border px-4 py-2 text-center">
                    {new Date(tx.created_date).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WalletPage;
