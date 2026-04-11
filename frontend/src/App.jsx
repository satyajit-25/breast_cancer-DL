import { useState } from "react"
import axios from "axios"
import UploadSection from "./components/UploadSection"
import ResultCard    from "./components/ResultCard"
import GradCam       from "./components/GradCam"

const API = "https://breast-cancer-dl-8hwo.onrender.com"

export default function App() {
  const [file,     setFile]     = useState(null)
  const [preview,  setPreview]  = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState(null)
  const [error,    setError]    = useState(null)

  // Called when user picks a file
  function handleFileSelect(selectedFile) {
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
    setResult(null)
    setError(null)
  }

  // Called when user clicks Analyze
  async function handleAnalyze() {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await axios.post(`${API}/predict`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      setResult(res.data)
    } catch (err) {
      const msg = err.response?.data?.detail || "Server error. Is the backend running?"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Reset everything
  function handleReset() {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
  }

  return (
    <div style={styles.page}>

      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.logoRing}>🔬</div>
        <h1 style={styles.title}>Breast Cancer Detection</h1>
        <p style={styles.subtitle}>
          Upload a histology scan — AI predicts Benign or Malignant
          and shows where it looked
        </p>
      </header>

      {/* ── Disclaimer ── */}
      <div style={styles.disclaimer}>
        ℹ️ <strong>Medical disclaimer:</strong> This tool is for educational
        and research purposes only. It is <strong>not</strong> a substitute
        for professional medical advice. Always consult a qualified healthcare provider.
      </div>

      <div style={styles.container}>

        {/* ── Upload section — always visible ── */}
        {!result && (
          <UploadSection
            preview={preview}
            loading={loading}
            error={error}
            onFileSelect={handleFileSelect}
            onAnalyze={handleAnalyze}
            onClear={handleReset}
            hasFile={!!file}
          />
        )}

        {/* ── Loading spinner ── */}
        {loading && (
          <div style={styles.loaderWrap}>
            <div style={styles.spinner} />
            <p style={styles.loaderText}>
              Analyzing image and generating Grad-CAM heatmap…
            </p>
          </div>
        )}

        {/* ── Results ── */}
        {result && !loading && (
          <div className="fade-in">
            <ResultCard result={result} />
            <GradCam
              originalImg={result.original_img}
              gradcamImg={result.gradcam_img}
              method={result.gradcam_method}
            />
            <button style={styles.resetBtn} onClick={handleReset}>
              ↩ Analyze another image
            </button>
          </div>
        )}

      </div>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <p>Built with FastAPI + React + TensorFlow</p>
        <p style={{ fontSize: 12, marginTop: 4, color: "var(--gray)" }}>
          ⚠️ For research purposes only — not for clinical use
        </p>
      </footer>

    </div>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "24px 16px 48px",
    maxWidth: 780,
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    marginBottom: 28,
  },
  logoRing: {
    width: 72, height: 72,
    borderRadius: "50%",
    background: "var(--pink-lt)",
    border: "3px solid var(--pink)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 32,
    marginBottom: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "var(--text)",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "var(--gray)",
  },
  disclaimer: {
    background: "var(--blue-lt)",
    border: "1px solid #90caf9",
    borderRadius: "var(--radius)",
    padding: "13px 18px",
    fontSize: 13,
    color: "var(--blue)",
    marginBottom: 24,
    lineHeight: 1.6,
  },
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  loaderWrap: {
    textAlign: "center",
    padding: "40px 0",
  },
  spinner: {
    width: 48, height: 48,
    border: "4px solid var(--border)",
    borderTopColor: "var(--pink)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto 16px",
  },
  loaderText: {
    color: "var(--gray)",
    fontSize: 14,
  },
  resetBtn: {
    width: "100%",
    padding: "13px",
    marginTop: 4,
    border: "2px solid var(--border)",
    borderRadius: 10,
    background: "transparent",
    fontSize: 15,
    cursor: "pointer",
    color: "var(--text)",
    transition: "border-color 0.2s",
  },
  footer: {
    textAlign: "center",
    marginTop: 48,
    fontSize: 13,
    color: "var(--gray)",
  },
}
