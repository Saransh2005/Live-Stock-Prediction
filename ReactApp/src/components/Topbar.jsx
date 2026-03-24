import React, { useState, useEffect } from 'react';
import { Search, Activity, Settings2 } from 'lucide-react';

export default function Topbar({ activeStock, setActiveStock, indicators, setIndicators }) {
  const [searchInput, setSearchInput] = useState(activeStock);

  useEffect(() => {
    setSearchInput(activeStock);
  }, [activeStock]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveStock(searchInput.trim().toUpperCase());
    }
  };

  return (
    <header className="topbar">
      <div className="brand">
        <Activity size={24} color="#2962FF" />
        Trading<span>AI</span>
      </div>
      
      <form onSubmit={handleSearch} className="search-form">
        <Search size={16} color="#787B86" />
        <input 
          type="text" 
          value={searchInput} 
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Symbol search (AAPL, TSLA...)"
          className="search-input"
        />
      </form>

      <div className="indicators-toggle">
        <Settings2 size={16} />
        <label>
          <input 
            type="checkbox" 
            checked={indicators.sma} 
            onChange={e => setIndicators({...indicators, sma: e.target.checked})} 
          /> SMA (20)
        </label>
        <label>
          <input 
            type="checkbox" 
            checked={indicators.ema} 
            onChange={e => setIndicators({...indicators, ema: e.target.checked})} 
          /> EMA (20)
        </label>
      </div>
    </header>
  );
}
