export default function ResultCard({ result }) {
  const malignant  = result.label === "Malignant"
  const color      = malignant ? "var(--red)"   : "var(--green)"
  const bgColor    = malignant ? "var(--red-lt)" : "var(--green-lt)"
  const borderCol  = malignant ? "#d32f2f"       : "#0f9e5a"
  const icon       = malignant ? "⚠️" : "✅"
  const conf       = result.confidence

  return (
    <div style={styles.card}>

      {/* Result header */}
      <div style={{ ...styles.resultBox, background: bgColor, borderColor: borderCol }}>
        <div style={{ ...styles.resultIcon, background: bgColor }}>
          {icon}
        </div>
        <div>
          <h2 style={{ ...styles.resultLabel, color }}>{result.label}</h2>
          <p style={{ ...styles.resultSub, color }}>
            Confidence: <strong>{conf}%</strong>
          </p>
        </div>
      </div>

      {/* Confidence bar */}
      <div style={styles.confSection}>
        <div style={styles.confRow}>
          <span style={styles.confLabel}>Confidence</span>
          <span style={{ ...styles.confPct, color }}>{conf}%</span>
        </div>
        <div style={styles.barBg}>
          <div style={{
            ...styles.barFill,
            width: `${conf}%`,
            background: color,
          }} />
        </div>
      </div>

      {/* Probability breakdown */}
      <div style={styles.probRow}>
        <div style={{ ...styles.probBox, borderColor: "var(--red)" }}>
          <span style={styles.probLabel}>Malignant probability</span>
          <span style={{ ...styles.probVal, color: "var(--red)" }}>
            {result.probability}%
          </span>
        </div>
        <div style={{ ...styles.probBox, borderColor: "var(--green)" }}>
          <span style={styles.probLabel}>Benign probability</span>
          <span style={{ ...styles.probVal, color: "var(--green)" }}>
            {(100 - result.probability).toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Advice */}
      <div style={{
        ...styles.adviceBox,
        background: bgColor,
        color,
        border: `1px solid ${borderCol}33`,
      }}>
        {malignant ? "🚨" : "✅"} {result.advice}
      </div>

      {/* Disclaimer */}
      <p style={styles.disclaimer}>
        ⚠️ This AI result should <strong>not</strong> replace professional
        medical advice. Please consult a qualified oncologist for diagnosis.
      </p>

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
  resultBox: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    border: "2px solid",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  resultIcon: {
    width: 56, height: 56,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
    flexShrink: 0,
  },
  resultLabel: {
    fontSize: 26,
    fontWeight: 800,
    margin: 0,
  },
  resultSub: {
    fontSize: 15,
    margin: "4px 0 0",
  },
  confSection: { marginBottom: 18 },
  confRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  confLabel: { fontSize: 13, color: "var(--gray)" },
  confPct:   { fontSize: 13, fontWeight: 600 },
  barBg: {
    height: 10,
    background: "var(--border)",
    borderRadius: 99,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 99,
    transition: "width 1s ease",
  },
  probRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 18,
  },
  probBox: {
    border: "1px solid",
    borderRadius: 10,
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  probLabel: { fontSize: 12, color: "var(--gray)" },
  probVal:   { fontSize: 20, fontWeight: 700 },
  adviceBox: {
    borderRadius: 10,
    padding: "13px 15px",
    fontSize: 14,
    lineHeight: 1.6,
    marginBottom: 14,
  },
  disclaimer: {
    fontSize: 12,
    color: "var(--gray)",
    borderTop: "1px solid var(--border)",
    paddingTop: 12,
    lineHeight: 1.6,
  },
}
