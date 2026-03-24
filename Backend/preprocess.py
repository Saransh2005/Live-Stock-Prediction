import pandas as pd

df = pd.read_csv("stock_data.csv")

# Fix first column as Date
df.rename(columns={df.columns[0]: "Date"}, inplace=True)

# Fix multi-level columns
if isinstance(df.columns, pd.MultiIndex):
    df.columns = df.columns.get_level_values(0)

# Keep required columns
df = df[['Date', 'Close']]

df.dropna(inplace=True)

# Lag feature
df['Prev_Close'] = df['Close'].shift(1)

df.dropna(inplace=True)

df.to_csv("processed_data.csv", index=False)

print("Preprocessing done!")