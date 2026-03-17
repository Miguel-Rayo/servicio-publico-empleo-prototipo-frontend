import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ScatterChart,
  Scatter, ZAxis
} from "recharts";
import { getBrecha } from "../api/vacantes";

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const COLORES = [
  "#1e40af","#1d4ed8","#2563eb","#3b82f6","#60a5fa",
  "#0369a1","#0284c7","#0891b2","#06b6d4","#67e8f9",
  "#0d9488","#0f766e","#115e59","#134e4a","#064e3b",
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

// ── Modal reutilizable ──────────────────────────────────────────
function Modal({ abierto, onCerrar, children }) {
  useEffect(() => {
    if (abierto) document.body.style.overflow = "hidden";
    else         document.body.style.overflow = "";
    return ()  => { document.body.style.overflow = ""; };
  }, [abierto]);

  if (!abierto) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onCerrar}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(15,23,42,0.7)",
          zIndex: 1000, display: "flex",
          alignItems: "center", justifyContent: "center",
          padding: "20px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{    opacity: 0, scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: "#ffffff", borderRadius: "16px",
            padding: "32px", maxWidth: "560px", width: "100%",
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

// ── Fila de métrica dentro del modal ───────────────────────────
function FilaMetrica({ label, valor, color = "#1e40af", max, unidad = "" }) {
  const pct = max ? Math.min((valor / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "13px", color: "#64748b" }}>{label}</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color }}>
          {typeof valor === "number" ? valor.toLocaleString("es-CO") : valor}{unidad}
        </span>
      </div>
      {max && (
        <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "99px" }}>
          <div style={{
            height: "100%", borderRadius: "99px", width: `${pct}%`,
            background: color, transition: "width 0.6s ease"
          }} />
        </div>
      )}
    </div>
  );
}

const CustomTooltipBarra = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: "#0f172a", borderRadius: "8px",
      padding: "12px 16px", fontSize: "12px", color: "#f8fafc",
      maxWidth: "240px"
    }}>
      <p style={{ margin: "0 0 8px", fontWeight: 700, lineHeight: 1.4 }}>{d.sector_economico}</p>
      <p style={{ margin: "2px 0", color: "#93c5fd" }}>
        Vacantes: <strong>{d.total_vacantes.toLocaleString("es-CO")}</strong>
      </p>
      <p style={{ margin: "2px 0", color: "#6ee7b7" }}>
        Plazas: <strong>{d.total_plazas.toLocaleString("es-CO")}</strong>
      </p>
      <p style={{ margin: "2px 0", color: "#fcd34d" }}>
        Departamentos: <strong>{d.departamentos}</strong>
      </p>
      <p style={{ margin: "2px 0", color: "#f9a8d4" }}>
        Exp. promedio: <strong>{d.experiencia_promedio} meses</strong>
      </p>
    </div>
  );
};

export default function Sectores() {
  const [datos,          setDatos]          = useState([]);
  const [cargando,       setCargando]       = useState(true);
  const [ordenarPor,     setOrdenarPor]     = useState("total_vacantes");
  const [sectorModal,    setSectorModal]    = useState(null);  // para scatter y exigencia

  useEffect(() => {
    getBrecha()
      .then(setDatos)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#94a3b8" }}>
      Cargando análisis sectorial...
    </div>
  );

  const datosOrdenados = [...datos].sort((a, b) => b[ordenarPor] - a[ordenarPor]);

  const brecha = [...datos]
    .filter(d => d.experiencia_promedio > 12)
    .sort((a, b) => b.experiencia_promedio - a.experiencia_promedio)
    .slice(0, 10);

  const maxVacantes  = datos[0]?.total_vacantes  || 1;
  const maxPlazas    = Math.max(...datos.map(d => d.total_plazas  || 0));
  const maxDepts     = Math.max(...datos.map(d => d.departamentos || 0));
  const maxExp       = Math.max(...datos.map(d => d.experiencia_promedio || 0));
  const expPromGlobal = datos.length
    ? Math.round(datos.reduce((s, d) => s + (d.experiencia_promedio || 0), 0) / datos.length)
    : 0;

  const totalSectores = datos.length;
  const sectorLider   = datos[0]?.sector_economico ?? "—";
  const totalPlazas   = datos.reduce((s, d) => s + (d.total_plazas || 0), 0);
  const maxCobertura  = [...datos].sort((a, b) => b.departamentos - a.departamentos)[0];

  const scatterData = datos.map(d => ({
    ...d,
    x: d.total_vacantes,
    y: d.departamentos,
    z: d.experiencia_promedio || 1,
  }));

  return (
    <motion.div initial="hidden" animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>

      {/* Encabezado */}
      <motion.div variants={fadeUp} style={{ marginBottom: "28px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
          Análisis Sectorial
        </h1>
        <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "14px" }}>
          Distribución de vacantes, plazas, cobertura geográfica y experiencia requerida por sector económico
        </p>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={fadeUp} style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "16px", marginBottom: "24px"
      }}>
        <KPIMini titulo="Sectores analizados"  valor={totalSectores}  color="#1e40af" />
        <KPIMini titulo="Total plazas"         valor={totalPlazas}    color="#0369a1" />
        <KPIMini
          titulo="Sector líder"
          valor={sectorLider.length > 20 ? sectorLider.slice(0, 20) + "…" : sectorLider}
          color="#0891b2"
        />
        <KPIMini titulo="Exp. promedio global" valor={`${expPromGlobal} meses`} color="#7c3aed" />
        <KPIMini
          titulo="Mayor cobertura"
          valor={maxCobertura?.sector_economico?.slice(0, 18) + "…"}
          sub={`${maxCobertura?.departamentos} departamentos`}
          color="#b45309"
        />
      </motion.div>

      {/* Barra principal */}
      <motion.div variants={fadeUp} style={{
        background: "#ffffff", borderRadius: "12px",
        padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        marginBottom: "24px"
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "20px",
          flexWrap: "wrap", gap: "12px"
        }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
            Top 20 Sectores Económicos
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { key: "total_vacantes", label: "Por vacantes"  },
              { key: "total_plazas",   label: "Por plazas"    },
              { key: "departamentos",  label: "Por cobertura" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setOrdenarPor(key)} style={{
                padding: "6px 14px", borderRadius: "6px", fontSize: "12px",
                fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                border:      ordenarPor === key ? "none" : "1px solid #e2e8f0",
                background:  ordenarPor === key ? "#1e40af" : "#f8fafc",
                color:       ordenarPor === key ? "#ffffff" : "#64748b",
              }}>{label}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart
            data={datosOrdenados} layout="vertical"
            margin={{ top: 0, right: 20, left: 180, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis
              type="category" dataKey="sector_economico"
              tick={{ fontSize: 11, fill: "#374151" }}
              width={175}
              tickFormatter={v => v.length > 28 ? v.slice(0, 28) + "…" : v}
            />
            <Tooltip content={<CustomTooltipBarra />} />
            <Bar dataKey={ordenarPor} radius={[0, 4, 4, 0]}>
              {datosOrdenados.map((_, i) => (
                <Cell key={i} fill={COLORES[i % COLORES.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Scatter + Sectores con mayor exigencia */}
      <motion.div variants={fadeUp} style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: "16px", marginBottom: "24px"
      }} className="grid-responsive">

        {/* Scatter mejorado */}
        <div style={{
          background: "#ffffff", borderRadius: "12px",
          padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
        }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
            Vacantes vs Cobertura Geográfica
          </p>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#94a3b8" }}>
            Cada punto es un sector · Tamaño = experiencia requerida · <strong style={{ color: "#1e40af" }}>Clic para ver detalle</strong>
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number" dataKey="x" name="Vacantes"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                label={{ value: "Vacantes →", position: "insideBottom", offset: -10, fontSize: 11, fill: "#94a3b8" }}
              />
              <YAxis
                type="number" dataKey="y" name="Departamentos"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                label={{ value: "Depts.", angle: -90, position: "insideLeft", fontSize: 11, fill: "#94a3b8" }}
              />
              <ZAxis type="number" dataKey="z" range={[40, 500]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{
                      background: "#0f172a", borderRadius: "8px",
                      padding: "10px 14px", fontSize: "12px",
                      color: "#f8fafc", maxWidth: "220px"
                    }}>
                      <p style={{ margin: "0 0 6px", fontWeight: 700, lineHeight: 1.4 }}>
                        {d.sector_economico}
                      </p>
                      <p style={{ margin: "2px 0", color: "#93c5fd" }}>
                        Vacantes: <strong>{d.total_vacantes.toLocaleString("es-CO")}</strong>
                      </p>
                      <p style={{ margin: "2px 0", color: "#6ee7b7" }}>
                        Departamentos: <strong>{d.departamentos}</strong>
                      </p>
                      <p style={{ margin: "2px 0", color: "#fcd34d" }}>
                        Exp. requerida: <strong>{d.experiencia_promedio} meses</strong>
                      </p>
                      <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: "11px" }}>
                        Clic para más detalles →
                      </p>
                    </div>
                  );
                }}
              />
              <Scatter
                data={scatterData}
                fill="#1e40af"
                fillOpacity={0.75}
                onClick={(d) => setSectorModal(d)}
                style={{ cursor: "pointer" }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Sectores con mayor exigencia */}
        <div style={{
          background: "#ffffff", borderRadius: "12px",
          padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
        }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
            Sectores con Mayor Exigencia
          </p>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#94a3b8" }}>
            Más de 12 meses de experiencia requerida · <strong style={{ color: "#7c3aed" }}>Clic para ver detalle</strong>
          </p>
          <div style={{ overflowY: "auto", maxHeight: "320px", paddingRight: "4px" }}>
            {brecha.map((d, i) => (
              <div
                key={d.sector_economico}
                onClick={() => setSectorModal(d)}
                style={{
                  marginBottom: "10px", padding: "12px 14px",
                  borderRadius: "8px", border: "1px solid #e2e8f0",
                  cursor: "pointer", transition: "all 0.15s",
                  background: "#f8fafc",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "#eff6ff";
                  e.currentTarget.style.borderColor = "#93c5fd";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "#f8fafc";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#374151", fontWeight: 600, lineHeight: 1.4, flex: 1 }}>
                    <span style={{
                      display: "inline-block", width: "20px", height: "20px",
                      borderRadius: "50%", background: COLORES[i % COLORES.length],
                      color: "#fff", fontSize: "10px", fontWeight: 700,
                      textAlign: "center", lineHeight: "20px", marginRight: "8px", flexShrink: 0
                    }}>{i + 1}</span>
                    {d.sector_economico}
                  </span>
                  <span style={{
                    fontSize: "12px", fontWeight: 800,
                    color: "#7c3aed", whiteSpace: "nowrap",
                    background: "#f3e8ff", padding: "2px 8px",
                    borderRadius: "99px"
                  }}>
                    {d.experiencia_promedio} meses
                  </span>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "6px" }}>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                    📋 {d.total_vacantes.toLocaleString("es-CO")} vacantes
                  </span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                    🗺️ {d.departamentos} departamentos
                  </span>
                </div>
                <div style={{ marginTop: "8px", height: "4px", background: "#e2e8f0", borderRadius: "99px" }}>
                  <div style={{
                    height: "100%", borderRadius: "99px",
                    width: `${Math.min((d.experiencia_promedio / maxExp) * 100, 100)}%`,
                    background: `linear-gradient(90deg, ${COLORES[i % COLORES.length]}, #a78bfa)`,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Modal de detalle de sector */}
      <Modal abierto={!!sectorModal} onCerrar={() => setSectorModal(null)}>
        {sectorModal && (
          <>
            {/* Header modal */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a", lineHeight: 1.4 }}>
                  {sectorModal.sector_economico}
                </h2>
                <button onClick={() => setSectorModal(null)} style={{
                  background: "#f1f5f9", border: "none", borderRadius: "8px",
                  width: "32px", height: "32px", cursor: "pointer",
                  fontSize: "16px", color: "#64748b", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>✕</button>
              </div>
              <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#94a3b8" }}>
                Detalle completo del sector económico
              </p>
            </div>

            {/* Métricas principales */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: "12px", marginBottom: "24px"
            }}>
              {[
                { label: "Total Vacantes",   valor: sectorModal.total_vacantes, color: "#1e40af", bg: "#eff6ff" },
                { label: "Total Plazas",     valor: sectorModal.total_plazas,   color: "#0369a1", bg: "#f0f9ff" },
                { label: "Departamentos",    valor: sectorModal.departamentos,  color: "#0891b2", bg: "#ecfeff" },
                { label: "Municipios",       valor: sectorModal.municipios,     color: "#0d9488", bg: "#f0fdfa" },
              ].map(({ label, valor, color, bg }) => (
                <div key={label} style={{
                  background: bg, borderRadius: "10px",
                  padding: "14px 16px", textAlign: "center"
                }}>
                  <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>{label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "22px", fontWeight: 800, color }}>
                    {(valor ?? 0).toLocaleString("es-CO")}
                  </p>
                </div>
              ))}
            </div>

            {/* Barras de contexto */}
            <div style={{
              background: "#f8fafc", borderRadius: "10px",
              padding: "16px", marginBottom: "16px"
            }}>
              <p style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                Comparación vs máximo del mercado
              </p>
              <FilaMetrica
                label="Vacantes"
                valor={sectorModal.total_vacantes}
                max={maxVacantes}
                color="#1e40af"
              />
              <FilaMetrica
                label="Plazas disponibles"
                valor={sectorModal.total_plazas}
                max={maxPlazas}
                color="#0369a1"
              />
              <FilaMetrica
                label="Cobertura departamental"
                valor={sectorModal.departamentos}
                max={maxDepts}
                color="#0891b2"
              />
              <FilaMetrica
                label="Experiencia requerida"
                valor={sectorModal.experiencia_promedio}
                max={maxExp}
                color="#7c3aed"
                unidad=" meses"
              />
            </div>

            {/* Comparación vs promedio global */}
            <div style={{
              background: "#fefce8", borderRadius: "10px",
              padding: "14px 16px", border: "1px solid #fde68a"
            }}>
              <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: 600, color: "#92400e" }}>
                📊 Contexto vs promedio global
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "#78350f", lineHeight: 1.6 }}>
                Este sector requiere{" "}
                <strong>{sectorModal.experiencia_promedio} meses</strong> de experiencia,{" "}
                {sectorModal.experiencia_promedio > expPromGlobal
                  ? `${sectorModal.experiencia_promedio - expPromGlobal} meses por encima`
                  : `${expPromGlobal - sectorModal.experiencia_promedio} meses por debajo`
                }{" "}del promedio global de <strong>{expPromGlobal} meses</strong>.{" "}
                Tiene presencia en <strong>{sectorModal.departamentos} departamentos</strong>{" "}
                con un total de <strong>{(sectorModal.total_plazas ?? 0).toLocaleString("es-CO")} plazas</strong> disponibles.
              </p>
            </div>
          </>
        )}
      </Modal>

    </motion.div>
  );
}