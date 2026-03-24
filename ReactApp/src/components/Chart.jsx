import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';

export default function Chart({ activeStock, indicators, interval, timeframe, onDataUpdate }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);

  // Map timeframes to yfinance period/interval params
  const TF_MAP = {
    '1D': { period: '1d', interval: '5m' },
    '5D': { period: '5d', interval: '15m' },
    '1M': { period: '1mo', interval: '1d' },
    '3M': { period: '3mo', interval: '1d' },
    '6M': { period: '6mo', interval: '1d' },
    'YTD': { period: 'ytd', interval: '1d' },
    '1Y': { period: '1y', interval: '1d' },
    '5Y': { period: '5y', interval: '1wk' },
    'All': { period: 'max', interval: '1mo' },
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: { background: { color: '#1E222D' }, textColor: '#787B86' },
      grid: { vertLines: { color: '#2B3139' }, horzLines: { color: '#2B3139' } },
      crosshair: {
        mode: 0,
        vertLine: { color: '#758696', style: 1, labelBackgroundColor: '#363A45' },
        horzLine: { color: '#758696', style: 1, labelBackgroundColor: '#363A45' },
      },
      rightPriceScale: { borderColor: '#2B3139' },
      timeScale: { borderColor: '#2B3139', timeVisible: true, rightOffset: 12 },
    });

    const candle = chart.addCandlestickSeries({
      upColor: '#26A69A', downColor: '#EF5350',
      borderUpColor: '#26A69A', borderDownColor: '#EF5350',
      wickUpColor: '#26A69A', wickDownColor: '#EF5350',
    });

    const sma = chart.addLineSeries({
      color: '#EFB90B', lineWidth: 1.5,
      crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false,
    });

    const ema = chart.addLineSeries({
      color: '#FF6D00', lineWidth: 1.5,
      crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false,
    });

    const bbUp = chart.addLineSeries({
      color: 'rgba(38, 166, 154, 0.4)', lineWidth: 1, lineStyle: 2,
      crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false,
    });

    const bbLow = chart.addLineSeries({
      color: 'rgba(38, 166, 154, 0.4)', lineWidth: 1, lineStyle: 2,
      crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false,
    });

    seriesRef.current = { candle, sma, ema, bbUp, bbLow };
    chartRef.current = chart;

    const obs = new ResizeObserver(entries => {
      if (!entries[0]) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    obs.observe(containerRef.current);

    return () => { obs.disconnect(); chart.remove(); };
  }, []);

  useEffect(() => {
    let alive = true;
    const tf = TF_MAP[timeframe] || TF_MAP['3M'];
    const fetchData = async (bg = false) => {
      if (!bg) setLoading(true);
      try {
        const url = `import.meta.env.VITE_API_URL/api/stock_data?stock=${activeStock}&period=${tf.period}&interval=${tf.interval}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (!alive) return;

        seriesRef.current.candle?.setData(data.chart_data);

        const smaD = [], emaD = [], bbUpD = [], bbLowD = [];
        data.chart_data.forEach(d => {
          if (d.sma != null) smaD.push({ time: d.time, value: d.sma });
          if (d.ema != null) emaD.push({ time: d.time, value: d.ema });
          if (d.bb_up != null) bbUpD.push({ time: d.time, value: d.bb_up });
          if (d.bb_low != null) bbLowD.push({ time: d.time, value: d.bb_low });
        });
        seriesRef.current.sma?.setData(smaD);
        seriesRef.current.ema?.setData(emaD);
        seriesRef.current.bbUp?.setData(bbUpD);
        seriesRef.current.bbLow?.setData(bbLowD);

        if (!bg) chartRef.current?.timeScale().fitContent();

        const lastBar = data.chart_data[data.chart_data.length - 1];
        const prevBar = data.chart_data[data.chart_data.length - 2];
        const info = {
          price: data.current_price,
          prediction: data.predicted_price,
          change_pct: data.change_pct,
          sentiment: data.sentiment,
          rsi: data.rsi,
          high: data.high,
          low: data.low,
          volume_today: data.volume_today,
          open: lastBar?.open,
        };
        setStockInfo(info);
        if (onDataUpdate) onDataUpdate(info);
        setError(null);
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchData(false);
    const id = setInterval(() => fetchData(true), 60000);
    return () => { alive = false; clearInterval(id); };
  }, [activeStock, timeframe]);

  useEffect(() => {
    if (!seriesRef.current.sma) return;
    seriesRef.current.sma.applyOptions({ visible: indicators?.sma ?? true });
    seriesRef.current.ema.applyOptions({ visible: indicators?.ema ?? false });
    seriesRef.current.bbUp.applyOptions({ visible: indicators?.bb ?? false });
    seriesRef.current.bbLow.applyOptions({ visible: indicators?.bb ?? false });
  }, [indicators]);

  const isBull = stockInfo && stockInfo.change_pct >= 0;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#1E222D' }}>
      {/* OHLCV overlay */}
      <div className="tv-chart-overlay">
        <div className="tco-sym">{activeStock} · 1D · NASDAQ</div>
        {stockInfo && (
          <div className="tco-ohlcv">
            <span>O <span>{stockInfo.open?.toFixed(2) ?? '—'}</span></span>
            <span>H <span>{stockInfo.high?.toFixed(2) ?? '—'}</span></span>
            <span>L <span>{stockInfo.low?.toFixed(2) ?? '—'}</span></span>
            <span>C <span>{stockInfo.price?.toFixed(2) ?? '—'}</span></span>
            <span className={`tco-change ${isBull ? '' : 'down'}`}>
              {isBull ? '+' : ''}{stockInfo.change_pct?.toFixed(2) ?? '0.00'} ({isBull ? '+' : ''}{stockInfo.change_pct?.toFixed(2) ?? '0.00'}%)
            </span>
          </div>
        )}

        {/* AI badges — TradingView-style price labels */}
        {stockInfo && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <div style={{
              background: '#EF5350', color: 'white', padding: '3px 8px',
              borderRadius: 3, fontSize: 12, fontWeight: 700,
            }}>
              SELL {stockInfo.price?.toFixed(2)}
            </div>
            <div style={{
              background: '#26A69A', color: 'white', padding: '3px 8px',
              borderRadius: 3, fontSize: 12, fontWeight: 700,
            }}>
              AI {stockInfo.prediction?.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {loading && !stockInfo && (
        <div className="tv-loader">
          <div className="tv-spinner" />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: 1 }}>LOADING {activeStock}</span>
        </div>
      )}
      {error && !loading && (
        <div className="tv-loader">
          <svg width="24" height="24" fill="none" stroke="#EF5350" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={{ fontSize: 12, color: '#EF5350' }}>{error}</span>
        </div>
      )}

      <div ref={containerRef} className="tv-chart-container" />
    </div>
  );
}
