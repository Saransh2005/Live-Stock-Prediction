import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';

export default function Chart({ activeStock, indicators }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef({ candle: null, sma: null, ema: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stockInfo, setStockInfo] = useState(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    let chart;
    try {
      chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: 'solid', color: '#0B0E14' },
          textColor: '#D1D4DC',
        },
        grid: {
          vertLines: { color: '#2B3139' },
          horzLines: { color: '#2B3139' },
        },
        crosshair: {
          mode: 0,
        },
        rightPriceScale: {
          borderColor: '#2B3139',
        },
        timeScale: {
          borderColor: '#2B3139',
          timeVisible: true,
        },
      });

      chartRef.current = chart;

      const candleSeries = chart.addCandlestickSeries({
        upColor: '#089981',
        downColor: '#F23645',
        borderDownColor: '#F23645',
        borderUpColor: '#089981',
        wickDownColor: '#F23645',
        wickUpColor: '#089981',
      });

      const smaSeries = chart.addLineSeries({
        color: '#FFD700',
        lineWidth: 2,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      });

      const emaSeries = chart.addLineSeries({
        color: '#2962FF',
        lineWidth: 2,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      });

      seriesRef.current = { candle: candleSeries, sma: smaSeries, ema: emaSeries };

      const resizeObserver = new ResizeObserver(entries => {
        if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
        const newRect = entries[0].contentRect;
        chart.applyOptions({ height: newRect.height, width: newRect.width });
      });
      
      resizeObserver.observe(chartContainerRef.current);
      
      return () => {
        resizeObserver.disconnect();
        chart.remove();
      };
    } catch (err) {
      console.error("Init Error:", err);
      setError(err.message);
    }
  }, []);

  // Fetch data
  useEffect(() => {
    let isMounted = true;
    let interval;

    const fetchData = async (isBackground = false) => {
      if (isMounted && !isBackground) setLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:5001/api/stock_data?stock=${activeStock}`);
        if (!res.ok) throw new Error(`Backend server error (${res.status})`);
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);

        if (!isMounted) return;

        if (seriesRef.current.candle) {
          seriesRef.current.candle.setData(data.chart_data);
        }
        
        const smaData = [];
        const emaData = [];
        
        data.chart_data.forEach(d => {
            if (!isNaN(d.sma) && d.sma !== null) smaData.push({ time: d.time, value: d.sma });
            if (!isNaN(d.ema) && d.ema !== null) emaData.push({ time: d.time, value: d.ema });
        });
        
        if (seriesRef.current.sma) seriesRef.current.sma.setData(smaData);
        if (seriesRef.current.ema) seriesRef.current.ema.setData(emaData);

        if (!isBackground && chartRef.current) {
           chartRef.current.timeScale().fitContent();
        }

        setStockInfo({
          price: data.current_price,
          prediction: data.predicted_price
        });
        setError(null);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData(false);
    interval = setInterval(() => fetchData(true), 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeStock]);

  // Toggle indicators
  useEffect(() => {
    if (seriesRef.current.sma) {
      seriesRef.current.sma.applyOptions({ visible: indicators.sma });
    }
    if (seriesRef.current.ema) {
      seriesRef.current.ema.applyOptions({ visible: indicators.ema });
    }
  }, [indicators]);

  return (
    <>
      <div className="chart-info-overlay">
        <h1 className="chart-title">{activeStock}</h1>
        {stockInfo && (
          <>
            <div className="chart-price">${stockInfo.price.toFixed(2)}</div>
            <div className="ai-prediction-badge">
               🤖 AI Prediction: <span className={stockInfo.prediction >= stockInfo.price ? 'bullish' : 'bearish'} style={{ marginLeft: 4 }}>
                 ${stockInfo.prediction.toFixed(2)}
               </span>
               <span className="badge-pro">PRO</span>
            </div>
          </>
        )}
      </div>

      {loading && !stockInfo && (
        <div className="fullscreen-loader">
          ANALYZING {activeStock}...
        </div>
      )}
      
      {error && (
        <div className="fullscreen-loader" style={{color: 'var(--accent-bear)'}}>
          Error: {error}
        </div>
      )}

      {/* Identical sizing logic as HTML index.html */}
      <div 
        ref={chartContainerRef} 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }} 
      />
    </>
  );
}
