from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import yfinance as yf
import numpy as np
import os
import pandas as pd

app = Flask(__name__)
CORS(app)

# Load model
model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
model = pickle.load(open(model_path, "rb"))

@app.route("/predict", methods=["GET"])
def predict():
    stock = request.args.get("stock")
    if not stock: return jsonify({"error": "Stock symbol required"}), 400
    try:
        data = yf.download(stock, period="1mo", interval="1d")
        if data.empty: return jsonify({"error": "Not enough data found"}), 404
        
        close_series = data['Close'].iloc[:, 0] if hasattr(data['Close'], 'columns') else data['Close']
        closes = close_series.dropna()
        latest_close = float(closes.iloc[-1])
        prev_close = float(closes.iloc[-2])
        latest_return = (latest_close - prev_close) / prev_close if prev_close != 0 else 0

        predicted_return = model.predict([[latest_return]])[0]
        predicted_price = latest_close * (1 + predicted_return)

        return jsonify({
            "stock": stock.upper(),
            "current_price": latest_close,
            "predicted_price": float(predicted_price)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/stock_data", methods=["GET"])
def get_stock_data():
    stock = request.args.get("stock")
    if not stock: return jsonify({"error": "No stock provided"}), 400

    # Accept period & interval from timeframe selector; fallback to sane defaults
    period   = request.args.get("period",   "3mo")
    interval = request.args.get("interval", "1d")

    try:
        data = yf.download(stock, period=period, interval=interval)
        if data.empty: return jsonify({"error": f"No data found for {stock}. Market may be closed."}), 404
        
        data = data.dropna()
        close_series = data['Close'].iloc[:, 0] if hasattr(data['Close'], 'columns') else data['Close']
        open_series = data['Open'].iloc[:, 0] if hasattr(data['Open'], 'columns') else data['Open']
        high_series = data['High'].iloc[:, 0] if hasattr(data['High'], 'columns') else data['High']
        low_series = data['Low'].iloc[:, 0] if hasattr(data['Low'], 'columns') else data['Low']
        vol_series = data['Volume'].iloc[:, 0] if hasattr(data['Volume'], 'columns') else data['Volume']

        df = pd.DataFrame()
        df['Close'] = close_series
        df['Open'] = open_series
        df['High'] = high_series
        df['Low'] = low_series
        df['Volume'] = vol_series

        df['SMA_20'] = df['Close'].rolling(window=20, min_periods=1).mean()
        df['EMA_20'] = df['Close'].ewm(span=20, adjust=False).mean()
        
        df['STD_20'] = df['Close'].rolling(window=20, min_periods=1).std()
        df['BB_UP'] = df['SMA_20'] + (df['STD_20'] * 2)
        df['BB_LOW'] = df['SMA_20'] - (df['STD_20'] * 2)
        
        df['EMA_12'] = df['Close'].ewm(span=12, adjust=False).mean()
        df['EMA_26'] = df['Close'].ewm(span=26, adjust=False).mean()
        df['MACD'] = df['EMA_12'] - df['EMA_26']
        df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
        df['MACD_Hist'] = df['MACD'] - df['MACD_Signal']
        
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14, min_periods=1).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14, min_periods=1).mean()
        rs = gain / loss
        df['RSI_14'] = 100 - (100 / (1 + rs))

        chart_data = []
        for index, row in df.iterrows():
            try:
                chart_data.append({
                    "time": int(index.timestamp()),
                    "open": float(row['Open']),
                    "high": float(row['High']),
                    "low": float(row['Low']),
                    "close": float(row['Close']),
                    "volume": float(row['Volume']),
                    "sma": float(row['SMA_20']),
                    "ema": float(row['EMA_20']),
                    "bb_up": float(row['BB_UP']) if not pd.isna(row['BB_UP']) else None,
                    "bb_low": float(row['BB_LOW']) if not pd.isna(row['BB_LOW']) else None,
                    "macd": float(row['MACD']) if not pd.isna(row['MACD']) else 0,
                    "macd_hist": float(row['MACD_Hist']) if not pd.isna(row['MACD_Hist']) else 0,
                    "rsi": float(row['RSI_14']) if not pd.isna(row['RSI_14']) else 50
                })
            except Exception as e:
                pass

        if not chart_data:
            return jsonify({"error": "Failed to parse data"}), 500

        latest_close = chart_data[-1]["close"]
        prev_close = chart_data[-2]["close"] if len(chart_data) > 1 else latest_close
        latest_return = (latest_close - prev_close) / prev_close if prev_close != 0 else 0

        predicted_return = model.predict([[latest_return]])[0]
        predicted_price = latest_close * (1 + predicted_return)
        
        rsi = chart_data[-1]["rsi"]
        sentiment = "Neutral"
        if rsi < 30: sentiment = "Bullish (Oversold)"
        elif rsi > 70: sentiment = "Bearish (Overbought)"
        elif predicted_return > 0: sentiment = "Bullish"
        else: sentiment = "Bearish"

        return jsonify({
            "stock": stock.upper(),
            "current_price": latest_close,
            "change_pct": ((latest_close - prev_close) / prev_close) * 100 if prev_close else 0,
            "high": float(df['High'].max()),
            "low": float(df['Low'].min()),
            "volume_today": float(df['Volume'].iloc[-1]),
            "predicted_price": float(predicted_price),
            "sentiment": sentiment,
            "rsi": rsi,
            "macd": chart_data[-1]["macd"],
            "chart_data": chart_data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/watchlist", methods=["GET"])
def get_watchlist():
    stocks_param = request.args.get("stocks", "AAPL,TSLA,MSFT,NVDA,RELIANCE.NS,TCS.NS,^NSEI")
    stock_list = [s.strip().upper() for s in stocks_param.split(",") if s.strip()]
    results = []
    
    for stock in stock_list:
        try:
            data = yf.download(stock, period="5d", interval="1d")
            data = data.dropna()
            if data.empty: continue
                
            close_series = data['Close'].iloc[:, 0] if hasattr(data['Close'], 'columns') else data['Close']
            latest_close = float(close_series.iloc[-1])
            prev_close = float(close_series.iloc[-2]) if len(close_series) > 1 else latest_close
            latest_return = (latest_close - prev_close) / prev_close if prev_close != 0 else 0
            
            predicted_return = model.predict([[latest_return]])[0]
            pred_price = float(latest_close * (1 + predicted_return))
            diff = pred_price - latest_close
            
            results.append({
                "stock": stock,
                "price": latest_close,
                "change_pct": ((latest_close - prev_close) / prev_close) * 100 if prev_close else 0,
                "prediction": pred_price,
                "signal": "bullish" if diff >= 0 else "bearish"
            })
        except Exception as e:
            pass

    return jsonify(results)

@app.route("/")
def home():
    return "Stock Prediction API is running 🚀"

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)