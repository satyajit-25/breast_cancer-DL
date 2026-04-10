export default function GradCam({ originalImg, gradcamImg, method }) {
  if (!originalImg && !gradcamImg) return null

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>🧠 Attention Heatmap — Where the model looked</h3>

      {method === "saliency" && (
        <div style={styles.infoBox}>
          ℹ️ Showing gradient saliency map — shows which pixels most
          influenced the prediction.
        </div>
      )}

      <p style={styles.caption}>
        <span style={{ color: "var(--red)", fontWeight: 600 }}>
          🔴 Red / warm
        </span>
        {" "}= high attention &nbsp;|&nbsp;
        <span style={{ color: "var(--blue)", fontWeight: 600 }}>
          🔵 Blue / cool
        </span>
        {" "}= low attention
      </p>

      {/* Side-by-side images */}
      <div style={styles.grid}>
        {originalImg && (
          <div style={styles.panel}>
            <p style={styles.panelLabel}>Original scan</p>
            <img src={originalImg} alt="Original" style={styles.img} />
          </div>
        )}
        {gradcamImg && (
          <div style={styles.panel}>
            <p style={styles.panelLabel}>Attention overlay</p>
            <img src={gradcamImg} alt="Grad-CAM" style={styles.img} />
          </div>
        )}
      </div>

      {/* Colour scale legend */}
      <div style={styles.legend}>
        <span style={styles.legendText}>Low</span>
        <div style={styles.legendBar} />
        <span style={styles.legendText}>High attention</span>
      </div>

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
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 6,
  },
  infoBox: {
    background: "#fff8e1",
    border: "1px solid #ffe082",
    borderRadius: 8,
    padding: "10px 13px",
    fontSize: 13,
    color: "#e65100",
    marginBottom: 12,
  },
  caption: {
    fontSize: 13,
    color: "var(--gray)",
    marginBottom: 16,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 14,
  },
  panel: { textAlign: "center" },
  panelLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--gray)",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    marginBottom: 6,
  },
  img: {
    width: "100%",
    borderRadius: 8,
    border: "1px solid var(--border)",
    display: "block",
  },
  legend: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
  },
  legendBar: {
    width: 140, height: 8,
    borderRadius: 4,
    background: "linear-gradient(to right,#00008b,#0000ff,#00ffff,#00ff00,#ffff00,#ff7f00,#ff0000)",
  },
  legendText: {
    fontSize: 11,
    color: "var(--gray)",
  },
}
