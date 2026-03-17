// gráfica de torta reutilizable

// src/components/PieChart.jsx
import {
  PieChart as RePieChart, Pie, Cell,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

const COLORES = ["#1e40af","#3b82f6","#60a5fa","#93c5fd","#bfdbfe","#1e3a5f","#374151","#6b7280"];

export default function PieChart({ datos, keyName, keyValue = "total", titulo }) {
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
        <RePieChart>
          <Pie
            data={datos}
            dataKey={keyValue}
            nameKey={keyName}
            cx="50%" cy="50%"
            outerRadius={100}
            label={({ name, percent }) =>
              `${(percent * 100).toFixed(0)}%`
            }
          >
            {datos?.map((_, i) => (
              <Cell key={i} fill={COLORES[i % COLORES.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => [v.toLocaleString("es-CO"), "Vacantes"]}
            contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
          />
          <Legend
            iconType="circle"
            iconSize={10}
            wrapperStyle={{ fontSize: "12px" }}
          />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}