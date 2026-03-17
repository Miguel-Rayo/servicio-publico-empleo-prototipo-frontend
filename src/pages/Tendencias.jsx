import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";
import { getTendenciaDiaria } from "../api/vacantes";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function KPIMini({ titulo, valor, color = "#1e40af" }) {
  return (
    <div style={{
      background: "#ffffff", borderRadius: "12px", padding: "20px 24px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderTop: `3px solid ${color}`
    }}>
      <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{titulo}</p>
      <p style={{ margin: "6px 0 0", fontSize: "26px", fontWeight: 800, color: "#0f172a" }}>
        {typeof valor === "number" ? valor.toLocaleString("es-CO") : valor ?? "—"}
      </p>
    </div>
  );
}

export default function Tendencias() {
  const [datos,    setDatos]    = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getTendenciaDiaria()
      .then(setDatos)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#94a3b8" }}>
      Cargando tendencias...
    </div>
  );

  // Enriquecer datos con fecha formateada
  const datosFormateados = datos.map(d => ({
    ...d,
    fechaCorta: format(parseISO(d.fecha), "d MMM", { locale: es }),
    fechaLarga: format(parseISO(d.fecha), "d 'de' MMMM yyyy", { locale: es }),
  }));

  // KPIs derivados
  const totalPeriodo  = datos.reduce((s, d) => s + d.total, 0);
  const totalPlazas   = datos.reduce((s, d) => s + (d.plazas || 0), 0);
  const promDiario    = datos.length ? Math.round(totalPeriodo / datos.length) : 0;
  const maxDia        = datos.reduce((max, d) => d.total > max.total ? d : max, { total: 0 });
  const maxFecha      = maxDia.fecha
    ? format(parseISO(maxDia.fecha), "d MMM", { locale: es })
    : "—";

  // Agrupar por semana para el bar chart
  const porSemana = [];
  for (let i = 0; i < datosFormateados.length; i += 7) {
    const semana = datosFormateados.slice(i, i + 7);
    porSemana.push({
      semana: `Sem ${Math.floor(i / 7) + 1}`,
      vacantes: semana.reduce((s, d) => s + d.total, 0),
      plazas:   semana.reduce((s, d) => s + (d.plazas || 0), 0),
    });
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = datosFormateados.find(x => x.fechaCorta === label);
    return (
      <div style={{
        background: "#0f172a", borderRadius: "8px",
        padding: "10px 14px", fontSize: "12px", color: "#f8fafc"
      }}>
        <p style={{ margin: "0 0 6px", fontWeight: 600 }}>{d?.fechaLarga ?? label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ margin: "2px 0", color: p.color }}>
            {p.name}: <strong>{p.value.toLocaleString("es-CO")}</strong>
          </p>
        ))}
      </div>
    );
  };

  return (
    <motion.div initial="hidden" animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>

      {/* Encabezado */}
      <motion.div variants={fadeUp} style={{ marginBottom: "28px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
          Tendencias de Publicación
        </h1>
        <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "14px" }}>
          Evolución diaria de vacantes publicadas en los últimos 60 días
        </p>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={fadeUp} style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "16px", marginBottom: "24px"
      }}>
        <KPIMini titulo="Vacantes en el período"  valor={totalPeriodo}  color="#1e40af" />
        <KPIMini titulo="Plazas en el período"    valor={totalPlazas}   color="#0369a1" />
        <KPIMini titulo="Promedio diario"         valor={promDiario}    color="#0891b2" />
        <KPIMini titulo="Día más activo"          valor={maxFecha}      color="#7c3aed" />
        <KPIMini titulo="Pico de vacantes"        valor={maxDia.total}  color="#b45309" />
      </motion.div>

      {/* Área chart principal */}
      <motion.div variants={fadeUp} style={{
        background: "#ffffff", borderRadius: "12px",
        padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        marginBottom: "24px"
      }}>
        <p style={{ margin: "0 0 20px", fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
          Vacantes y Plazas por Día
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={datosFormateados} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
            <defs>
              <linearGradient id="gradVacantes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#1e40af" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1e40af" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="gradPlazas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#0891b2" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0891b2" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="fechaCorta"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              angle={-35} textAnchor="end" interval={3}
            />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
            <Area
              type="monotone" dataKey="total" name="Vacantes"
              stroke="#1e40af" strokeWidth={2}
              fill="url(#gradVacantes)"
            />
            <Area
              type="monotone" dataKey="plazas" name="Plazas"
              stroke="#0891b2" strokeWidth={2}
              fill="url(#gradPlazas)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Bar chart semanal */}
      <motion.div variants={fadeUp} style={{
        background: "#ffffff", borderRadius: "12px",
        padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
      }}>
        <p style={{ margin: "0 0 20px", fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
          Resumen Semanal
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={porSemana} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="semana" tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip
              contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
              formatter={v => v.toLocaleString("es-CO")}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey="vacantes" name="Vacantes" fill="#1e40af" radius={[4, 4, 0, 0]} />
            <Bar dataKey="plazas"   name="Plazas"   fill="#93c5fd" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

    </motion.div>
  );
}