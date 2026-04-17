"""
app.py — EventSphere Venue Suggestion Flask Microservice
=========================================================
Exposes a single endpoint:

  POST /predict
  Content-Type: application/json

  Request body (sent by Spring Boot VenueSuggestionService):
  {
    "category":       "Cultural",          // Cultural|Technical|Sports|Ceremony|Food
    "event_type":     "Paid",              // Free|Paid
    "event_month":    10,                  // 1–12
    "day_of_week":    5,                   // 0=Mon … 6=Sun
    "duration_hours": 8,                   // integer hours
    "venues": [
      { "venue_id": "V-0001", "venue_name": "Auditorium-1", "venue_capacity": 5000, "venue_availability": "Y" },
      ...
    ]
  }

  Response body:
  {
    "suggestions": [
      { "venue_id": "V-0001", "venue_name": "Auditorium-1", "venue_capacity": 5000, "suitability_score": 0.88, "rank": 1 },
      { "venue_id": "V-0009", "venue_name": "MBA Garden",   "venue_capacity": 3000, "suitability_score": 0.73, "rank": 2 },
      { "venue_id": "V-0003", "venue_name": "Campus-3 OAT1","venue_capacity": 2000, "suitability_score": 0.72, "rank": 3 }
    ]
  }

  Only available venues (venue_availability = 'Y') are scored.
  Returns top 3. If fewer than 3 available venues exist, returns what's available.

Run with:
  python app.py

The service auto-loads venue_model.pkl and label_encoders.pkl on startup.
"""

import os
import numpy as np
import joblib
from flask import Flask, request, jsonify

app = Flask(__name__)

# ── Load model artifacts on startup ───────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "venue_model.pkl")
ENCODERS_PATH = os.path.join(BASE_DIR, "label_encoders.pkl")

print("Loading model artifacts...")
model = joblib.load(MODEL_PATH)
encoders = joblib.load(ENCODERS_PATH)
print("✅  venue_model.pkl loaded.")
print("✅  label_encoders.pkl loaded.")

# Known encoder classes for safe fallback
KNOWN_CATEGORIES    = list(encoders["category"].classes_)
KNOWN_EVENT_TYPES   = list(encoders["event_type"].classes_)
KNOWN_VENUE_IDS     = list(encoders["venue_id"].classes_)
KNOWN_AVAILABILITY  = list(encoders["venue_availability"].classes_)


def safe_encode(encoder, value, fallback_index=0):
    """Encode a value safely; return fallback_index if unseen label."""
    try:
        return int(encoder.transform([value])[0])
    except ValueError:
        return fallback_index


def build_feature_row(cat_enc, etype_enc, month, dow, duration, vid_enc, capacity, avail_enc):
    """Returns a 1×8 numpy array in the exact feature order used during training."""
    return np.array([[cat_enc, etype_enc, month, dow, duration, vid_enc, capacity, avail_enc]])


@app.route("/predict", methods=["POST"])
def predict():
    try:
        body = request.get_json(force=True)

        # ── Validate required fields ───────────────────────────────────────────
        required = ["category", "event_type", "event_month", "day_of_week",
                    "duration_hours", "venues"]
        missing = [f for f in required if f not in body]
        if missing:
            return jsonify({"error": f"Missing fields: {missing}"}), 400

        category      = body["category"]
        event_type    = body["event_type"]
        event_month   = int(body["event_month"])
        day_of_week   = int(body["day_of_week"])
        duration      = int(body["duration_hours"])
        venues        = body["venues"]

        # ── Encode event-level features (same for all venues) ─────────────────
        cat_enc   = safe_encode(encoders["category"],   category)
        etype_enc = safe_encode(encoders["event_type"], event_type)

        # ── Score each available venue ─────────────────────────────────────────
        scored = []
        for venue in venues:
            vid   = venue.get("venue_id", "")
            name  = venue.get("venue_name", "")
            cap   = int(venue.get("venue_capacity", 0))
            avail = venue.get("venue_availability", "Y")

            # Skip unavailable venues
            if avail != "Y":
                continue

            vid_enc   = safe_encode(encoders["venue_id"],           vid)
            avail_enc = safe_encode(encoders["venue_availability"],  avail)

            feat  = build_feature_row(cat_enc, etype_enc, event_month, day_of_week,
                                       duration, vid_enc, cap, avail_enc)
            score = float(model.predict(feat)[0])
            score = round(max(0.0, min(1.0, score)), 4)   # clip to [0,1]

            scored.append({
                "venue_id":         vid,
                "venue_name":       name,
                "venue_capacity":   cap,
                "suitability_score": score,
            })

        if not scored:
            return jsonify({"suggestions": [], "message": "No available venues to score."}), 200

        # ── Sort desc by score, take top 3 ────────────────────────────────────
        scored.sort(key=lambda x: x["suitability_score"], reverse=True)
        top3 = scored[:3]

        suggestions = [
            {**v, "rank": i + 1}
            for i, v in enumerate(top3)
        ]

        return jsonify({"suggestions": suggestions}), 200

    except Exception as e:
        app.logger.error(f"/predict error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "venue_suggestion_rf_v1"}), 200


if __name__ == "__main__":
    # Runs on port 5000; Spring Boot calls http://localhost:5000/predict
    app.run(host="0.0.0.0", port=5000, debug=False)
