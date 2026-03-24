import React, { useEffect, useState } from 'react';

export default function Watchlist({ activeStock, onSelectStock }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let interval;

    const fetchWatchlist = async () => {
      try {
        const res = await fetch('https://live-stock-prediction-5pcz.onrender.com/api/watchlist');
        const data = await res.json();
        if (isMounted) {
          setItems(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    };

    fetchWatchlist();
    interval = setInterval(fetchWatchlist, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="watchlist-container">
      <div className="watchlist-title">⭐ Watchlist</div>
      {loading && <div style={{fontSize: 13, color: 'var(--text-muted)'}}>Loading data...</div>}
      
      <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
        {items.map(item => (
          <div 
            key={item.stock}
            className={`watchlist-item ${activeStock === item.stock ? 'active' : ''}`}
            onClick={() => onSelectStock(item.stock)}
          >
            <div>
              <div style={{fontWeight: 800}}>{item.stock}</div>
              <div style={{fontSize: 11, color: 'var(--text-muted)', paddingTop: 2}}>
                {item.change_pct >= 0 ? '+' : ''}{item.change_pct.toFixed(2)}%
              </div>
            </div>
            <div style={{textAlign: 'right'}}>
              <div style={{fontWeight: 600}}>${item.price.toFixed(2)}</div>
              <div style={{fontSize: 11, fontWeight: 600, paddingTop: 2}} className={item.signal === 'bullish' ? 'bullish' : 'bearish'}>
                AI: ${item.prediction.toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
