// tarjetas de métricas

// src/components/KPICard.jsx
export default function KPICard({ titulo, valor, subtitulo, color = "#1e40af" }) {
  return (
    <div style={{
      background:   "#ffffff",
      borderRadius: "12px",
      padding:      "24px",
      boxShadow:    "0 1px 4px rgba(0,0,0,0.1)",
      borderTop:    `4px solid ${color}`,
      flex:         "1",
      minWidth:     "180px",
    }}>
      <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
        {titulo}
      </p>
      <p style={{ margin: "8px 0 4px", fontSize: "32px", fontWeight: 700, color: "#111827" }}>
        {valor?.toLocaleString("es-CO") ?? "—"}
      </p>
      {subtitulo && (
        <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>
          {subtitulo}
        </p>
      )}
    </div>
  );
}