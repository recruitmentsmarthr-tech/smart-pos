import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';      // Ensure this matches your file name
import Dashboard from './Dashboard'; // The file we just created

function App() {
  return (
    <Router>
      <Routes>
        {/* Route 1: The Login Screen (Default) */}
        <Route path="/" element={<Login />} />

        {/* Route 2: The Dashboard (Protected inside the component) */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Catch-all: Redirect unknown URLs to Login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;