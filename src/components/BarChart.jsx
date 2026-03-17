// gráfica de barras reutilizable

// src/components/BarChart.jsx
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

export default function BarChart({ datos, keyX, keyY = "total", titulo, color = "#1e40af" }) {
  return (
    <div style={{
      background: "#ffffff", borderRadius: "12px",
      padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.1)"
    }}>
      {titulo && (
        <p style={{ margin: "0 0 16px", fontWeight: 600, fontSize: "15px", color: "#111827" }}>
          {titulo}
        </p>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <ReBarChart data={datos} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey={keyX}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
          <Tooltip
            contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
            formatter={(v) => [v.toLocaleString("es-CO"), "Vacantes"]}
          />
          <Bar dataKey={keyY} fill={color} radius={[4, 4, 0, 0]} />
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}