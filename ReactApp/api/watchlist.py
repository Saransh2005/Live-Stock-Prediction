from http.server import BaseHTTPRequestHandler
import json
import yfinance as yf
import pandas as pd
import numpy as np
from urllib.parse import urlparse, parse_qs


def calc_rsi(closes, period=14):
    delta = closes.diff()
    gain = delta.where(delta > 0, 0).rolling(period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)
        stocks_param = params.get('stocks', [''])[0]
        symbols = [s.strip() for s in stocks_param.split(',') if s.strip()]

        results = []
        for sym in symbols:
            try:
                df = yf.download(sym, period='5d', interval='1d', auto_adjust=True, progress=False)
                if df.empty:
                    continue

                if isinstance(df.columns, pd.MultiIndex):
                    df.columns = [col[0] for col in df.columns]

                df = df.dropna()
                closes = df['Close']
                current_price = float(closes.iloc[-1])
                prev_close = float(closes.iloc[-2]) if len(closes) > 1 else current_price
                change_pct = ((current_price - prev_close) / prev_close) * 100

                rsi_s = calc_rsi(closes)
                rsi_val = float(rsi_s.iloc[-1]) if len(rsi_s) > 0 and not pd.isna(rsi_s.iloc[-1]) else 50.0

                if rsi_val < 30:
                    predicted = current_price * 1.03
                    signal = "bullish"
                elif rsi_val > 70:
                    predicted = current_price * 0.97
                    signal = "bearish"
                else:
                    slope = (float(closes.iloc[-1]) - float(closes.iloc[0])) / max(len(closes) - 1, 1)
                    predicted = current_price + slope * 3
                    signal = "bullish" if slope >= 0 else "bearish"

                results.append({
                    "stock": sym,
                    "price": round(current_price, 4),
                    "change_pct": round(change_pct, 4),
                    "prediction": round(predicted, 4),
                    "signal": signal,
                })
            except Exception:
                pass

        self._json(results)

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
