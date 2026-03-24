import React, { useState, useEffect } from 'react';

const INTERVALS = ['1m','5m','15m','1h','4h','1D','1W'];
const TIMEFRAMES = ['1D','5D','1M','3M','6M','YTD','1Y','5Y','All'];

export default function Topbar({ activeStock, setActiveStock, stockInfo, interval, setInterval, timeframe, setTimeframe }) {
  const [searchInput, setSearchInput] = useState(activeStock);

  useEffect(() => { setSearchInput(activeStock); }, [activeStock]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) setActiveStock(searchInput.trim().toUpperCase());
  };

  const isBull = stockInfo && stockInfo.change_pct >= 0;

  return (
    <>
      {/* Main chart header */}
      <header className="tv-topbar">
        <div className="tv-logo-wrap" onClick={() => window.location.href = '/'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Mindx<span>Trade</span>
        </div>

        <div className="tv-symbol-info">
          <form onSubmit={handleSearch} style={{display:'flex', alignItems:'center', gap:6}}>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              style={{background:'none', border:'none', outline:'none', color:'var(--text)', fontWeight:700, fontSize:14, width:140, cursor:'text'}}
              placeholder="Symbol..."
            />
          </form>
          <span className="tv-exchange-badge">D · NASDAQ</span>
        </div>

        <div className="tv-intervals">
          {INTERVALS.map(iv => (
            <div
              key={iv}
              className={`tv-interval-btn ${interval === iv ? 'active' : ''}`}
              onClick={() => setInterval(iv)}
            >
              {iv}
            </div>
          ))}
        </div>

        {stockInfo && (
          <div className="tv-ohlcv">
            <span>O <span>{stockInfo.open?.toFixed(2) ?? '—'}</span></span>
            <span>H <span>{stockInfo.high?.toFixed(2) ?? '—'}</span></span>
            <span>L <span>{stockInfo.low?.toFixed(2) ?? '—'}</span></span>
            <span>C <span>{stockInfo.price?.toFixed(2) ?? '—'}</span></span>
            <span className={isBull ? 'bull' : 'bear'}>
              {isBull ? '+' : ''}{stockInfo.change_pct?.toFixed(2) ?? '0.00'}%
            </span>
          </div>
        )}

        <div className="tv-topbar-actions">
          <button className="tv-action-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            Indicators
          </button>
          <button className="tv-action-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="3" width="12" height="18" rx="2"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/></svg>
            Replay
          </button>
        </div>

        <div className="tv-topbar-right">
          <button className="tv-action-btn primary">Trade</button>
          <button className="tv-action-btn" style={{border:'1px solid var(--border)'}}>Publish</button>
          <div className="tv-avatar">S</div>
        </div>
      </header>

      {/* Timeframe row at bottom of chart area (passed as prop) */}
    </>
  );
}

export function TimeframeBar({ timeframe, setTimeframe }) {
  return (
    <div className="timeframe-bar">
      {TIMEFRAMES.map(tf => (
        <div
          key={tf}
          className={`tf-btn ${timeframe === tf ? 'active' : ''}`}
          onClick={() => setTimeframe(tf)}
        >
          {tf}
        </div>
      ))}
    </div>
  );
}
