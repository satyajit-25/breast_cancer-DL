import { useRef, useState } from "react"

export default function UploadSection({
  preview, loading, error,
  onFileSelect, onAnalyze, onClear, hasFile
}) {
  const inputRef   = useRef(null)
  const [drag, setDrag] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file) validateAndSelect(file)
  }

  function handleChange(e) {
    const file = e.target.files[0]
    if (file) validateAndSelect(file)
  }

  function validateAndSelect(file) {
    const allowed = ["image/png","image/jpeg","image/jpg","image/tiff","image/bmp"]
    if (!allowed.includes(file.type)) {
      alert("Please upload a PNG, JPG, TIFF or BMP image.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum size is 10 MB.")
      return
    }
    onFileSelect(file)
  }

  return (
    <div style={styles.card}>

      {/* Drop zone */}
      {!preview ? (
        <div
          style={{
            ...styles.dropZone,
            ...(drag ? styles.dropZoneActive : {})
          }}
          onClick={() => inputRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
        >
          <div style={styles.dropIcon}>🩺</div>
          <h3 style={styles.dropTitle}>Drop your scan image here</h3>
          <p style={styles.dropSub}>
            or click to browse — PNG, JPG, TIFF accepted (max 10 MB)
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.tiff,.bmp"
            style={{ display: "none" }}
            onChange={handleChange}
          />
        </div>
      ) : (
        /* Image preview */
        <div style={styles.previewWrap}>
          <img src={preview} alt="Preview" style={styles.previewImg} />
          <div style={styles.previewBar}>
            <span style={{ fontSize: 13, color: "var(--gray)" }}>
              Image ready for analysis
            </span>
            <button style={styles.removeBtn} onClick={onClear}>
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={styles.errorBox}>
          ❌ {error}
        </div>
      )}

      {/* Analyze button */}
      <button
        style={{
          ...styles.analyzeBtn,
          ...((!hasFile || loading) ? styles.analyzeBtnDisabled : {})
        }}
        disabled={!hasFile || loading}
        onClick={onAnalyze}
      >
        {loading ? "Analyzing…" : "🔍 Analyze Image"}
      </button>

    </div>
  )
}

const styles = {
  card: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    boxShadow: "var(--shadow)",
    padding: 26,
  },
  dropZone: {
    border: "2px dashed var(--border)",
    borderRadius: 10,
    padding: "42px 24px",
    textAlign: "center",
    cursor: "pointer",
    background: "var(--bg)",
    transition: "border-color 0.2s, background 0.2s",
  },
  dropZoneActive: {
    borderColor: "var(--pink)",
    background: "var(--pink-lt)",
  },
  dropIcon:  { fontSize: 42, marginBottom: 12 },
  dropTitle: { fontSize: 17, fontWeight: 600, marginBottom: 6 },
  dropSub:   { fontSize: 13, color: "var(--gray)" },
  previewWrap: {
    border: "1px solid var(--border)",
    borderRadius: 10,
    overflow: "hidden",
  },
  previewImg: {
    width: "100%",
    maxHeight: 280,
    objectFit: "contain",
    background: "#000",
    display: "block",
  },
  previewBar: {
    padding: "10px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  removeBtn: {
    background: "none",
    border: "none",
    color: "var(--red)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  errorBox: {
    background: "var(--red-lt)",
    border: "1px solid #f5c6cb",
    color: "var(--red)",
    borderRadius: 10,
    padding: "12px 15px",
    fontSize: 14,
    marginTop: 14,
  },
  analyzeBtn: {
    width: "100%",
    marginTop: 18,
    padding: 14,
    border: "none",
    borderRadius: 10,
    background: "var(--pink)",
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  analyzeBtnDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
}
