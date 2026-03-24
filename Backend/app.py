from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import yfinance as yf
import numpy as np
import os

app = Flask(__name__)
CORS(app)

# Load model
model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
model = pickle.load(open(model_path, "rb"))

# ------------------ PREDICTION API ------------------
@app.route("/predict", methods=["GET"])
def predict():
    stock = request.args.get("stock")

    if not stock:
        return jsonify({"error": "Stock symbol required"}), 400

    try:
        # 🔥 Fast fetch (1 minute data)
        data = yf.download(stock, period="1d", interval="1m")

        if data.empty:
            return jsonify({"error": "No data found"}), 404

        latest_close = float(data['Close'].dropna().iloc[-1])

        prediction = model.predict([[latest_close]])

        return jsonify({
            "stock": stock.upper(),
            "current_price": latest_close,
            "predicted_price": float(prediction[0])
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ------------------ CHART + AI API ------------------
@app.route("/api/stock_data", methods=["GET"])
def get_stock_data():
    stock = request.args.get("stock")

    if not stock:
        return jsonify({"error": "No stock provided"}), 400

    try:
        # 🔥 1-minute intraday (FASTEST realistic)
        data = yf.download(stock, period="1d", interval="1m")

        if data.empty:
            return jsonify({"error": f"No data found for {stock}. Market may be closed."}), 404

        data = data.dropna()

        # Calculate Indicators (SMA & EMA)
        data['SMA_20'] = data['Close'].rolling(window=20, min_periods=1).mean()
        data['EMA_20'] = data['Close'].ewm(span=20, adjust=False).mean()

        # 📈 Format for chart (LightweightCharts needs UNIX timestamp for Intraday)
        chart_data = []
        for index, row in data.iterrows():
            try:
                # Safely extract floats (yfinance sometimes returns Series for single tickers)
                o = float(row['Open'].iloc[0] if hasattr(row['Open'], 'iloc') else row['Open'])
                h = float(row['High'].iloc[0] if hasattr(row['High'], 'iloc') else row['High'])
                l = float(row['Low'].iloc[0] if hasattr(row['Low'], 'iloc') else row['Low'])
                c = float(row['Close'].iloc[0] if hasattr(row['Close'], 'iloc') else row['Close'])
                sma = float(row['SMA_20'].iloc[0] if hasattr(row['SMA_20'], 'iloc') else row['SMA_20'])
                ema = float(row['EMA_20'].iloc[0] if hasattr(row['EMA_20'], 'iloc') else row['EMA_20'])
                
                chart_data.append({
                    "time": int(index.timestamp()),
                    "open": o,
                    "high": h,
                    "low": l,
                    "close": c,
                    "sma": sma,
                    "ema": ema
                })
            except Exception as e:
                pass # Skip bad rows

        if not chart_data:
            return jsonify({"error": "Failed to parse intraday data"}), 500

        latest_close = chart_data[-1]["close"]

        # 🤖 Prediction
        prediction = model.predict([[latest_close]])

        return jsonify({
            "stock": stock.upper(),
            "current_price": latest_close,
            "predicted_price": float(prediction[0]),
            "chart_data": chart_data
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ------------------ WATCHLIST API ------------------
@app.route("/api/watchlist", methods=["GET"])
def get_watchlist():
    stocks_param = request.args.get("stocks", "AAPL,TSLA,MSFT,NVDA,BTC-USD")
    stock_list = [s.strip().upper() for s in stocks_param.split(",") if s.strip()]
    results = []
    
    for stock in stock_list:
        try:
            data = yf.download(stock, period="5d", interval="1d")
            data = data.dropna()
            if data.empty:
                continue
                
            latest_close = float(data['Close'].iloc[-1] if hasattr(data['Close'], 'iloc') else data['Close'])
            prev_close = float(data['Close'].iloc[-2] if hasattr(data['Close'], 'iloc') else data['Close']) if len(data) > 1 else latest_close
            
            prediction = model.predict([[latest_close]])
            pred_price = float(prediction[0])
            diff = pred_price - latest_close
            
            results.append({
                "stock": stock,
                "price": latest_close,
                "change_pct": ((latest_close - prev_close) / prev_close) * 100 if prev_close else 0,
                "prediction": pred_price,
                "signal": "bullish" if diff >= 0 else "bearish"
            })
        except Exception:
            pass

    return jsonify(results)

# ------------------ HOME ------------------
@app.route("/")
def home():
    return "Stock Prediction API is running 🚀"


# ------------------ RUN ------------------
if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)