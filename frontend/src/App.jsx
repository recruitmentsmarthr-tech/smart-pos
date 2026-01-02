import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MainLayout from './pages/MainLayout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory/index';
import AddStock from './pages/Inventory/AddStock';
import EditStock from './pages/Inventory/EditStock';
import Categories from './pages/Categories/index';
import VoucherGeneration from './pages/VoucherGeneration'; // NEW IMPORT
import Login from './pages/Login';

// THE SECURITY GATE
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  return children;
};

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'midnight';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'slate');
    if (theme === 'midnight') {
      root.classList.add('dark');
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // (Your existing mock data state - kept safe)
  const [products, setProducts] = useState([
    { id: 1, name: "Espresso", price: 2.50, category: "COFFEE", color: "bg-[#FF5C00]", images: ["https://images.unsplash.com/photo-1510707577719-af7c183f1e59?w=400"] },
    { id: 2, name: "Iced Latte", price: 4.50, category: "COFFEE", color: "bg-[#00A3FF]", images: ["https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400"] },
  ]);

  const cycleTheme = () => {
    const themes = ['midnight', 'light', 'slate'];
    setTheme(themes[(themes.indexOf(theme) + 1) % themes.length]);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* PROTECTED AREA */}
        <Route element={
          <ProtectedRoute>
            <MainLayout theme={theme} cycleTheme={cycleTheme} user={{username: "ADMIN"}} />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<Dashboard theme={theme} products={products} />} />
          <Route path="/inventory" element={<Inventory theme={theme} />} />
          <Route path="/inventory/add" element={<AddStock />} />
          <Route path="/inventory/edit/:id" element={<EditStock />} />
          
          {/* 2. NEW ROUTE ADDED HERE */}
          <Route path="/categories" element={<Categories theme={theme} />} /> 
          <Route path="/voucher-generation" element={<VoucherGeneration />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;