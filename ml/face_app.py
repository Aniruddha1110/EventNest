"""
face_app.py — EventSphere Face Recognition Flask Microservice
=============================================================
Runs on port 5001. Kept separate from venue suggestion (port 5000).

Exposes two endpoints:

  POST /verify
  ─────────────────────────────────────────────────────────────
  Compares a captured webcam frame against the admin's stored
  face encoding (loaded from Oracle ADMIN_BIOMETRIC BLOB bytes).

  Request JSON:
  {
    "known_image_b64":   "<base64 of BLOB bytes from Oracle>",
    "captured_image_b64": "<base64 of webcam JPEG from frontend>"
  }

  Response JSON (200):
  {
    "match":    true | false,
    "distance": 0.42,         // Euclidean distance; lower = more similar
    "threshold": 0.55
  }

  Response JSON (400/500):
  { "error": "..." }

  GET /health
  ─────────────────────────────────────────────────────────────
  Returns { "status": "ok", "service": "face-recognition-v1" }

ALGORITHM:
  Uses the `face_recognition` library (dlib under the hood).
  1. Decode both base64 strings → numpy RGB arrays
  2. Detect face locations in each image
  3. Compute 128-dim face encodings
  4. Euclidean distance between encodings
  5. distance <= THRESHOLD  →  match = True

THRESHOLD: 0.55 (relaxed — forgiving for webcam lighting variation)
  0.45 = strict (office-grade lighting required)
  0.50 = dlib default recommendation
  0.55 = relaxed (handles dim rooms, angle variation)

WHY THIS APPROACH:
  face_recognition works with a SINGLE reference photo per person.
  No training required. The dlib model is pre-trained on millions of
  faces. You just provide the reference BLOB stored in Oracle and the
  live webcam capture.
"""

import base64
import io
import logging

import face_recognition
import numpy as np
from flask import Flask, jsonify, request
from PIL import Image

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

THRESHOLD = 0.55  # Relaxed — forgiving for lighting variation


# ── Helpers ────────────────────────────────────────────────────────────────────

def b64_to_rgb_array(b64_string: str) -> np.ndarray:
    """
    Decode a base64 string to a numpy RGB array suitable for face_recognition.
    Handles both raw base64 and data-URL format (data:image/jpeg;base64,...).
    Converts RGBA → RGB automatically (webcam sometimes sends RGBA).
    """
    # Strip data-URL prefix if present
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]

    raw_bytes = base64.b64decode(b64_string)
    image = Image.open(io.BytesIO(raw_bytes))

    # face_recognition requires RGB (not RGBA or grayscale)
    if image.mode != "RGB":
        image = image.convert("RGB")

    return np.array(image)


def encode_face(image_array: np.ndarray, label: str):
    """
    Detect face(s) in image_array and return the first encoding.
    Returns None if no face is detected (caller handles this case).
    Uses model='hog' (fast, CPU-only — good for dev; swap to 'cnn' for GPU prod).
    """
    locations = face_recognition.face_locations(image_array, model="hog")

    if not locations:
        log.warning("No face detected in %s image.", label)
        return None

    if len(locations) > 1:
        log.info("%s image has %d faces — using the largest one.", label, len(locations))
        # Pick the largest face (max bounding-box area)
        locations = [max(locations, key=lambda loc: (loc[2] - loc[0]) * (loc[1] - loc[3]))]

    encodings = face_recognition.face_encodings(image_array, known_face_locations=locations)
    return encodings[0] if encodings else None


# ── /verify endpoint ───────────────────────────────────────────────────────────

@app.route("/verify", methods=["POST"])
def verify():
    try:
        body = request.get_json(force=True)

        # ── Validate fields ────────────────────────────────────────────────────
        if not body.get("known_image_b64"):
            return jsonify({"error": "known_image_b64 is required"}), 400
        if not body.get("captured_image_b64"):
            return jsonify({"error": "captured_image_b64 is required"}), 400

        # ── Decode images ──────────────────────────────────────────────────────
        try:
            known_array = b64_to_rgb_array(body["known_image_b64"])
        except Exception as e:
            return jsonify({"error": f"Failed to decode known_image_b64: {e}"}), 400

        try:
            captured_array = b64_to_rgb_array(body["captured_image_b64"])
        except Exception as e:
            return jsonify({"error": f"Failed to decode captured_image_b64: {e}"}), 400

        # ── Encode faces ───────────────────────────────────────────────────────
        known_encoding = encode_face(known_array, "known")
        if known_encoding is None:
            return jsonify({
                "error": "No face detected in admin reference photo (BLOB). "
                         "Ensure ADMIN_BIOMETRIC is correctly loaded in Oracle."
            }), 422

        captured_encoding = encode_face(captured_array, "captured")
        if captured_encoding is None:
            return jsonify({
                "match":    False,
                "distance": 1.0,
                "threshold": THRESHOLD,
                "reason":   "no_face_detected"
            }), 200  # 200 not 422 — frontend handles 'no face detected' gracefully

        # ── Compare ────────────────────────────────────────────────────────────
        distance = float(face_recognition.face_distance([known_encoding], captured_encoding)[0])
        match    = distance <= THRESHOLD

        log.info(
            "Face verify: distance=%.4f threshold=%.2f match=%s",
            distance, THRESHOLD, match
        )

        return jsonify({
            "match":    match,
            "distance": round(distance, 4),
            "threshold": THRESHOLD,
        }), 200

    except Exception as e:
        log.error("/verify error: %s", e, exc_info=True)
        return jsonify({"error": str(e)}), 500


# ── /health endpoint ───────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":    "ok",
        "service":   "face-recognition-v1",
        "threshold": THRESHOLD,
    }), 200


# ── Run ────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    log.info("Starting EventSphere Face Recognition Service on port 5001...")
    log.info("Threshold: %.2f (relaxed — forgiving for lighting variation)", THRESHOLD)
    app.run(host="0.0.0.0", port=5001, debug=False)
