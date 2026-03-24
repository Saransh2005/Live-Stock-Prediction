import React, { useState } from 'react';
import './App.css';
import Topbar from './components/Topbar';
import Chart from './components/Chart';
import Watchlist from './components/Watchlist';

function App() {
  const [activeStock, setActiveStock] = useState('AAPL');
  const [indicators, setIndicators] = useState({ sma: true, ema: true });

  return (
    <div className="app-container">
      <Topbar 
        activeStock={activeStock} 
        setActiveStock={setActiveStock} 
        indicators={indicators} 
        setIndicators={setIndicators} 
      />
      
      <div className="workspace">
        <div className="main-chart-area">
          <Chart activeStock={activeStock} indicators={indicators} />
        </div>
        
        <div className="sidebar">
          <Watchlist activeStock={activeStock} onSelectStock={setActiveStock} />
        </div>
      </div>
    </div>
  );
}

export default App;
