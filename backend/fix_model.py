"""
fix_model.py
Run: python fix_model.py
"""
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, regularizers
from tensorflow.keras.applications import MobileNetV2

print("Step 1: Rebuilding model architecture...")

base = MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights=None,
)

model = keras.Sequential([
    base,
    layers.GlobalAveragePooling2D(),
    layers.BatchNormalization(),
    layers.Dense(256, activation="relu",
                 kernel_regularizer=regularizers.l2(1e-4)),
    layers.Dropout(0.5),
    layers.Dense(64, activation="relu",
                 kernel_regularizer=regularizers.l2(1e-4)),
    layers.Dropout(0.3),
    layers.Dense(1, activation="sigmoid"),
])

# Build by running a dummy pass
dummy = np.zeros((1, 224, 224, 3), dtype=np.float32)
model(dummy, training=False)
print(f"   Architecture built — {model.count_params():,} parameters ✅")

print("\nStep 2: Loading weights from .weights.h5 file...")
model.load_weights("model/breast_cancer_weights.weights.h5")
print("   Weights loaded ✅")

print("\nStep 3: Testing prediction...")
pred = float(model(dummy, training=False).numpy()[0][0])
print(f"   Test prediction: {pred:.4f}  ✅")
if pred < 0 or pred > 1:
    print("   ERROR: Prediction out of range — weights may be corrupted")
else:
    print("   Prediction is valid (between 0 and 1)")

print("\nStep 4: Saving fixed model...")
model.compile(
    optimizer=keras.optimizers.Adam(1e-3),
    loss="binary_crossentropy",
    metrics=["accuracy"]
)
# Delete old broken file first
import os
old = "model/breast_cancer_cnn.keras"
if os.path.exists(old):
    os.remove(old)
    print("   Removed old broken model ✅")

model.save("model/breast_cancer_cnn.keras")
print("   Fixed model saved to model/breast_cancer_cnn.keras ✅")

print("\nStep 5: Verifying saved model loads correctly...")
loaded = tf.keras.models.load_model("model/breast_cancer_cnn.keras")
loaded(dummy, training=False)
pred2 = float(loaded(dummy, training=False).numpy()[0][0])
print(f"   Reloaded model prediction: {pred2:.4f} ✅")

print("""
============================================
  ALL DONE!
  
  Now run:
  uvicorn main:app --reload --port 8000
  
  You should see:
  [INFO] Model loaded and warmed up.
============================================
""")
