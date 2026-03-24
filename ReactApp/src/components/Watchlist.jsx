import React, { useEffect, useState } from 'react';

const GROUPS = {
  'INDICES': ['^NSEI', '^BSESN', '^GSPC', '^NDX', '^DJI'],
  'STOCKS': ['AAPL', 'TSLA', 'NVDA', 'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS'],
  'FUTURES': ['GC=F', 'CL=F'],
};

const COLORS = {
  '^NSEI': '#FF6B35', '^BSESN': '#F7931A', '^GSPC': '#E53935',
  '^NDX': '#1E88E5', '^DJI': '#8E24AA', 'AAPL': '#555',
  'TSLA': '#E53935', 'NVDA': '#43A047', 'RELIANCE.NS': '#1E88E5',
  'TCS.NS': '#673AB7', 'HDFCBANK.NS': '#E91E63',
  'GC=F': '#FDD835', 'CL=F': '#757575',
};

export default function Watchlist({ activeStock, onSelectStock }) {
  const [data, setData] = useState({});
  const [selected, setSelected] = useState(activeStock);
  const allSymbols = Object.values(GROUPS).flat().join(',');

  useEffect(() => { setSelected(activeStock); }, [activeStock]);

  useEffect(() => {
    let alive = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(`/api/watchlist?stocks=${allSymbols}`);
        const list = await res.json();
        if (!alive) return;
        const map = {};
        list.forEach(d => { map[d.stock] = d; });
        setData(map);
      } catch {}
    };
    fetch_(); 
    const id = setInterval(fetch_, 60000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const selectedItem = data[selected] || null;

  const handleClick = (sym) => {
    setSelected(sym);
    onSelectStock(sym);
  };

  return (
    <>
      {/* Header */}
      <div className="wl-header">
        <div className="wl-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Watchlist
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div className="wl-header-actions">
          <div className="wl-icon-btn" title="Add symbol">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <div className="wl-icon-btn" title="Layout">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </div>
          <div className="wl-icon-btn" title="More">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="wl-columns">
        <span>Symbol</span>
        <span style={{textAlign:'right'}}>Last</span>
        <span style={{textAlign:'right'}}>Chg</span>
        <span style={{textAlign:'right'}}>Chg%</span>
      </div>

      {/* Rows */}
      <div style={{flex:1, overflowY:'auto'}}>
        {Object.entries(GROUPS).map(([cat, syms]) => (
          <div key={cat}>
            <div className="wl-category">▾ {cat}</div>
            {syms.map(sym => {
              const d = data[sym];
              const isBull = d ? d.change_pct >= 0 : true;
              return (
                <div
                  key={sym}
                  className={`wl-row ${selected === sym ? 'selected' : ''}`}
                  onClick={() => handleClick(sym)}
                >
                  <div className="wl-sym">
                    <div className="wl-dot" style={{background: COLORS[sym] || '#888'}}/>
                    {sym.replace('.NS','').replace('.BO','').replace('^','')}
                  </div>
                  <div className={`wl-last ${isBull ? 'bull-text' : 'bear-text'}`}>
                    {d ? d.price.toFixed(2) : '—'}
                  </div>
                  <div className={`wl-chg ${isBull ? 'bull-text' : 'bear-text'}`}>
                    {d ? `${isBull?'+':''}${((d.change_pct/100)*d.price).toFixed(2)}` : '—'}
                  </div>
                  <div className={`wl-chgpct ${isBull ? 'bull-text' : 'bear-text'}`}>
                    {d ? `${isBull?'+':''}${d.change_pct.toFixed(2)}%` : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Stock detail panel */}
      {selectedItem && (
        <div className="stock-detail">
          <div className="sd-header">
            <div>
              <div className="sd-name">{selected.replace('.NS','').replace('.BO','')}</div>
              <div className="sd-exchange">NASDAQ · Electronic Technology</div>
            </div>
            <div style={{display:'flex', gap:6}}>
              <div className="wl-icon-btn"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></div>
              <div className="wl-icon-btn"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>
              <div className="wl-icon-btn"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></div>
            </div>
          </div>

          <div className="sd-price-main">
            {selectedItem.price.toFixed(2)}
            <span className="sd-price-unit">USD</span>
            <span className={`sd-price-change ${selectedItem.change_pct >= 0 ? 'bull-text' : 'bear-text'}`}>
              {selectedItem.change_pct >= 0 ? '+' : ''}{selectedItem.change_pct.toFixed(2)}%
            </span>
          </div>
          <div className="sd-timestamp">Last updated · {new Date().toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'})} GMT+5:30</div>

          <div className="sd-premarket">
            <span>AI Target</span>
            <span className={selectedItem.signal === 'bullish' ? 'bull-text' : 'bear-text'}>
              {selectedItem.prediction.toFixed(2)} USD
            </span>
            <span style={{color:'var(--text-dim)', fontSize:11, marginLeft:6}}>{selectedItem.signal?.toUpperCase()}</span>
          </div>
          <div className="sd-news">
            <span className="sd-news-tag">★ AI Signal</span>
            RSI and momentum analysis suggests <b className={selectedItem.signal === 'bullish' ? 'bull-text' : 'bear-text'}>{selectedItem.signal}</b> positioning. AI price target: {selectedItem.prediction.toFixed(2)} USD.
          </div>
        </div>
      )}
    </>
  );
}
