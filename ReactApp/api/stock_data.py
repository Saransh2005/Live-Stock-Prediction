from http.server import BaseHTTPRequestHandler
import json
import yfinance as yf
import pandas as pd
import numpy as np
from urllib.parse import urlparse, parse_qs
import time

CACHE = {}
CACHE_TTL = 60


def calc_rsi(closes, period=14):
    delta = closes.diff()
    gain = delta.where(delta > 0, 0).rolling(period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)
        stock = params.get('stock', [None])[0]
        period = params.get('period', ['3mo'])[0]
        interval = params.get('interval', ['1d'])[0]

        if not stock:
            return self._json({"error": "No stock provided"}, 400)

        cache_key = f"{stock}_{period}_{interval}"
        now = time.time()
        if cache_key in CACHE and (now - CACHE[cache_key]['ts']) < CACHE_TTL:
            return self._json(CACHE[cache_key]['data'])

        try:
            df = yf.download(stock, period=period, interval=interval, auto_adjust=True, progress=False)
            if df.empty:
                return self._json({"error": f"No data for {stock}"}, 404)

            # Flatten MultiIndex columns (yfinance quirk)
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = [col[0] for col in df.columns]

            df = df.dropna()
            closes = df['Close']

            sma = closes.rolling(20).mean()
            ema = closes.ewm(span=20, adjust=False).mean()
            bb_mid = closes.rolling(20).mean()
            bb_std = closes.rolling(20).std()
            bb_up = bb_mid + 2 * bb_std
            bb_low = bb_mid - 2 * bb_std
            rsi_s = calc_rsi(closes)

            rsi_val = float(rsi_s.iloc[-1]) if not pd.isna(rsi_s.iloc[-1]) else 50.0
            current_price = float(closes.iloc[-1])
            prev_close = float(closes.iloc[-2]) if len(closes) > 1 else current_price
            change_pct = ((current_price - prev_close) / prev_close) * 100

            # RSI-based AI prediction
            if rsi_val < 30:
                predicted_price = current_price * 1.03
                signal = "bullish"
            elif rsi_val > 70:
                predicted_price = current_price * 0.97
                signal = "bearish"
            else:
                slope = (float(closes.iloc[-1]) - float(closes.iloc[-5])) / 5
                predicted_price = current_price + slope * 3
                signal = "bullish" if slope >= 0 else "bearish"

            chart_data = []
            for ts, row in df.iterrows():
                t = int(pd.Timestamp(ts).timestamp())
                def safe(s, ts):
                    v = s.get(ts) if hasattr(s, 'get') else (s[ts] if ts in s.index else None)
                    return round(float(v), 4) if v is not None and not (isinstance(v, float) and np.isnan(v)) else None

                chart_data.append({
                    "time": t,
                    "open":  round(float(row['Open']), 4),
                    "high":  round(float(row['High']), 4),
                    "low":   round(float(row['Low']), 4),
                    "close": round(float(row['Close']), 4),
                    "sma":   safe(sma, ts),
                    "ema":   safe(ema, ts),
                    "bb_up": safe(bb_up, ts),
                    "bb_low": safe(bb_low, ts),
                })

            data_payload = {
                "chart_data": chart_data,
                "current_price": round(current_price, 4),
                "predicted_price": round(predicted_price, 4),
                "change_pct": round(change_pct, 4),
                "signal": signal,
                "sentiment": signal,
                "rsi": round(rsi_val, 2),
                "high": round(float(df['High'].iloc[-1]), 4),
                "low": round(float(df['Low'].iloc[-1]), 4),
                "volume_today": int(df['Volume'].iloc[-1]) if 'Volume' in df.columns else 0,
            }
            CACHE[cache_key] = {'ts': now, 'data': data_payload}
            self._json(data_payload)

        except Exception as e:
            self._json({"error": str(e)}, 500)

    def _json(self, data, status=200):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass
