import pandas as pd

df = pd.read_csv("../Data/stock_data.csv")

# Fix first column as Date
df.rename(columns={df.columns[0]: "Date"}, inplace=True)

# Fix multi-level columns
if isinstance(df.columns, pd.MultiIndex):
    df.columns = df.columns.get_level_values(0)

# Keep required columns
df = df[['Date', 'Close']]

df.dropna(inplace=True)

# Coerce to numeric just in case there are mixed types from headers like 'AAPL'
df['Close'] = pd.to_numeric(df['Close'], errors='coerce')
df.dropna(inplace=True)

# Calculate percentage return
df['Return'] = df['Close'].pct_change()

# Lag feature: previous return predicts current return
df['Prev_Return'] = df['Return'].shift(1)

df.dropna(inplace=True)

df.to_csv("../Data/processed_data.csv", index=False)

print("Preprocessing done!")