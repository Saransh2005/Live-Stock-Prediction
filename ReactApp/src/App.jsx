import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ProductsPage from './pages/ProductsPage';
import CommunityPage from './pages/CommunityPage';
import MarketsPage from './pages/MarketsPage';
import BrokersPage from './pages/BrokersPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/stock/:symbol" element={<Dashboard />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/markets" element={<MarketsPage />} />
        <Route path="/brokers" element={<BrokersPage />} />
        <Route path="/more" element={<ProductsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
