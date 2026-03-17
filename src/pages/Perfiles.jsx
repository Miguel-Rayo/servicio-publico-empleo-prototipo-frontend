import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
  ComposedChart, Line, Legend
} from "recharts";
import { getExperienciaVsEstudios } from "../api/vacantes";

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const ORDEN_EXPERIENCIA = [
  "Sin experiencia",
  "1-6 meses",
  "7-12 meses",
  "1-2 años",
  "2-5 años",
  "Más de 5 años",
];

const ORDEN_ESTUDIOS = [
  "Primaria",
  "Básica Secundaria",
  "Media",
  "No Aplica",
  "Otro",
  "Técnico",
  "Tecnólogico",
  "Universitarios",
  "Especilización",
];

const COLORES_ESTUDIOS = {
  "Primaria":          "#bfdbfe",
  "Básica Secundaria": "#93c5fd",
  "Media":             "#60a5fa",
  "No Aplica":         "#94a3b8",
  "Otro":              "#cbd5e1",
  "Técnico":           "#3b82f6",
  "Tecnólogico":       "#2563eb",
  "Universitarios":    "#1d4ed8",
  "Especilización":    "#1e40af",
};

const COLORES_EXP = [
  "#bfdbfe","#93c5fd","#60a5fa",
  "#3b82f6","#1d4ed8","#1e40af",
];

function KPIMini({ titulo, valor, sub, color = "#1e40af" }) {
  return (
    <div style={{
      background: "#ffffff", borderRadius: "12px", padding: "20px 24px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderTop: `3px solid ${color}`
    }}>
      <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{titulo}</p>
      <p style={{ margin: "6px 0 2px", fontSize: "24px", fontWeight: 800, color: "#0f172a" }}>
        {typeof valor === "number" ? valor.toLocaleString("es-CO") : valor ?? "—"}
      </p>
      {sub && <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>{sub}</p>}
    </div>
  );
}

function Modal({ abierto, onCerrar, children }) {
  useEffect(() => {
    if (abierto) document.body.style.overflow = "hidden";
    else         document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [abierto]);
  if (!abierto) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCerrar}
        style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)",
          zIndex: 1000, display: "flex", alignItems: "center",
          justifyContent: "center", padding: "20px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{    opacity: 0, scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: "#ffffff", borderRadius: "16px",
            padding: "32px", maxWidth: "580px", width: "100%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            maxHeight: "85vh", overflowY: "auto",
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Perfiles() {
  const [datos,       setDatos]       = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [modalData,   setModalData]   = useState(null);
  const [vistaActiva, setVistaActiva] = useState("estudios"); // "estudios" | "experiencia"

  useEffect(() => {
    getExperienciaVsEstudios()
      .then(setDatos)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#94a3b8" }}>
      Cargando análisis de perfiles...
    </div>
  );

  // ── Procesar datos ──────────────────────────────────────────
  // Agrupar por nivel de estudios
  const porEstudios = ORDEN_ESTUDIOS.map(nivel => {
    const filas  = datos.filter(d => d.nivel_estudios === nivel);
    const total  = filas.reduce((s, d) => s + d.total, 0);
    const expObj = {};
    ORDEN_EXPERIENCIA.forEach(exp => {
      const f = filas.find(d => d.rango_experiencia === exp);
      expObj[exp] = f?.total ?? 0;
    });
    return { nivel_estudios: nivel, total, ...expObj };
  }).filter(d => d.total > 0);

  // Agrupar por rango de experiencia
  const porExperiencia = ORDEN_EXPERIENCIA.map(exp => {
    const filas  = datos.filter(d => d.rango_experiencia === exp);
    const total  = filas.reduce((s, d) => s + d.total, 0);
    const estObj = {};
    ORDEN_ESTUDIOS.forEach(niv => {
      const f = filas.find(d => d.nivel_estudios === niv);
      estObj[niv] = f?.total ?? 0;
    });
    return { rango_experiencia: exp, total, ...estObj };
  }).filter(d => d.total > 0);

  // KPIs
  const totalVacantes   = datos.reduce((s, d) => s + d.total, 0);
  const sinExperiencia  = datos.filter(d => d.rango_experiencia === "Sin experiencia").reduce((s, d) => s + d.total, 0);
  const masDeUnAnio     = datos.filter(d => ["1-2 años","2-5 años","Más de 5 años"].includes(d.rango_experiencia)).reduce((s, d) => s + d.total, 0);
  const nivelTop        = porEstudios.reduce((max, d) => d.total > max.total ? d : max, { total: 0 });
  const expTop          = porExperiencia.reduce((max, d) => d.total > max.total ? d : max, { total: 0 });

  // Matriz cruzada para heatmap
  const matrizData = ORDEN_ESTUDIOS.map(nivel => {
    const obj = { nivel };
    ORDEN_EXPERIENCIA.forEach(exp => {
      const f = datos.find(d => d.nivel_estudios === nivel && d.rango_experiencia === exp);
      obj[exp] = f?.total ?? 0;
    });
    obj.total = ORDEN_EXPERIENCIA.reduce((s, exp) => s + (obj[exp] || 0), 0);
    return obj;
  }).filter(d => d.total > 0);

  const maxMatriz = Math.max(...matrizData.flatMap(row =>
    ORDEN_EXPERIENCIA.map(exp => row[exp] ?? 0)
  ));

  // Abrir modal por nivel de estudios
  const abrirModal = (nivel) => {
    const filas  = datos.filter(d => d.nivel_estudios === nivel);
    const total  = filas.reduce((s, d) => s + d.total, 0);
    const desglose = ORDEN_EXPERIENCIA.map(exp => {
      const f   = filas.find(d => d.rango_experiencia === exp);
      const val = f?.total ?? 0;
      return { exp, total: val, pct: total > 0 ? Math.round((val / total) * 100) : 0 };
    }).filter(d => d.total > 0);
    setModalData({ nivel, total, desglose });
  };

  return (
    <motion.div initial="hidden" animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>

      {/* Encabezado */}
      <motion.div variants={fadeUp} style={{ marginBottom: "28px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
          Perfiles Requeridos
        </h1>
        <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "14px" }}>
          Análisis cruzado de nivel de estudios y experiencia laboral exigida por el mercado
        </p>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={fadeUp} style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "16px", marginBottom: "24px"
      }}>
        <KPIMini titulo="Vacantes analizadas"  valor={totalVacantes}              color="#1e40af" />
        <KPIMini titulo="Sin experiencia"      valor={sinExperiencia}
          sub={`${((sinExperiencia/totalVacantes)*100).toFixed(1)}% del total`}   color="#0369a1" />
        <KPIMini titulo="Más de 1 año exp."    valor={masDeUnAnio}
          sub={`${((masDeUnAnio/totalVacantes)*100).toFixed(1)}% del total`}      color="#0891b2" />
        <KPIMini titulo="Nivel más demandado"  valor={nivelTop.nivel_estudios}
          sub={`${nivelTop.total?.toLocaleString("es-CO")} vacantes`}             color="#7c3aed" />
        <KPIMini titulo="Exp. más frecuente"   valor={expTop.rango_experiencia}
          sub={`${expTop.total?.toLocaleString("es-CO")} vacantes`}               color="#b45309" />
      </motion.div>

      {/* Selector de vista */}
      <motion.div variants={fadeUp} style={{
        display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap"
      }}>
        {[
          { key: "estudios",    label: "📚 Por Nivel de Estudios"  },
          { key: "experiencia", label: "⏱️ Por Experiencia"        },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setVistaActiva(key)} style={{
            padding: "8px 18px", borderRadius: "8px", fontSize: "13px",
            fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
            border:     vistaActiva === key ? "none" : "1px solid #e2e8f0",
            background: vistaActiva === key ? "#1e40af" : "#ffffff",
            color:      vistaActiva === key ? "#ffffff" : "#64748b",
          }}>{label}</button>
        ))}
      </motion.div>

      {/* Gráfica principal según vista */}
      <motion.div variants={fadeUp} style={{
        background: "#ffffff", borderRadius: "12px",
        padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        marginBottom: "24px"
      }}>
        {vistaActiva === "estudios" ? (
          <>
            <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
              Vacantes por Nivel de Estudios
            </p>
            <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#94a3b8" }}>
              Desglosado por rango de experiencia requerida ·{" "}
              <strong style={{ color: "#1e40af" }}>Clic en barra para detalle</strong>
            </p>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={porEstudios}
                margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
                onClick={e => e?.activePayload && abrirModal(e.activePayload[0]?.payload?.nivel_estudios)}
                style={{ cursor: "pointer" }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="nivel_estudios"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  angle={-30} textAnchor="end" interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                  formatter={v => v.toLocaleString("es-CO")}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "16px" }} />
                {ORDEN_EXPERIENCIA.map((exp, i) => (
                  <Bar key={exp} dataKey={exp} stackId="a"
                    fill={COLORES_EXP[i]} radius={i === ORDEN_EXPERIENCIA.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </>
        ) : (
          <>
            <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
              Vacantes por Rango de Experiencia
            </p>
            <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#94a3b8" }}>
              Desglosado por nivel de estudios requerido
            </p>
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart
                data={porExperiencia}
                margin={{ top: 5, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="rango_experiencia" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                  formatter={v => v.toLocaleString("es-CO")}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                {ORDEN_ESTUDIOS.map((niv, i) => (
                  <Bar key={niv} yAxisId="left" dataKey={niv} stackId="b"
                    fill={COLORES_ESTUDIOS[niv]}
                    radius={i === ORDEN_ESTUDIOS.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
                <Line
                  yAxisId="right" type="monotone" dataKey="total"
                  stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: "#f59e0b" }}
                  name="Total" legendType="line"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </>
        )}
      </motion.div>

      {/* Matriz cruzada estudios × experiencia */}
      <motion.div variants={fadeUp} style={{
        background: "#ffffff", borderRadius: "12px",
        padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        marginBottom: "24px"
      }}>
        <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
          Matriz Cruzada: Estudios × Experiencia
        </p>
        <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#94a3b8" }}>
          Intensidad de color = volumen de vacantes ·{" "}
          <strong style={{ color: "#1e40af" }}>Clic en celda para detalle</strong>
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "3px", fontSize: "11px" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 8px", color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>
                  Nivel de Estudios
                </th>
                {ORDEN_EXPERIENCIA.map(exp => (
                  <th key={exp} style={{
                    padding: "6px 8px", color: "#64748b", fontWeight: 600,
                    textAlign: "center", whiteSpace: "nowrap", fontSize: "10px"
                  }}>
                    {exp}
                  </th>
                ))}
                <th style={{ padding: "6px 8px", color: "#1e40af", fontWeight: 700, textAlign: "center" }}>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {matrizData.map(row => (
                <tr key={row.nivel}>
                  <td style={{ padding: "6px 8px", fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>
                    {row.nivel}
                  </td>
                  {ORDEN_EXPERIENCIA.map(exp => {
                    const val  = row[exp] ?? 0;
                    const int  = maxMatriz > 0 ? val / maxMatriz : 0;
                    const bg   = int > 0 ? `rgba(30, 64, 175, ${0.08 + int * 0.88})` : "#f8fafc";
                    const col  = int > 0.45 ? "#ffffff" : "#374151";
                    return (
                      <td key={exp}
                        onClick={() => val > 0 && abrirModal(row.nivel)}
                        style={{
                          padding: "8px", textAlign: "center",
                          background: bg, color: col,
                          borderRadius: "6px", fontWeight: val > 0 ? 600 : 400,
                          cursor: val > 0 ? "pointer" : "default",
                          transition: "opacity 0.15s",
                        }}
                        onMouseEnter={e => { if (val > 0) e.currentTarget.style.opacity = "0.8"; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                      >
                        {val > 0 ? val.toLocaleString("es-CO") : "—"}
                      </td>
                    );
                  })}
                  <td style={{
                    padding: "8px", textAlign: "center",
                    background: "#eff6ff", color: "#1e40af",
                    borderRadius: "6px", fontWeight: 700
                  }}>
                    {row.total.toLocaleString("es-CO")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal detalle por nivel */}
      <Modal abierto={!!modalData} onCerrar={() => setModalData(null)}>
        {modalData && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                  Nivel de estudios
                </p>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                  {modalData.nivel}
                </h2>
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#64748b" }}>
                  {modalData.total.toLocaleString("es-CO")} vacantes en total
                </p>
              </div>
              <button onClick={() => setModalData(null)} style={{
                background: "#f1f5f9", border: "none", borderRadius: "8px",
                width: "32px", height: "32px", cursor: "pointer",
                fontSize: "16px", color: "#64748b",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>✕</button>
            </div>

            <p style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 600, color: "#374151" }}>
              Desglose por experiencia requerida
            </p>

            {modalData.desglose.map((d, i) => (
              <div key={d.exp} style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{d.exp}</span>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>{d.pct}%</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: COLORES_EXP[i % COLORES_EXP.length] }}>
                      {d.total.toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
                <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "99px" }}>
                  <div style={{
                    height: "100%", borderRadius: "99px",
                    width: `${d.pct}%`,
                    background: COLORES_EXP[i % COLORES_EXP.length],
                    transition: "width 0.6s ease"
                  }} />
                </div>
              </div>
            ))}

            <div style={{
              marginTop: "20px", background: "#f0f9ff", borderRadius: "10px",
              padding: "14px 16px", border: "1px solid #bae6fd"
            }}>
              <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 600, color: "#0369a1" }}>
                💡 Insight
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "#0c4a6e", lineHeight: 1.6 }}>
                {(() => {
                  const sinExp = modalData.desglose.find(d => d.exp === "Sin experiencia");
                  const masExp = modalData.desglose.find(d => ["2-5 años","Más de 5 años"].includes(d.exp));
                  if (sinExp && sinExp.pct > 40)
                    return `El ${sinExp.pct}% de las vacantes para ${modalData.nivel} no requieren experiencia previa — perfil accesible para recién egresados.`;
                  if (masExp && masExp.pct > 30)
                    return `El ${masExp.pct}% de las vacantes para ${modalData.nivel} exigen más de 2 años de experiencia — mercado exigente para este nivel.`;
                  return `Las vacantes para ${modalData.nivel} tienen una distribución balanceada de experiencia requerida.`;
                })()}
              </p>
            </div>
          </>
        )}
      </Modal>

    </motion.div>
  );
}