"""
main.py — FastAPI Backend for Breast Cancer Detection
======================================================
Run:  uvicorn main:app --reload --port 8000
Docs: http://localhost:8000/docs
"""

import io
import os
import base64
import numpy as np
from PIL import Image, ImageDraw
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import tensorflow as tf
import matplotlib
matplotlib.use("Agg")
import matplotlib.cm as cm

# ── App setup ─────────────────────────────────────────────────────
app = FastAPI(
    title="Breast Cancer Detection API",
    description="Upload a histology scan image to predict Benign or Malignant",
    version="1.0.0"
)

# ── CORS — allows React frontend to talk to this backend ──────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",   # Vite dev server
                   "http://localhost:3000",   # CRA dev server
                   "https://*.vercel.app"],                      # allow all for deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Constants ─────────────────────────────────────────────────────
MODEL_PATH  = "model/breast_cancer_cnn.keras"
IMG_SIZE    = (224, 224)
MAX_FILE_MB = 10
ALLOWED     = {"image/png", "image/jpeg", "image/jpg",
               "image/tiff", "image/bmp"}

# ── Load model at startup ─────────────────────────────────────────
model       = None
base_model  = None
head_layers = []
target_conv = None

@app.on_event("startup")
async def load_model():
    global model, base_model, head_layers, target_conv

    if not os.path.exists(MODEL_PATH):
        print(f"[WARNING] Model not found at {MODEL_PATH}")
        print("[WARNING] Place breast_cancer_cnn.keras in model/ folder")
        return

    try:
        model = tf.keras.models.load_model(MODEL_PATH)
        # Warm up
        model(np.zeros((1, 224, 224, 3), dtype=np.float32), training=False)
        print("[INFO] Model loaded and warmed up.")

        # Find base model and head layers for Grad-CAM
        for layer in model.layers:
            if hasattr(layer, "layers"):
                base_model = layer
            elif base_model is not None:
                head_layers.append(layer)

        # Find last Conv2D in base model
        if base_model:
            for layer in reversed(base_model.layers):
                if isinstance(layer, tf.keras.layers.Conv2D):
                    target_conv = layer
                    print(f"[INFO] Grad-CAM layer: {target_conv.name}")
                    break

    except Exception as e:
        print(f"[ERROR] Failed to load model: {e}")


# ── Response model ────────────────────────────────────────────────
class PredictionResponse(BaseModel):
    label:        str
    confidence:   float
    probability:  float
    advice:       str
    color:        str
    original_img: Optional[str] = None
    gradcam_img:  Optional[str] = None
    gradcam_method: Optional[str] = None


# ── Helper functions ──────────────────────────────────────────────
def preprocess(file_bytes: bytes):
    pil = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    pil = pil.resize(IMG_SIZE, Image.LANCZOS)
    arr = np.array(pil, dtype=np.float32) / 255.0
    return pil, np.expand_dims(arr, axis=0)


def pil_to_base64(pil_img: Image.Image) -> str:
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    buf.seek(0)
    return "data:image/png;base64," + base64.b64encode(buf.read()).decode()


def call_layer(layer, x):
    try:
        return layer(x, training=False)
    except TypeError:
        return layer(x)


def get_gradcam(img_array):
    """Grad-CAM with saliency fallback — Keras 3 compatible."""
    # Method 1: Grad-CAM
    if base_model and target_conv:
        try:
            conv_model = tf.keras.Model(
                inputs=base_model.input,
                outputs=target_conv.output
            )
            conv_model(np.zeros((1, 224, 224, 3), dtype=np.float32),
                       training=False)

            with tf.GradientTape() as tape:
                conv_out = conv_model(img_array, training=False)
                tape.watch(conv_out)

                after_conv = False
                x = conv_out
                for layer in base_model.layers:
                    if after_conv:
                        x = call_layer(layer, x)
                    if layer.name == target_conv.name:
                        after_conv = True

                for layer in head_layers:
                    x = call_layer(layer, x)

                loss = x[:, 0]

            grads        = tape.gradient(loss, conv_out)
            pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
            heatmap      = conv_out[0] @ pooled_grads[..., tf.newaxis]
            heatmap      = tf.squeeze(heatmap)
            heatmap      = tf.maximum(heatmap, 0)
            heatmap      = heatmap / (tf.math.reduce_max(heatmap) + 1e-8)
            return heatmap.numpy(), "gradcam"
        except Exception:
            pass

    # Method 2: Saliency fallback
    img_var = tf.Variable(tf.cast(img_array, tf.float32))
    with tf.GradientTape() as tape:
        pred = model(img_var, training=False)
        loss = pred[:, 0]
    grads    = tape.gradient(loss, img_var)
    saliency = tf.reduce_max(tf.abs(grads), axis=-1)[0]
    saliency = saliency / (tf.math.reduce_max(saliency) + 1e-8)
    return saliency.numpy(), "saliency"


def make_overlay(pil_img, heatmap, alpha=0.45):
    original    = pil_img.convert("RGB").resize(IMG_SIZE, Image.LANCZOS)
    h_pil       = Image.fromarray(np.uint8(255 * heatmap)).resize(IMG_SIZE, Image.LANCZOS)
    colormap    = cm.get_cmap("jet")
    colored     = np.uint8(colormap(np.array(h_pil) / 255.0)[:, :, :3] * 255)
    colored_pil = Image.fromarray(colored).convert("RGB")
    blended     = Image.blend(original, colored_pil, alpha=alpha)
    draw = ImageDraw.Draw(blended)
    draw.rectangle([0, 0, IMG_SIZE[0]-1, IMG_SIZE[1]-1],
                   outline=(255, 255, 255), width=2)
    return blended


# ── Routes ────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "message": "Breast Cancer Detection API",
        "status":  "running",
        "model":   "loaded" if model else "not loaded",
        "docs":    "/docs"
    }


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):

    # Validate file
    if file.content_type not in ALLOWED:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. "
                   f"Use PNG, JPG, or TIFF."
        )

    file_bytes = await file.read()

    if len(file_bytes) > MAX_FILE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size is {MAX_FILE_MB} MB."
        )

    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Place breast_cancer_cnn.keras in model/ folder."
        )

    # Preprocess
    try:
        pil_img, img_array = preprocess(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=400,
                            detail=f"Could not read image: {str(e)}")

    # Predict
    try:
        prob      = float(model(img_array, training=False).numpy()[0][0])
        malignant = prob >= 0.5
        confidence = prob * 100 if malignant else (1 - prob) * 100

        label  = "Malignant" if malignant else "Benign"
        color  = "red"       if malignant else "green"
        advice = (
            "Signs of malignant tissue detected. Please consult an "
            "oncologist immediately for further evaluation."
            if malignant else
            "No clear signs of malignancy detected. Continue regular "
            "check-ups as advised by your doctor."
        )
    except Exception as e:
        raise HTTPException(status_code=500,
                            detail=f"Prediction failed: {str(e)}")

    # Grad-CAM
    original_b64 = pil_to_base64(pil_img)
    gradcam_b64  = None
    method       = None

    try:
        heatmap, method = get_gradcam(img_array)
        overlay         = make_overlay(pil_img, heatmap)
        gradcam_b64     = pil_to_base64(overlay)
    except Exception as e:
        print(f"[WARNING] Grad-CAM failed: {e}")

    return PredictionResponse(
        label=label,
        confidence=round(confidence, 1),
        probability=round(prob * 100, 2),
        advice=advice,
        color=color,
        original_img=original_b64,
        gradcam_img=gradcam_b64,
        gradcam_method=method,
    )
