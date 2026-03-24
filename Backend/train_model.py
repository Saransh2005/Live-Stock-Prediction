import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
import matplotlib.pyplot as plt
from sklearn.metrics import mean_absolute_error
import pickle

# Load data
df = pd.read_csv("../Data/processed_data.csv")

# 🔥 IMPORTANT: Ensure numeric
df['Prev_Return'] = pd.to_numeric(df['Prev_Return'], errors='coerce')
df['Return'] = pd.to_numeric(df['Return'], errors='coerce')

# Remove any bad rows
df.dropna(inplace=True)

# Features and target
X = df[['Prev_Return']]
y = df['Return']

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, shuffle=False
)

# Train model
model = LinearRegression()
model.fit(X_train, y_train)

# Predict
predictions = model.predict(X_test)

# Evaluate
mae = mean_absolute_error(y_test, predictions)
print("MAE:", mae)

# Plot
plt.figure(figsize=(10,5))
plt.plot(y_test.values, label="Actual Return")
plt.plot(predictions, label="Predicted Return")
plt.legend()
plt.title("Stock Return Prediction")
plt.savefig("prediction_plot.png")

print("Model trained successfully!")

pickle.dump(model, open("model.pkl", "wb"))
print("Model saved!")