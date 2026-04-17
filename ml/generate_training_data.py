"""
generate_training_data.py
=========================
Generates a synthetic dataset for training the EventSphere venue suggestion model.

FEATURES:
  - category       : Cultural | Technical | Sports | Ceremony | Food
  - event_type     : Free | Paid
  - event_month    : 1–12
  - day_of_week    : 0=Mon … 6=Sun
  - duration_hours : 1–72
  - venue_id       : V-0001 … V-0010
  - venue_capacity : actual capacity of each venue

TARGET:
  - suitability_score : 0.0 – 1.0  (higher = better fit)

DOMAIN RULES (encoded as score contributions):
  Each (category, event_type, duration, time-features) combination has a
  base affinity for each venue.  Gaussian noise is added so the model
  must generalise, not just memorise.

VENUE REFERENCE (from Oracle seed data):
  V-0001  Auditorium-1           5000
  V-0002  Cricket Stadium       10000
  V-0003  Campus-3 OAT1          2000
  V-0004  Campus-15 OAT           500
  V-0005  KIMS Auditorium         800
  V-0006  KISS Athletics Stadium 12000
  V-0007  Campus-8 Tennis Court   300
  V-0008  MBA Auditorium         1000
  V-0009  MBA Garden             3000
  V-0010  Campus-6 OAT            800
"""

import numpy as np
import pandas as pd
import random

random.seed(42)
np.random.seed(42)

# ── Venue metadata ─────────────────────────────────────────────────────────────
VENUES = [
    {"venue_id": "V-0001", "venue_name": "Auditorium-1",           "venue_capacity": 5000,  "venue_availability": "Y"},
    {"venue_id": "V-0002", "venue_name": "Cricket Stadium",         "venue_capacity": 10000, "venue_availability": "Y"},
    {"venue_id": "V-0003", "venue_name": "Campus-3 OAT1",           "venue_capacity": 2000,  "venue_availability": "Y"},
    {"venue_id": "V-0004", "venue_name": "Campus-15 OAT",           "venue_capacity": 500,   "venue_availability": "Y"},
    {"venue_id": "V-0005", "venue_name": "KIMS Auditorium",         "venue_capacity": 800,   "venue_availability": "Y"},
    {"venue_id": "V-0006", "venue_name": "KISS Athletics Stadium",  "venue_capacity": 12000, "venue_availability": "Y"},
    {"venue_id": "V-0007", "venue_name": "Campus-8 Tennis Court",   "venue_capacity": 300,   "venue_availability": "Y"},
    {"venue_id": "V-0008", "venue_name": "MBA Auditorium",          "venue_capacity": 1000,  "venue_availability": "Y"},
    {"venue_id": "V-0009", "venue_name": "MBA Garden",              "venue_capacity": 3000,  "venue_availability": "Y"},
    {"venue_id": "V-0010", "venue_name": "Campus-6 OAT",            "venue_capacity": 800,   "venue_availability": "Y"},
]

CATEGORIES   = ["Cultural", "Technical", "Sports", "Ceremony", "Food"]
EVENT_TYPES  = ["Free", "Paid"]

# ── Base affinity matrix: category → venue_id → base_score (0.0 – 1.0) ─────────
# This encodes our domain knowledge.  Noise is added later.
#
# Logic behind the rules:
#   Cultural:   big open venues or auditoriums — V-0001, V-0002, V-0003, V-0009
#   Technical:  medium indoor — MBA Auds, KIMS — V-0005, V-0008; moderate OAT
#   Sports:     stadiums + courts — V-0002, V-0006, V-0007
#   Ceremony:   formal/prestigious — Auditorium-1, KIMS, MBA — V-0001, V-0005, V-0008
#   Food:       open outdoor areas — gardens, OATs — V-0003, V-0004, V-0009, V-0010
BASE_AFFINITY = {
    #            V-0001  V-0002  V-0003  V-0004  V-0005  V-0006  V-0007  V-0008  V-0009  V-0010
    "Cultural":  [0.85,   0.70,   0.80,   0.55,   0.50,   0.60,   0.20,   0.50,   0.75,   0.55],
    "Technical": [0.55,   0.25,   0.45,   0.40,   0.75,   0.20,   0.15,   0.80,   0.35,   0.45],
    "Sports":    [0.20,   0.90,   0.40,   0.30,   0.20,   0.95,   0.85,   0.15,   0.30,   0.30],
    "Ceremony":  [0.90,   0.40,   0.45,   0.45,   0.85,   0.35,   0.20,   0.80,   0.50,   0.45],
    "Food":      [0.30,   0.35,   0.65,   0.70,   0.35,   0.30,   0.55,   0.30,   0.80,   0.75],
}

def duration_modifier(duration_hours: int, venue_capacity: int) -> float:
    """
    Long events (>8h) benefit from large-capacity venues (more facilities).
    Short events (<3h) can comfortably fit anywhere → neutral modifier.
    """
    if duration_hours >= 8 and venue_capacity >= 3000:
        return 0.10
    if duration_hours >= 8 and venue_capacity < 1000:
        return -0.15
    if duration_hours <= 2 and venue_capacity >= 8000:
        return -0.10   # overkill for short programmes
    return 0.0

def paid_modifier(event_type: str, venue_id: str) -> float:
    """
    Paid events pair better with prestigious/managed indoor venues (better experience).
    Free events can sprawl across open areas.
    """
    indoor_prestige = {"V-0001", "V-0005", "V-0008"}
    open_areas      = {"V-0003", "V-0004", "V-0009", "V-0010"}
    if event_type == "Paid" and venue_id in indoor_prestige:
        return 0.10
    if event_type == "Free" and venue_id in open_areas:
        return 0.08
    return 0.0

def season_modifier(month: int, venue_id: str) -> float:
    """
    Outdoor venues (OATs, gardens, stadiums) score higher in Oct-Feb (Odisha winter).
    Indoor venues score better in May-Sep (hot/rainy season in Bhubaneswar).
    """
    outdoor = {"V-0002", "V-0003", "V-0004", "V-0006", "V-0007", "V-0009", "V-0010"}
    indoor  = {"V-0001", "V-0005", "V-0008"}
    cool_months = {10, 11, 12, 1, 2}
    if venue_id in outdoor and month in cool_months:
        return 0.08
    if venue_id in indoor and month not in cool_months:
        return 0.05
    return 0.0

def compute_score(category, event_type, month, day_of_week, duration_hours, venue_idx, venue):
    venue_id = venue["venue_id"]
    base     = BASE_AFFINITY[category][venue_idx]
    score    = (base
                + duration_modifier(duration_hours, venue["venue_capacity"])
                + paid_modifier(event_type, venue_id)
                + season_modifier(month, venue_id))
    # clip + gaussian noise
    noise = np.random.normal(0, 0.04)
    return float(np.clip(score + noise, 0.0, 1.0))

# ── Generate rows ──────────────────────────────────────────────────────────────
# For each synthetic event we generate one row per venue (10 rows),
# so the model learns to compare scores across venues for the same event context.
# Total: N_EVENTS × 10 venues = dataset size.

N_EVENTS = 160   # → 1,600 rows (plenty for RF with 10 venues)
rows = []

for _ in range(N_EVENTS):
    category     = random.choice(CATEGORIES)
    event_type   = random.choices(EVENT_TYPES, weights=[0.6, 0.4])[0]
    month        = random.randint(1, 12)
    day_of_week  = random.randint(0, 6)
    duration     = random.choices(
        [1, 2, 3, 4, 6, 8, 12, 24, 48, 72],
        weights= [5, 8, 15, 20, 18, 14, 10,  5,  3,  2]
    )[0]

    for v_idx, venue in enumerate(VENUES):
        score = compute_score(category, event_type, month, day_of_week, duration, v_idx, venue)
        rows.append({
            "category":          category,
            "event_type":        event_type,
            "event_month":       month,
            "day_of_week":       day_of_week,
            "duration_hours":    duration,
            "venue_id":          venue["venue_id"],
            "venue_capacity":    venue["venue_capacity"],
            "venue_availability": venue["venue_availability"],
            "suitability_score": round(score, 4),
        })

df = pd.DataFrame(rows)

# ── Sanity checks ──────────────────────────────────────────────────────────────
print(f"Dataset shape: {df.shape}")
print(f"\nScore distribution:\n{df['suitability_score'].describe().round(3)}")
print(f"\nCategory distribution:\n{df['category'].value_counts()}")
print(f"\nMean score per venue:\n{df.groupby('venue_id')['suitability_score'].mean().round(3)}")

# ── Save ───────────────────────────────────────────────────────────────────────
df.to_csv("training_data.csv", index=False)
print("\n✅  training_data.csv written successfully.")
