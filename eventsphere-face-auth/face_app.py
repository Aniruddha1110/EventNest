"""
face_app.py — EventSphere Face Recognition Flask Microservice
=============================================================
Uses DeepFace (works on Python 3.13, actively maintained).
Runs on port 5001.

POST /verify
  Request:  { "known_image_b64": "...", "captured_image_b64": "..." }
  Response: { "match": true/false, "distance": 0.42, "threshold": 0.55 }

GET /health
  Response: { "status": "ok", "service": "face-recognition-v1" }
"""

import base64
import io
import logging
import os
import tempfile

import numpy as np
from flask import Flask, jsonify, request
from PIL import Image
from deepface import DeepFace

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)

THRESHOLD = 0.55   # Relaxed — forgiving for lighting/angle variation
MODEL     = "VGG-Face"   # Fast, accurate, works CPU-only


# ── Helpers ────────────────────────────────────────────────────────────────────

def b64_to_image_file(b64_string: str, suffix=".jpg") -> str:
    """
    Decode base64 string → save as a temp JPEG file → return file path.
    DeepFace works best with file paths rather than numpy arrays.
    Handles data-URL prefix automatically.
    """
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]

    raw_bytes = base64.b64decode(b64_string)
    image = Image.open(io.BytesIO(raw_bytes))

    if image.mode != "RGB":
        image = image.convert("RGB")

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    image.save(tmp.name, format="JPEG", quality=95)
    tmp.close()
    return tmp.name


# ── /verify endpoint ───────────────────────────────────────────────────────────

@app.route("/verify", methods=["POST"])
def verify():
    known_path    = None
    captured_path = None

    try:
        body = request.get_json(force=True)

        if not body.get("known_image_b64"):
            return jsonify({"error": "known_image_b64 is required"}), 400
        if not body.get("captured_image_b64"):
            return jsonify({"error": "captured_image_b64 is required"}), 400

        # ── Decode both images to temp files ───────────────────────────────────
        try:
            known_path = b64_to_image_file(body["known_image_b64"])
        except Exception as e:
            return jsonify({"error": f"Failed to decode known_image_b64: {e}"}), 400

        try:
            captured_path = b64_to_image_file(body["captured_image_b64"])
        except Exception as e:
            return jsonify({"error": f"Failed to decode captured_image_b64: {e}"}), 400

        # ── Run DeepFace verification ──────────────────────────────────────────
        result = DeepFace.verify(
            img1_path       = known_path,
            img2_path       = captured_path,
            model_name      = MODEL,
            detector_backend = "opencv",   # fast CPU detector
            enforce_detection = False,     # don't crash if face not detected
            silent          = True,
        )

        distance  = round(float(result["distance"]), 4)
        # Use our threshold (0.55) instead of DeepFace's default
        match     = distance <= THRESHOLD
        verified  = result.get("verified", False)

        # Check if face was actually detected
        # DeepFace returns distance=0.0 when enforce_detection=False and no face found
        # We use a heuristic: if distance is exactly 0.0, likely no face detected
        if distance == 0.0 and not verified:
            log.warning("Possible no-face-detected scenario for captured image.")
            return jsonify({
                "match":    False,
                "distance": 1.0,
                "threshold": THRESHOLD,
                "reason":   "no_face_detected",
            }), 200

        log.info("Face verify: distance=%.4f threshold=%.2f match=%s", distance, THRESHOLD, match)

        return jsonify({
            "match":     match,
            "distance":  distance,
            "threshold": THRESHOLD,
        }), 200

    except ValueError as ve:
        # DeepFace raises ValueError when no face is detected
        err_msg = str(ve).lower()
        if "face" in err_msg or "detect" in err_msg:
            log.warning("No face detected: %s", ve)
            return jsonify({
                "match":    False,
                "distance": 1.0,
                "threshold": THRESHOLD,
                "reason":   "no_face_detected",
            }), 200
        log.error("/verify ValueError: %s", ve)
        return jsonify({"error": str(ve)}), 500

    except Exception as e:
        log.error("/verify error: %s", e, exc_info=True)
        return jsonify({"error": str(e)}), 500

    finally:
        # Always clean up temp files
        for path in [known_path, captured_path]:
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                except Exception:
                    pass


# ── /health endpoint ───────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":    "ok",
        "service":   "face-recognition-v1",
        "model":     MODEL,
        "threshold": THRESHOLD,
    }), 200


# ── Run ────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    log.info("Starting EventSphere Face Recognition Service on port 5001...")
    log.info("Model: %s | Threshold: %.2f", MODEL, THRESHOLD)
    # Warm up DeepFace on startup so first request isn't slow
    log.info("Warming up DeepFace model (first load takes ~10s)...")
    try:
        import numpy as np
        dummy = np.zeros((100, 100, 3), dtype=np.uint8)
        DeepFace.represent(dummy, model_name=MODEL, enforce_detection=False)
        log.info("DeepFace model loaded successfully.")
    except Exception as e:
        log.warning("Warmup skipped: %s", e)

    app.run(host="0.0.0.0", port=5001, debug=False)