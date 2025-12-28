import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 1. Security Check: Do we have a token?
    const token = localStorage.getItem('token');
    
    if (!token) {
      // No token? Kick them back to login.
      navigate('/');
    } else {
      // We have a token! (In the future, we will decode this to get the real username)
      setUser({ username: "Staff Member" });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token'); // Destroy the key
    navigate('/'); // Go back to login
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar / Navigation */}
      <aside className="w-64 bg-blue-800 text-white flex flex-col">
        <div className="p-4 text-2xl font-bold text-center">Smart POS</div>
        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full text-left py-2 px-4 bg-blue-900 rounded">POS Register</button>
          <button className="w-full text-left py-2 px-4 hover:bg-blue-700 rounded">Transactions</button>
          <button className="w-full text-left py-2 px-4 hover:bg-blue-700 rounded">Products</button>
        </nav>
        <div className="p-4">
          <button 
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 py-2 rounded font-bold"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-700">New Sale</h2>
          <div className="text-gray-600">Logged in as: <strong>{user?.username}</strong></div>
        </header>

        {/* POS Grid Area */}
        <div className="flex-1 p-6 grid grid-cols-3 gap-6">
            {/* Left: Product Grid (Placeholder) */}
            <div className="col-span-2 bg-white rounded shadow p-4">
                <h3 className="text-lg font-bold mb-4">Select Products</h3>
                <div className="grid grid-cols-3 gap-4">
                    {/* Fake Products */}
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <div key={item} className="h-24 bg-gray-200 rounded flex items-center justify-center cursor-pointer hover:bg-blue-100 border border-gray-300">
                            Product {item}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Cart (Placeholder) */}
            <div className="bg-white rounded shadow p-4 flex flex-col">
                <h3 className="text-lg font-bold mb-4 border-b pb-2">Current Cart</h3>
                <div className="flex-1 bg-gray-50 rounded mb-4 flex items-center justify-center text-gray-400">
                    Cart is Empty
                </div>
                <div className="text-2xl font-bold text-right mb-4">Total: $0.00</div>
                <button className="w-full bg-green-600 text-white py-4 rounded text-xl font-bold hover:bg-green-700 shadow-lg">
                    CHARGE
                </button>
            </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;