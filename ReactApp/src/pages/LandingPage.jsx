import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

// ─── Sparkline SVG ────────────────────────────────────────────────────────────
function Sparkline({ data = [], color = '#26A69A', fill = true, height = 80 }) {
  if (!data.length) return <div style={{ height }} />;
  const w = 400, h = height;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  });
  const pathD = `M${pts.join('L')}`;
  const areaD = `${pathD}L${w},${h}L0,${h}Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height, display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {fill && <path d={areaD} fill={`url(#g${color.replace('#', '')})`} />}
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
function BarChart({ data = [], color = '#2962FF', height = 80 }) {
  if (!data.length) return <div style={{ height }} />;
  const max = Math.max(...data) * 1.1;
  const barW = 400 / data.length;
  return (
    <svg viewBox={`0 0 400 ${height}`} style={{ width: '100%', height, display: 'block' }} preserveAspectRatio="none">
      {data.map((v, i) => {
        const bh = (v / max) * height;
        return <rect key={i} x={i * barW + 1} y={height - bh} width={barW - 2} height={bh} fill={color} rx="1" />;
      })}
    </svg>
  );
}

// ─── Simulated sparkline data generators ─────────────────────────────────────
const SPLINE = {
  spx: [5200,5650,5900,5400,5100,4800,5000,5300,5800,6000,5700,5900,6100,6200,5950,6050,6300,6500,6400,6580],
  crypto: [2.1,2.3,2.6,2.8,2.4,2.2,2.5,2.7,2.9,3.0,2.8,2.6,2.45,2.5,2.55,2.48,2.41],
  dxy: [102,103,102.5,101,99.5,98,99,100,99.5,100.5,101,100,99.3,99.8,99.5],
  yield: [4.0,4.1,4.3,4.5,4.6,4.8,4.7,4.5,4.4,4.3,4.5,4.4,4.37],
  inflation: [3.1,3.0,3.2,3.1,2.9,3.0,2.9,3.1,3.0,2.98,2.95,2.9,3.0],
};

const MAJOR_INDICES = [
  { name: 'Nasdaq 100', ticker: 'NDX', badge: '100', price: '24,188.59', curr: 'USD', chg: '+1.22%', bull: true, bg: '#1565C0' },
  { name: 'Japan 225', ticker: 'NI225', badge: '225', price: '52,252.21', curr: 'JPY', chg: '+1.43%', bull: true, bg: '#283593' },
  { name: 'SSE Composite', ticker: '000001', badge: <svg width="18" height="18" viewBox="0 0 24 24" fill="#777"><circle cx="12" cy="12" r="10"/></svg>, price: '3,881.2797', curr: 'CNY', chg: '+1.78%', bull: true, bg: '#1A237E' },
  { name: 'FTSE 100', ticker: 'UKX', badge: '🇬🇧', price: '9,845.75', curr: 'GBP', chg: '-0.49%', bull: false, bg: '#311B92' },
  { name: 'DAX', ticker: 'DAX', badge: 'X', price: '22,429.69', curr: 'EUR', chg: '-0.99%', bull: false, bg: '#4A148C' },
  { name: 'CAC 40', ticker: 'PX1', badge: '40', price: '7,685.36', curr: 'EUR', chg: '-0.53%', bull: false, bg: '#880E4F' },
];

const COMMUNITY_IDEAS = [
  {
    title: '#GBPNZD: Two Targets, Once Strong Bullish Entry!',
    desc: 'The GBP/NZD pair demonstrated a favourable reversal upon reaching our designated buying zone at...',
    author: 'Setupsfx_', date: 'Mar 23', comments: 19, boosts: 41, color: '#26A69A',
  },
  {
    title: 'Super Micro Stock Under $20 After Brutal 33% Rout. Time to Buy?',
    desc: 'If only there was a way to track where things went wrong. The board of directors at Super Micro...',
    author: 'TradingView', date: 'Mar 23', comments: 11, boosts: 116, color: '#2962FF',
  },
  {
    title: 'AMZN Holding Range - Waiting for Direction. Mar. 23',
    desc: 'Looking at AMZN right now, price is coming off a selloff but starting to stabilize around the 205–207 area. Thi...',
    author: 'BullBearInsights', date: 'Mar 23', comments: 9, boosts: 50, color: '#EF5350',
  },
];

const INDICATOR_IDEAS = [
  {
    title: 'TASC 2026.04 A Synthetic Oscillator', desc: 'Overview This script implements a Synthetic Oscillator as presented by John F. Ehlers in the April 2026 TASC Traders\' Tips article "Avoiding Whipsaw...',
    author: 'PineCodersTASC', date: 'Mar 23', comments: 4, boosts: 90, color: '#26A69A',
  },
  {
    title: 'Volume Spread Analysis IQ [TradingIQ]', desc: 'Hello Traders! Volume Spread Analysis IQ This indicator was most voted on for our indicator competition - so here it is! :D...',
    author: 'Trading-IQ', date: 'Mar 23', comments: 7, boosts: 333, color: '#2962FF',
  },
  {
    title: 'Market Microstructure Analytics', desc: 'The Hidden Toll on Every Trade Every time you buy or sell a financial instrument, you pay a cost that never appears on your brokerage statement. It is not a...',
    author: 'EdgeTools', date: 'Mar 23', comments: 5, boosts: 157, color: '#EF5350',
  },
];

const TOP_STORIES = [
  { ticker:'TSLA', ago:'1 hour ago', src:'TradingView', headline:'Tesla Stock Jumps 3.5% After Musk Unveils Terafab Joint Venture Project', c:'#EF5350' },
  { ticker:'MSTR', ago:'2 hours ago', src:'TradingView', headline:'Strategy Stock Gains on Saylor\'s $76 Million Bitcoin Buy, New Target for 2026', c:'#FF6D00' },
  { ticker:'SPX', ago:'2 hours ago', src:'TradingView', headline:'S&P 500 Futures Drop as Trump\'s "Very Good" Talks Fail to Keep Buyers Going', c:'#EF5350' },
  { ticker:'USD/JPY', ago:'yesterday', src:'TradingView', headline:'Dollar Chases ¥160.00 as FX Markets Reshuffle amid War Jitters', c:'#1E88E5' },
  { ticker:'IXIC', ago:'yesterday', src:'TradingView', headline:'Nasdaq Futures Tumble 1% as US-Iran War Tensions Escalate', c:'#1E88E5' },
  { ticker:'XAU/USD', ago:'yesterday', src:'TradingView', headline:'Gold Extends Brutal Slide with Prices Crashing Below $4,200', c:'#FDD835' },
  { ticker:'SMCI', ago:'4 days ago', src:'TradingView', headline:'Super Micro Drops 12% as Secret China Shipments Spark Arrests and Manhunt', c:'#9C27B0' },
  { ticker:'PL', ago:'4 days ago', src:'TradingView', headline:'Planet Labs Stock Soars as Earnings Surprise Investors. Why It\'s Up 540% in a Year', c:'#2962FF', highlight: true },
  { ticker:'SPX', ago:'4 days ago', src:'TradingView', headline:'S&P 500 Futures Rise, Stocks Eye Losing Stretch in a Turbulent Week', c:'#EF5350' },
  { ticker:'META', ago:'5 days ago', src:'TradingView', headline:'Meta Stock Steady After Company Pulls the Plug on $80-Billion Metaverse Flop', c:'#1565C0' },
  { ticker:'OIL', ago:'5 days ago', src:'TradingView', headline:'Brent Oil Surges to $114 as Iranian Strike Hits Qatar Facilities, Sending Gas Prices Up 30%', c:'#795548' },
  { ticker:'XAU/USD', ago:'5 days ago', src:'TradingView', headline:'Gold Prices Plunge $250 as Traders Rush to Raise Cash amid War Pressures', c:'#FDD835' },
];

const NAV = ['Products', 'Community', 'Markets', 'Brokers', 'More'];

// ─── Mini idea card chart thumbnail ─────────────────────────────────────────
function ChartThumb({ color = '#26A69A', type = 'candle' }) {
  const bars = Array.from({ length: 30 }, (_, i) => ({
    o: 50 + Math.sin(i * 0.4) * 20 + Math.random() * 8,
    h: 60 + Math.sin(i * 0.4) * 22 + Math.random() * 10,
    l: 40 + Math.sin(i * 0.4) * 18 + Math.random() * 8,
    c: 50 + Math.sin(i * 0.5) * 22 + Math.random() * 8,
  }));
  const W = 300, H = 130;
  const min = Math.min(...bars.map(b => b.l)), max = Math.max(...bars.map(b => b.h));
  const sy = v => H - ((v - min) / (max - min)) * (H - 10) - 5;
  const bw = W / bars.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', display: 'block', background: '#1a1d2e' }} preserveAspectRatio="none">
      {bars.map((b, i) => {
        const bull = b.c >= b.o;
        const c = bull ? '#26A69A' : '#EF5350';
        const x = i * bw;
        const oy = sy(b.o), cy = sy(b.c), hy = sy(b.h), ly = sy(b.l);
        return (
          <g key={i}>
            <line x1={x + bw / 2} y1={hy} x2={x + bw / 2} y2={ly} stroke={c} strokeWidth={0.8} />
            <rect x={x + 1} y={Math.min(oy, cy)} width={Math.max(bw - 2, 1)} height={Math.max(Math.abs(cy - oy), 1)} fill={c} />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const [mktData, setMktData] = useState({});
  const [search, setSearch] = useState('');
  const [ideaTab, setIdeaTab] = useState('Editors\' picks');
  const [indicatorTab, setIndicatorTab] = useState('Editors\' picks');
  const [newsTab, setNewsTab] = useState('US stocks');
  const navigate = useNavigate();

  useEffect(() => {
    const syms = 'AAPL,TSLA,NVDA,^GSPC,^NDX,^NSEI,^BSESN,BTC-USD,ETH-USD,GC=F,CL=F';
    fetch(`http://localhost:5001/api/watchlist?stocks=${syms}`)
      .then(r => r.json())
      .then(arr => {
        const m = {}; arr.forEach(d => { m[d.stock] = d; }); setMktData(m);
      }).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) window.open(`/stock/${search.trim().toUpperCase()}`, '_blank');
  };

  const spx = mktData['^GSPC'];

  return (
    <div className="lp-root">
      {/* ── Topbar ─────────────────────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-logo" onClick={() => navigate('/')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M5 3L3 7h4L5 3zm2 4H3v14h14V7H7zM5 17H4v-4h1v4zm3 0H7v-6h1v6zm3 0h-1v-3h1v3zm3 0h-1v-8h1v8z"/><path d="M16 2l-2 4h4l-2-4zm2 4h-4v14h4V6z" opacity=".5"/></svg>
          <span className="lp-logo-text">MindxTrade</span>
        </div>

        <form onSubmit={handleSearch} className="lp-searchbar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search (⌘K)" />
        </form>

        <div className="lp-navlinks">
          {NAV.map(n => <span key={n} className="lp-navlink">{n}</span>)}
        </div>

        <div className="lp-topright">
          <div className="lp-avatar">S</div>
          <button className="lp-upgrade">
            <div>Upgrade now</div>
            <div className="lp-upgrade-sub">30-day free trial</div>
          </button>
        </div>
      </nav>

      {/* ── Body (scrollable) ────────────────────────────────────────── */}
      <div className="lp-body-wrap">
        <div className="lp-scroll">

          {/* ── Market Summary ──────────────────────────────────────── */}
          <section className="lp-section">
            <h2 className="lp-section-title">Market summary <span className="lp-chevron">›</span></h2>
            <div className="lp-summary-grid">
              {/* Big S&P chart */}
              <div className="lp-hero-card">
                <div className="lp-hero-header">
                  <div className="lp-badge" style={{ background: '#C62828' }}>500</div>
                  <div>
                    <span className="lp-hero-name">S&amp;P 500 </span>
                    <span className="lp-ticker-badge">SPX</span>
                    <span className="lp-ticker-badge" style={{ marginLeft: 4 }}>—</span>
                  </div>
                </div>
                <div className="lp-hero-price">
                  {spx ? spx.price.toFixed(2) : '6,580.99'}
                  <span className="lp-currency">USD</span>
                  <span className={`lp-change ${spx ? (spx.change_pct >= 0 ? 'bull' : 'bear') : 'bull'}`}>
                    {spx ? `${spx.change_pct >= 0 ? '+' : ''}${spx.change_pct.toFixed(2)}%` : '+1.15%'}
                  </span>
                </div>
                <div className="lp-hero-chart">
                  <Sparkline data={SPLINE.spx} color="#EF5350" height={200} />
                </div>
              </div>

              {/* Major Indices */}
              <div className="lp-major-indices">
                <div className="lp-mi-title">Major indices</div>
                {MAJOR_INDICES.map((idx, i) => (
                  <Link to={`/stock/${idx.ticker}`} target="_blank" key={i} className="lp-mi-row">
                    <div className="lp-mi-left">
                      <div className="lp-mi-badge" style={{ background: idx.bg }}>
                        {typeof idx.badge === 'string' ? idx.badge : idx.badge}
                      </div>
                      <div>
                        <div className="lp-mi-name">{idx.name} <span className="lp-mi-sup">D —</span></div>
                        <div className="lp-mi-ticker">{idx.ticker}</div>
                      </div>
                    </div>
                    <div className="lp-mi-right">
                      <div className="lp-mi-price">{idx.price}<span className="lp-mi-curr"> {idx.curr}</span></div>
                      <div className={`lp-mi-chg ${idx.bull ? 'bull' : 'bear'}`}>{idx.chg}</div>
                    </div>
                  </Link>
                ))}
                <div className="lp-seemore">See all major indices <span>›</span></div>
              </div>
            </div>
          </section>

          {/* ── 3 mini market cards ─────────────────────────────────── */}
          <div className="lp-three-grid">
            {/* Crypto */}
            <div className="lp-mini-card">
              <div className="lp-mini-header">
                <div className="lp-mini-icon" style={{ background: '#1565C0' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="10"/><path d="M9 8h4a2 2 0 0 1 0 4H9zm0 4h5a2 2 0 0 1 0 4H9z" stroke="white" strokeWidth="1.5" fill="none"/><line x1="11" y1="7" x2="11" y2="17" stroke="white" strokeWidth="1.5"/><line x1="13.5" y1="7" x2="13.5" y2="17" stroke="white" strokeWidth="1.5"/></svg>
                </div>
                <span className="lp-mini-title">Crypto market cap</span>
                <span className="lp-ticker-badge">TOTAL</span>
              </div>
              <div className="lp-mini-price">2.41 T<span className="lp-currency">USD</span></div>
              <div className="lp-change bull">+4.23%</div>
              <div className="lp-sparkwrap"><Sparkline data={SPLINE.crypto} color="#26A69A" height={80} /></div>
              <div className="lp-mini-label">1 month</div>
              <div className="lp-mini-section-title" style={{ marginTop: 16 }}>Bitcoin dominance</div>
              <div className="lp-dom-row">
                <span className="lp-dom-dot" style={{ background: '#F7931A' }} />Bitcoin
                <span className="lp-dom-dot" style={{ background: '#627EEA', marginLeft: 12 }} />Ethereum
                <span className="lp-dom-dot" style={{ background: '#EF5350', marginLeft: 12 }} />Others
              </div>
              <div className="lp-dom-vals">
                <span>59.08%</span><span>10.81%</span><span>30.11%</span>
              </div>
              <div className="lp-dom-bar">
                <div style={{ flex: 59.08, background: '#F7931A' }} />
                <div style={{ flex: 10.81, background: '#627EEA' }} />
                <div style={{ flex: 30.11, background: '#EF5350' }} />
              </div>
              {[{ name: 'Bitcoin', tick: 'BTCUSD', price: '71,052', curr: 'USD', chg: '+0.24%', bull: true, c: '#F7931A' },
                { name: 'Ethereum', tick: 'ETHUSD', price: '2,156.1', curr: 'USD', chg: '+0.20%', bull: true, c: '#627EEA' }
              ].map(coin => (
                <div className="lp-coin-row" key={coin.tick}>
                  <div className="lp-mi-badge" style={{ background: coin.c, width: 28, height: 28, fontSize: 10 }}>{coin.name.slice(0, 1)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{coin.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{coin.tick}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>{coin.price}<span className="lp-currency">{coin.curr}</span></div>
                    <div className={`lp-change ${coin.bull ? 'bull' : 'bear'}`}>{coin.chg}</div>
                  </div>
                </div>
              ))}
              <div className="lp-seemore" style={{ marginTop: 12 }}>See all crypto coins <span>›</span></div>
            </div>

            {/* US Dollar Index */}
            <div className="lp-mini-card">
              <div className="lp-mini-header">
                <div className="lp-mini-icon" style={{ background: '#1B5E20' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="10"/><text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="bold">$</text></svg>
                </div>
                <span className="lp-mini-title">US Dollar index</span>
                <span className="lp-ticker-badge">DXY</span>
              </div>
              <div className="lp-mini-price">99.340<span className="lp-currency">USD</span></div>
              <div className="lp-change bull">+1.48%</div>
              <div className="lp-sparkwrap"><Sparkline data={SPLINE.dxy} color="#26A69A" height={80} /></div>
              <div className="lp-mini-label">1 month</div>
              {[{ icon: '🛢️', name: 'Crude oil', sup: 'D', tick: 'CL1!', price: '91.27', unit: 'USD/barrel', chg: '+3.56%', bull: true },
                { icon: '🔥', name: 'Natural gas', sup: 'D', tick: 'NG1!', price: '2.934', unit: 'USD/million BTUs', chg: '+1.49%', bull: true },
                { icon: '⚱️', name: 'Gold', sup: 'D', tick: 'GC1!', price: '4,411.5', unit: 'USD/troy ounce', chg: '+0.10%', bull: true },
                { icon: '🔩', name: 'Copper', sup: 'D', tick: 'HG1!', price: '5.3875', unit: 'USD/pound', chg: '-1.55%', bull: false },
              ].map(f => (
                <div className="lp-future-row" key={f.tick}>
                  <span style={{ fontSize: 20 }}>{f.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{f.name} <sup style={{ color: 'var(--text-muted)', fontSize: 9 }}>{f.sup}</sup></div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.tick}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{f.price}<span className="lp-currency" style={{ fontSize: 10 }}>{f.unit}</span></div>
                    <div className={`lp-change ${f.bull ? 'bull' : 'bear'}`}>{f.chg}</div>
                  </div>
                </div>
              ))}
              <div className="lp-seemore" style={{ marginTop: 12 }}>See all futures <span>›</span></div>
            </div>

            {/* US 10yr Yield */}
            <div className="lp-mini-card">
              <div className="lp-mini-header">
                <div className="lp-mini-icon" style={{ background: '#B71C1C' }}>🇺🇸</div>
                <span className="lp-mini-title">US 10-year yield</span>
                <span className="lp-ticker-badge">91282CJP4</span>
              </div>
              <div className="lp-mini-price">4.374%</div>
              <div className="lp-change bull">+0.38%</div>
              <div className="lp-sparkwrap"><Sparkline data={SPLINE.yield} color="#26A69A" height={80} /></div>
              <div className="lp-mini-label">1 month</div>
              <div className="lp-mini-section-title" style={{ marginTop: 16 }}>
                US annual inflation rate <span className="lp-ticker-badge">USIRYY</span>
              </div>
              <div style={{ position: 'relative', marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>3%</span><span>2%</span><span>1%</span><span>0%</span>
                </div>
                <BarChart data={SPLINE.inflation} color="#2962FF" height={70} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  <span>2025</span><span>May</span><span>Aug</span><span>2026</span>
                </div>
              </div>
              <div className="lp-mini-section-title" style={{ marginTop: 16 }}>US interest rate</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginTop: 8 }}>
                {[['Actual', '3.75%'], ['Estimated', '3.75%'], ['Last release', 'Mar 18, 2026']].map(([l, v]) => (
                  <div key={l}><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l}</div><div style={{ fontWeight: 700, fontSize: 13 }}>{v}</div></div>
                ))}
              </div>
              <div className="lp-seemore" style={{ marginTop: 16 }}>See all economic indicators <span>›</span></div>
            </div>
          </div>

          {/* ── Community Ideas ──────────────────────────────────────── */}
          <section className="lp-section">
            <h2 className="lp-section-title">Community ideas <span className="lp-chevron">›</span></h2>
            <div className="lp-idea-tabs">
              {['Editors\' picks', 'For you', 'Following', 'Popular'].map(t => (
                <button key={t} className={`lp-tab ${ideaTab === t ? 'active' : ''}`} onClick={() => setIdeaTab(t)}>{t}</button>
              ))}
            </div>
            <div className="lp-cards-grid">
              {COMMUNITY_IDEAS.map((idea, i) => (
                <div className="lp-idea-card" key={i}>
                  <div className="lp-idea-thumb">
                    <div className="lp-tv-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M5 3L3 7h4L5 3zm2 4H3v14h14V7H7z"/></svg>
                      <span>MxT</span>
                    </div>
                    <ChartThumb color={idea.color} />
                  </div>
                  <div className="lp-idea-body">
                    <div className="lp-idea-title">{idea.title}</div>
                    <div className="lp-idea-desc">{idea.desc}</div>
                    <div className="lp-idea-footer">
                      <span>by {idea.author}</span>
                      <span style={{ color: 'var(--text-dim)' }}>{idea.date}</span>
                      <span className="lp-idea-stat">💬 {idea.comments}</span>
                      <span className="lp-idea-stat">🚀 {idea.boosts}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Indicators & Strategies ─────────────────────────────── */}
          <section className="lp-section">
            <h2 className="lp-section-title">Indicators and strategies <span className="lp-chevron">›</span></h2>
            <div className="lp-idea-tabs">
              {['Editors\' picks', 'Following', 'Popular'].map(t => (
                <button key={t} className={`lp-tab ${indicatorTab === t ? 'active' : ''}`} onClick={() => setIndicatorTab(t)}>{t}</button>
              ))}
            </div>
            <div className="lp-cards-grid">
              {INDICATOR_IDEAS.map((idea, i) => (
                <div className="lp-idea-card" key={i}>
                  <div className="lp-idea-thumb" style={{ background: '#0d1118' }}>
                    <div className="lp-tv-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M5 3L3 7h4L5 3zm2 4H3v14h14V7H7z"/></svg>
                      <span>MxT</span>
                    </div>
                    <div className="lp-ind-thumb-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#787B86' }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    </div>
                  </div>
                  <div className="lp-idea-body">
                    <div className="lp-idea-title" style={{ color: idea.color === '#2962FF' ? '#2962FF' : idea.title }}>{idea.title}</div>
                    <div className="lp-idea-desc">{idea.desc}</div>
                    <div className="lp-idea-footer">
                      <span>by {idea.author}</span>
                      <span style={{ color: 'var(--text-dim)' }}>{idea.date}</span>
                      <span className="lp-idea-stat">💬 {idea.comments}</span>
                      <span className="lp-idea-stat">🚀 {idea.boosts}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Top Stories ─────────────────────────────────────────── */}
          <section className="lp-section">
            <h2 className="lp-section-title">Top stories <span className="lp-chevron">›</span></h2>
            <div className="lp-news-grid">
              {[0, 1, 2].map(col => (
                <div key={col} className="lp-news-col">
                  {TOP_STORIES.filter((_, i) => i % 3 === col).map((story, i) => (
                    <div key={i} className={`lp-news-row ${story.highlight ? 'lp-news-highlight' : ''}`}>
                      <div className="lp-news-header">
                        <div className="lp-news-ticker" style={{ background: story.c }}>{story.ticker.slice(0, 2)}</div>
                        <span className="lp-news-meta">{story.ago} · {story.src}</span>
                      </div>
                      <div className="lp-news-headline">{story.headline}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="lp-seemore" style={{ marginTop: 12, marginBottom: 4 }}>Keep reading <span>›</span></div>

            {/* Bottom tab bar */}
            <div className="lp-news-tabs">
              {['Market summary', 'US stocks', 'Crypto', 'Futures', 'Forex', 'Economy', 'Brokers'].map(t => (
                <button key={t} className={`lp-news-tab ${newsTab === t ? 'active' : ''}`} onClick={() => setNewsTab(t)}>{t}</button>
              ))}
            </div>
          </section>

        </div>

        {/* ── Right floating icon rail ─────────────────────────────── */}
        <div className="lp-rail">
          {[
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
          ].map((icon, i) => (
            <div key={i} className="lp-rail-btn">{icon}</div>
          ))}
          <div style={{ flex: 1 }} />
          <div className="lp-rail-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
        </div>
      </div>
    </div>
  );
}
