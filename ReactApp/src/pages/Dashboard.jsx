import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Topbar, { TimeframeBar } from '../components/Topbar';
import Chart from '../components/Chart';
import Watchlist from '../components/Watchlist';
import LeftToolbar from '../components/LeftToolbar';
import '../App.css';

export default function Dashboard() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [activeStock, setActiveStock] = useState(symbol?.toUpperCase() || 'AAPL');
  const [indicators, setIndicators] = useState({ sma: true, ema: false, bb: false });
  const [stockInfo, setStockInfo] = useState(null);
  const [interval, setInterval] = useState('1D');
  const [timeframe, setTimeframe] = useState('3M');

  const handleSelectStock = (sym) => {
    setActiveStock(sym);
    navigate(`/stock/${sym}`, { replace: true });
  };

  return (
    <div className="app-container">
      <Topbar
        activeStock={activeStock}
        setActiveStock={handleSelectStock}
        stockInfo={stockInfo}
        interval={interval}
        setInterval={setInterval}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
      />
      <div className="workspace">
        <LeftToolbar />
        <div className="main-content">
          <div className="main-chart-area">
            <Chart
              activeStock={activeStock}
              indicators={indicators}
              interval={interval}
              timeframe={timeframe}
              onDataUpdate={setStockInfo}
            />
          </div>
          <TimeframeBar timeframe={timeframe} setTimeframe={setTimeframe} />
        </div>
        <div className="right-panel">
          <Watchlist
            activeStock={activeStock}
            onSelectStock={handleSelectStock}
          />
        </div>
      </div>
    </div>
  );
}
