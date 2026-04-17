"""
train_model.py
==============
Trains a Random Forest Regressor on the synthetic EventSphere venue dataset.

Saves:
  venue_model.pkl       — trained RandomForestRegressor
  label_encoders.pkl    — dict of LabelEncoders for categorical features

Usage:
  python train_model.py

The trained model is then served by app.py (Flask).
At inference time, Spring Boot sends one request with the event context
(category, event_type, month, day_of_week, duration) + the full venue list.
The model scores every venue and returns them ranked by suitability_score desc.
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_squared_error, r2_score

# ── Load data ──────────────────────────────────────────────────────────────────
df = pd.read_csv("training_data.csv")
print(f"Loaded {len(df)} rows.")

# ── Encode categoricals ────────────────────────────────────────────────────────
# We encode: category, event_type, venue_id, venue_availability
# Numeric passthrough: event_month, day_of_week, duration_hours, venue_capacity

label_encoders = {}

for col in ["category", "event_type", "venue_id", "venue_availability"]:
    le = LabelEncoder()
    df[col + "_enc"] = le.fit_transform(df[col])
    label_encoders[col] = le
    print(f"  {col}: {list(le.classes_)}")

# ── Feature matrix ─────────────────────────────────────────────────────────────
FEATURE_COLS = [
    "category_enc",
    "event_type_enc",
    "event_month",
    "day_of_week",
    "duration_hours",
    "venue_id_enc",
    "venue_capacity",
    "venue_availability_enc",
]

X = df[FEATURE_COLS].values
y = df["suitability_score"].values

print(f"\nFeature matrix shape: {X.shape}")

# ── Train / test split ─────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.15, random_state=42
)

# ── Train Random Forest ────────────────────────────────────────────────────────
# n_estimators=200: enough trees for stable predictions with 1600 rows
# max_depth=12: prevents overfitting on noisy synthetic data
# min_samples_leaf=4: smooths predictions at leaves
rf = RandomForestRegressor(
    n_estimators=200,
    max_depth=12,
    min_samples_leaf=4,
    max_features="sqrt",
    random_state=42,
    n_jobs=-1,
)
rf.fit(X_train, y_train)

# ── Evaluation ─────────────────────────────────────────────────────────────────
y_pred = rf.predict(X_test)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2   = r2_score(y_test, y_pred)

# 5-fold cross-val on full dataset
cv_scores = cross_val_score(rf, X, y, cv=5, scoring="r2", n_jobs=-1)

print(f"\n── Model Evaluation ──────────────────────────────────────────")
print(f"  Test RMSE :  {rmse:.4f}  (lower is better; expect ~0.04–0.06 on synthetic data)")
print(f"  Test R²   :  {r2:.4f}  (higher is better; 1.0 = perfect)")
print(f"  CV R² (5-fold): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# ── Feature importances ────────────────────────────────────────────────────────
importances = pd.Series(rf.feature_importances_, index=FEATURE_COLS).sort_values(ascending=False)
print(f"\n── Feature Importances ───────────────────────────────────────")
for feat, imp in importances.items():
    bar = "█" * int(imp * 40)
    print(f"  {feat:<28} {imp:.4f}  {bar}")

# ── Smoke test — Cultural + Paid + October ─────────────────────────────────────
print(f"\n── Smoke Test: Cultural, Paid, Oct, Saturday, 8h ─────────────")
VENUES_REF = [
    ("V-0001", 5000,  "Y"),
    ("V-0002", 10000, "Y"),
    ("V-0003", 2000,  "Y"),
    ("V-0004", 500,   "Y"),
    ("V-0005", 800,   "Y"),
    ("V-0006", 12000, "Y"),
    ("V-0007", 300,   "Y"),
    ("V-0008", 1000,  "Y"),
    ("V-0009", 3000,  "Y"),
    ("V-0010", 800,   "Y"),
]

cat_enc   = label_encoders["category"].transform(["Cultural"])[0]
etype_enc = label_encoders["event_type"].transform(["Paid"])[0]

results = []
for vid, cap, avail in VENUES_REF:
    vid_enc   = label_encoders["venue_id"].transform([vid])[0]
    avail_enc = label_encoders["venue_availability"].transform([avail])[0]
    feat = np.array([[cat_enc, etype_enc, 10, 5, 8, vid_enc, cap, avail_enc]])
    score = rf.predict(feat)[0]
    results.append((vid, score))

results.sort(key=lambda x: x[1], reverse=True)
for rank, (vid, score) in enumerate(results, 1):
    name = next(r[0] for r in VENUES_REF if r[0] == vid)
    print(f"  #{rank}  {vid}  score={score:.4f}")

# ── Save artifacts ─────────────────────────────────────────────────────────────
joblib.dump(rf, "venue_model.pkl")
joblib.dump(label_encoders, "label_encoders.pkl")
print(f"\n✅  venue_model.pkl saved.")
print(f"✅  label_encoders.pkl saved.")
print(f"\nFeature order for inference: {FEATURE_COLS}")
