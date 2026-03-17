import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from "recharts";
import { getInclusion } from "../api/vacantes";

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const COLORES = [
  "#1e40af","#1d4ed8","#2563eb","#3b82f6","#60a5fa",
  "#0369a1","#0284c7","#0891b2","#06b6d4","#0d9488",
  "#0f766e","#115e59","#134e4a","#1e3a8a","#312e81",
];

const COLORES_PIE = ["#1e40af","#0891b2","#0d9488","#7c3aed","#b45309","#94a3b8"];

function KPICard({ titulo, valor, sub, color, icon, pct }) {
  return (
    <div style={{
      background: "#ffffff", borderRadius: "12px", padding: "24px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderTop: `4px solid ${color}`,
      display: "flex", flexDirection: "column", gap: "8px"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{titulo}</p>
        <span style={{ fontSize: "22px" }}>{icon}</span>
      </div>
      <p style={{ margin: 0, fontSize: "30px", fontWeight: 800, color: "#0f172a" }}>
        {typeof valor === "number" ? valor.toLocaleString("es-CO") : valor ?? "—"}
      </p>
      {sub && <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>{sub}</p>}
      {pct !== undefined && (
        <div>
          <div style={{ height: "4px", background: "#f1f5f9", borderRadius: "99px" }}>
            <div style={{
              height: "100%", borderRadius: "99px",
              width: `${Math.min(pct, 100)}%`, background: color,
              transition: "width 0.8s ease"
            }} />
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "11px", color, fontWeight: 600 }}>
            {pct}% del total de vacantes
          </p>
        </div>
      )}
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
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
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

export default function Inclusion() {
  const [datos,    setDatos]    = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modal,    setModal]    = useState(null);

  useEffect(() => {
    getInclusion()
      .then(setDatos)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#94a3b8" }}>
      Cargando análisis de inclusión...
    </div>
  );

  const totales    = datos?.totales ?? {};
  const total      = totales.total ?? 1;
  const discDep    = datos?.discapacidad_por_departamento ?? [];
  const teleRsector = datos?.teletrabajo_por_sector ?? [];
  const discEst    = datos?.discapacidad_por_estudios ?? [];

  const pctDisc    = ((totales.vacantes_discapacidad / total) * 100).toFixed(1);
  const pctTele    = ((totales.vacantes_teletrabajo  / total) * 100).toFixed(1);
  const pctPractica = ((totales.plazas_practica      / total) * 100).toFixed(1);

  // Datos pie para distribución inclusión
  const pieData = [
    { name: "Discapacidad",    value: totales.vacantes_discapacidad ?? 0 },
    { name: "Teletrabajo",     value: totales.vacantes_teletrabajo  ?? 0 },
    { name: "Plaza práctica",  value: totales.plazas_practica       ?? 0 },
    { name: "Hidrocarburos",   value: totales.vacantes_hidrocarburos ?? 0 },
  ].filter(d => d.value > 0);

  const maxDisc = discDep[0]?.total || 1;
  const maxTele = teleRsector[0]?.total || 1;

  return (
    <motion.div initial="hidden" animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>

      {/* Encabezado */}
      <motion.div variants={fadeUp} style={{ marginBottom: "28px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
          Inclusión Laboral
        </h1>
        <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "14px" }}>
          Vacantes orientadas a población vulnerable, teletrabajo, prácticas y sectores estratégicos
        </p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={fadeUp} style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px", marginBottom: "24px"
      }}>
        <KPICard
          titulo="Vacantes para Discapacidad"
          valor={totales.vacantes_discapacidad}
          sub="Inclusión de personas en situación de discapacidad"
          color="#1e40af" icon="♿"
          pct={parseFloat(pctDisc)}
        />
        <KPICard
          titulo="Vacantes con Teletrabajo"
          valor={totales.vacantes_teletrabajo}
          sub="Modalidad de trabajo remoto"
          color="#0891b2" icon="🏠"
          pct={parseFloat(pctTele)}
        />
        <KPICard
          titulo="Plazas de Práctica"
          valor={totales.plazas_practica}
          sub="Oportunidades para practicantes"
          color="#7c3aed" icon="🎓"
          pct={parseFloat(pctPractica)}
        />
        <KPICard
          titulo="Sector Hidrocarburos"
          valor={totales.vacantes_hidrocarburos}
          sub="Vacantes en sector energético"
          color="#b45309" icon="⚡"
          pct={parseFloat(((totales.vacantes_hidrocarburos / total) * 100).toFixed(1))}
        />
      </motion.div>

      {/* Pie + contexto */}
      <motion.div variants={fadeUp} style={{
        display: "grid", gridTemplateColumns: "1fr 1.5fr",
        gap: "16px", marginBottom: "24px"
      }} className="grid-responsive">

        {/* Pie chart */}
        <div style={{
          background: "#ffffff", borderRadius: "12px",
          padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
        }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
            Distribución de Vacantes Inclusivas
          </p>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#94a3b8" }}>
            Proporción de cada categoría de inclusión
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%" cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""}
                labelLine={false}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORES_PIE[i % COLORES_PIE.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, name) => [v.toLocaleString("es-CO") + " vacantes", name]}
                contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
            {pieData.map((d, i) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                <span style={{
                  width: "10px", height: "10px", borderRadius: "50%",
                  background: COLORES_PIE[i], flexShrink: 0
                }} />
                <span style={{ color: "#374151", flex: 1 }}>{d.name}</span>
                <span style={{ color: "#64748b", fontWeight: 600 }}>
                  {d.value.toLocaleString("es-CO")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de contexto e insight */}
        <div style={{
          background: "#ffffff", borderRadius: "12px",
          padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
        }}>
          <p style={{ margin: "0 0 16px", fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
            Análisis de Brecha de Inclusión
          </p>

          {[
            {
              titulo:   "Discapacidad",
              valor:    totales.vacantes_discapacidad ?? 0,
              total,
              color:    "#1e40af",
              bg:       "#eff6ff",
              insight:  `Solo el ${pctDisc}% de las vacantes están orientadas a personas en situación de discapacidad. Existe una brecha significativa de inclusión laboral que requiere atención institucional.`,
              icono:    "♿"
            },
            {
              titulo:   "Teletrabajo",
              valor:    totales.vacantes_teletrabajo ?? 0,
              total,
              color:    "#0891b2",
              bg:       "#ecfeff",
              insight:  `El ${pctTele}% de las vacantes ofrecen modalidad remota. Esta cifra refleja la adopción de nuevas formas de trabajo post-pandemia en el mercado laboral colombiano.`,
              icono:    "🏠"
            },
            {
              titulo:   "Prácticas Laborales",
              valor:    totales.plazas_practica ?? 0,
              total,
              color:    "#7c3aed",
              bg:       "#f5f3ff",
              insight:  `El ${pctPractica}% corresponde a plazas de práctica. Son la puerta de entrada al mercado laboral para estudiantes y recién egresados.`,
              icono:    "🎓"
            },
          ].map(({ titulo, valor, color, bg, insight, icono }) => (
            <div key={titulo} style={{
              background: bg, borderRadius: "10px",
              padding: "14px 16px", marginBottom: "12px",
              borderLeft: `3px solid ${color}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                  {icono} {titulo}
                </span>
                <span style={{ fontSize: "13px", fontWeight: 800, color }}>
                  {valor.toLocaleString("es-CO")}
                </span>
              </div>
              <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#475569", lineHeight: 1.5 }}>
                {insight}
              </p>
              <div style={{ height: "4px", background: "rgba(0,0,0,0.08)", borderRadius: "99px" }}>
                <div style={{
                  height: "100%", borderRadius: "99px",
                  width: `${Math.min((valor / total) * 100 * 20, 100)}%`,
                  background: color, transition: "width 0.8s ease"
                }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Discapacidad por departamento + Teletrabajo por sector */}
      <motion.div variants={fadeUp} style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: "16px", marginBottom: "24px"
      }} className="grid-responsive">

        {/* Discapacidad por departamento */}
        <div style={{
          background: "#ffffff", borderRadius: "12px",
          padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
        }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
            Discapacidad por Departamento
          </p>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#94a3b8" }}>
            Top 15 · <strong style={{ color: "#1e40af" }}>Clic para detalle</strong>
          </p>
          <div style={{ overflowY: "auto", maxHeight: "340px" }}>
            {discDep.map((d, i) => (
              <div
                key={d.departamento}
                onClick={() => setModal({ tipo: "discapacidad_dep", data: d })}
                style={{
                  marginBottom: "10px", padding: "10px 12px",
                  borderRadius: "8px", border: "1px solid #e2e8f0",
                  cursor: "pointer", background: "#f8fafc",
                  transition: "all 0.15s"
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
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>
                    <span style={{ color: "#94a3b8", marginRight: "6px" }}>#{i + 1}</span>
                    {d.departamento}
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#1e40af" }}>
                    {d.total.toLocaleString("es-CO")}
                  </span>
                </div>
                <div style={{ height: "4px", background: "#e2e8f0", borderRadius: "99px" }}>
                  <div style={{
                    height: "100%", borderRadius: "99px",
                    width: `${Math.round((d.total / maxDisc) * 100)}%`,
                    background: `linear-gradient(90deg, #1e40af, #60a5fa)`,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Teletrabajo por sector */}
        <div style={{
          background: "#ffffff", borderRadius: "12px",
          padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
        }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
            Teletrabajo por Sector
          </p>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#94a3b8" }}>
            Top 10 sectores con más vacantes remotas
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={teleRsector}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 160, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis
                type="category" dataKey="sector_economico"
                tick={{ fontSize: 10, fill: "#374151" }}
                width={155}
                tickFormatter={v => v?.length > 22 ? v.slice(0, 22) + "…" : v}
              />
              <Tooltip
                contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                formatter={v => [v.toLocaleString("es-CO"), "Vacantes remotas"]}
                labelFormatter={v => v}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {teleRsector.map((_, i) => (
                  <Cell key={i} fill={COLORES[i % COLORES.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Discapacidad por nivel de estudios */}
      <motion.div variants={fadeUp} style={{
        background: "#ffffff", borderRadius: "12px",
        padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
      }}>
        <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
          Vacantes de Discapacidad por Nivel de Estudios
        </p>
        <p style={{ margin: "0 0 20px", fontSize: "12px", color: "#94a3b8" }}>
          Perfil educativo requerido en vacantes inclusivas para personas en situación de discapacidad
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={discEst} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="nivel_estudios"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              angle={-20} textAnchor="end" interval={0}
            />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip
              contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
              formatter={v => [v.toLocaleString("es-CO"), "Vacantes"]}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {discEst.map((_, i) => (
                <Cell key={i} fill={COLORES[i % COLORES.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Modal */}
      <Modal abierto={!!modal} onCerrar={() => setModal(null)}>
        {modal?.tipo === "discapacidad_dep" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#94a3b8" }}>
                  Vacantes para Discapacidad
                </p>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                  {modal.data.departamento}
                </h2>
              </div>
              <button onClick={() => setModal(null)} style={{
                background: "#f1f5f9", border: "none", borderRadius: "8px",
                width: "32px", height: "32px", cursor: "pointer",
                fontSize: "16px", color: "#64748b",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>✕</button>
            </div>

            <div style={{
              background: "#eff6ff", borderRadius: "12px",
              padding: "20px", textAlign: "center", marginBottom: "20px"
            }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                Total vacantes para discapacidad
              </p>
              <p style={{ margin: "8px 0 0", fontSize: "48px", fontWeight: 800, color: "#1e40af" }}>
                {modal.data.total.toLocaleString("es-CO")}
              </p>
            </div>

            <div style={{
              background: "#f8fafc", borderRadius: "10px", padding: "16px"
            }}>
              <p style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                Posición en el ranking nacional
              </p>
              <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "99px" }}>
                <div style={{
                  height: "100%", borderRadius: "99px",
                  width: `${Math.round((modal.data.total / maxDisc) * 100)}%`,
                  background: "linear-gradient(90deg, #1e40af, #60a5fa)",
                  transition: "width 0.8s ease"
                }} />
              </div>
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#64748b" }}>
                {Math.round((modal.data.total / maxDisc) * 100)}% respecto al departamento líder
              </p>
            </div>

            <div style={{
              marginTop: "16px", background: "#fefce8", borderRadius: "10px",
              padding: "14px 16px", border: "1px solid #fde68a"
            }}>
              <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 600, color: "#92400e" }}>
                💡 Contexto
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "#78350f", lineHeight: 1.6 }}>
                {modal.data.departamento} representa el{" "}
                <strong>{((modal.data.total / (totales.vacantes_discapacidad || 1)) * 100).toFixed(1)}%</strong>{" "}
                del total nacional de vacantes orientadas a personas en situación de discapacidad
                ({(totales.vacantes_discapacidad ?? 0).toLocaleString("es-CO")} vacantes).
              </p>
            </div>
          </>
        )}
      </Modal>

    </motion.div>
  );
}