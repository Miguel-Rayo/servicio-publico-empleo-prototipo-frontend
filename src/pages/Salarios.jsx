// src/pages/Salarios.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { getPorSalario, getSalarioPorDep } from "../api/vacantes";

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const ORDEN_SALARIOS = [
  "$884.251 - $1.000.000",
  "$1.000.001 - $1.500.000",
  "$1.500.001 - $2.000.000",
  "$2.000.001 - $3.000.000",
  "$3.000.001 - $4.000.000",
  "$4.000.001 - $6.000.000",
  "$6.000.001 - $8.000.000",
  "A Convenir",
];

const ETIQUETAS = {
  "$884.251 - $1.000.000":   "< $1M",
  "$1.000.001 - $1.500.000": "$1M–$1.5M",
  "$1.500.001 - $2.000.000": "$1.5M–$2M",
  "$2.000.001 - $3.000.000": "$2M–$3M",
  "$3.000.001 - $4.000.000": "$3M–$4M",
  "$4.000.001 - $6.000.000": "$4M–$6M",
  "$6.000.001 - $8.000.000": "$6M–$8M",
  "A Convenir":              "A Convenir",
};

const COLORES_SALARIO = {
  "$884.251 - $1.000.000":   "#bfdbfe",
  "$1.000.001 - $1.500.000": "#93c5fd",
  "$1.500.001 - $2.000.000": "#60a5fa",
  "$2.000.001 - $3.000.000": "#3b82f6",
  "$3.000.001 - $4.000.000": "#2563eb",
  "$4.000.001 - $6.000.000": "#1d4ed8",
  "$6.000.001 - $8.000.000": "#1e40af",
  "A Convenir":              "#94a3b8",
};

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
            padding: "32px", maxWidth: "600px", width: "100%",
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

export default function Salarios() {
  const [global,      setGlobal]      = useState([]);
  const [porDep,      setPorDep]      = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [depModal,    setDepModal]    = useState(null);
  const [depFiltro,   setDepFiltro]   = useState("");
  const [depFiltroB,  setDepFiltroB]  = useState("");

  useEffect(() => {
    Promise.all([getPorSalario(), getSalarioPorDep()])
      .then(([g, d]) => { setGlobal(g); setPorDep(d); })
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#94a3b8" }}>
      Cargando análisis salarial...
    </div>
  );

  const globalOrdenado = [...global].sort((a, b) =>
    ORDEN_SALARIOS.indexOf(a.rango_salarial) - ORDEN_SALARIOS.indexOf(b.rango_salarial)
  );

  const totalVacantes     = global.reduce((s, d) => s + d.total, 0);
  const rangoMasFrecuente = globalOrdenado.reduce((max, d) => d.total > max.total ? d : max, { total: 0 });
  const convieneCount     = global.find(d => d.rango_salarial === "A Convenir")?.total ?? 0;
  const pctConviene       = totalVacantes ? ((convieneCount / totalVacantes) * 100).toFixed(1) : 0;
  const altaSalarial      = global
    .filter(d => ["$3.000.001 - $4.000.000","$4.000.001 - $6.000.000","$6.000.001 - $8.000.000"].includes(d.rango_salarial))
    .reduce((s, d) => s + d.total, 0);

  const departamentos = [...new Set(porDep.map(d => d.departamento))].sort();

  const abrirModalDep = (dep) => {
    const filas = porDep.filter(d => d.departamento === dep);
    const total = filas.reduce((s, d) => s + d.total, 0);
    const ordenadas = ORDEN_SALARIOS
      .map(rango => {
        const encontrado = filas.find(f => f.rango_salarial === rango);
        return {
          rango,
          etiqueta: ETIQUETAS[rango],
          total: encontrado?.total ?? 0,
          pct: encontrado ? Math.round((encontrado.total / total) * 100) : 0,
        };
      })
      .filter(d => d.total > 0);
    setDepModal({ departamento: dep, filas: ordenadas, total });
  };

  const topDeps = departamentos
    .map(dep => {
      const filas = porDep.filter(d => d.departamento === dep);
      const total = filas.reduce((s, d) => s + d.total, 0);
      return { dep, total };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 12)
    .map(d => d.dep);

  const heatmapData = topDeps.map(dep => {
    const filas = porDep.filter(d => d.departamento === dep);
    const total = filas.reduce((s, d) => s + d.total, 0);
    const obj   = { departamento: dep.length > 12 ? dep.slice(0, 12) + "…" : dep, depCompleto: dep, total };
    ORDEN_SALARIOS.forEach(r => {
      const f = filas.find(d => d.rango_salarial === r);
      obj[ETIQUETAS[r]] = f?.total ?? 0;
    });
    return obj;
  });

  const radarData = ORDEN_SALARIOS.filter(r => r !== "A Convenir").map(rango => {
    const etiq = ETIQUETAS[rango];
    const obj  = { rango: etiq };
    if (depFiltro)  obj[depFiltro]  = porDep.find(d => d.departamento === depFiltro  && d.rango_salarial === rango)?.total ?? 0;
    if (depFiltroB) obj[depFiltroB] = porDep.find(d => d.departamento === depFiltroB && d.rango_salarial === rango)?.total ?? 0;
    return obj;
  });

  return (
    <motion.div initial="hidden" animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>

      {/* Encabezado */}
      <motion.div variants={fadeUp} style={{ marginBottom: "28px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
          Análisis Salarial
        </h1>
        <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "14px" }}>
          Distribución de rangos salariales a nivel nacional y por departamento
        </p>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={fadeUp} style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "16px", marginBottom: "24px"
      }}>
        <KPIMini titulo="Total vacantes"      valor={totalVacantes}  color="#1e40af" />
        <KPIMini
          titulo="Rango más frecuente"
          valor={ETIQUETAS[rangoMasFrecuente.rango_salarial] ?? "—"}
          sub={`${rangoMasFrecuente.total?.toLocaleString("es-CO")} vacantes`}
          color="#0369a1"
        />
        <KPIMini
          titulo="Salario alto (+$3M)"
          valor={altaSalarial}
          sub={`${((altaSalarial / totalVacantes) * 100).toFixed(1)}% del total`}
          color="#0891b2"
        />
        <KPIMini
          titulo="A Convenir"
          valor={convieneCount}
          sub={`${pctConviene}% sin rango definido`}
          color="#94a3b8"
        />
      </motion.div>

      {/* Distribución global */}
      <motion.div variants={fadeUp} style={{
        background: "#ffffff", borderRadius: "12px",
        padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        marginBottom: "24px"
      }}>
        <p style={{ margin: "0 0 20px", fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
          Distribución Nacional por Rango Salarial
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={globalOrdenado} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="rango_salarial"
              tickFormatter={v => ETIQUETAS[v] ?? v}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              angle={-30} textAnchor="end" interval={0}
            />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip
              formatter={(v, _, props) => [
                v.toLocaleString("es-CO") + " vacantes",
                ETIQUETAS[props.payload.rango_salarial] ?? props.payload.rango_salarial,
              ]}
              contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {globalOrdenado.map((d, i) => (
                <Cell key={i} fill={COLORES_SALARIO[d.rango_salarial] ?? "#94a3b8"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Heatmap + Radar */}
      <motion.div variants={fadeUp} style={{
        display: "grid", gridTemplateColumns: "1.2fr 1fr",
        gap: "16px", marginBottom: "24px"
      }} className="grid-responsive">

        {/* Heatmap */}
        <div style={{
          background: "#ffffff", borderRadius: "12px",
          padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
        }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
            Estructura Salarial por Departamento
          </p>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#94a3b8" }}>
            Top 12 departamentos · <strong style={{ color: "#1e40af" }}>Clic en fila para detalle</strong>
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "6px 8px", color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>
                    Departamento
                  </th>
                  {ORDEN_SALARIOS.filter(r => r !== "A Convenir").map(r => (
                    <th key={r} style={{ padding: "6px 4px", color: "#64748b", fontWeight: 600, textAlign: "center", whiteSpace: "nowrap" }}>
                      {ETIQUETAS[r]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row) => {
                  const maxFila = Math.max(...ORDEN_SALARIOS.filter(r => r !== "A Convenir").map(r => row[ETIQUETAS[r]] ?? 0));
                  return (
                    <tr key={row.departamento}
                      onClick={() => abrirModalDep(row.depCompleto)}
                      style={{ cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "6px 8px", fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>
                        {row.departamento}
                      </td>
                      {ORDEN_SALARIOS.filter(r => r !== "A Convenir").map(r => {
                        const val   = row[ETIQUETAS[r]] ?? 0;
                        const int   = maxFila > 0 ? val / maxFila : 0;
                        const bg    = int > 0 ? `rgba(30, 64, 175, ${0.1 + int * 0.85})` : "#f8fafc";
                        const color = int > 0.5 ? "#ffffff" : "#374151";
                        return (
                          <td key={r} style={{
                            padding: "6px 4px", textAlign: "center",
                            background: bg, color,
                            borderRadius: "4px", fontWeight: val > 0 ? 600 : 400,
                          }}>
                            {val > 0 ? val.toLocaleString("es-CO") : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Radar comparativo */}
        <div style={{
          background: "#ffffff", borderRadius: "12px",
          padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
        }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
            Comparativa Salarial entre Departamentos
          </p>
          <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#94a3b8" }}>
            Selecciona dos departamentos para comparar su perfil salarial
          </p>

          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "120px" }}>
              <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#1e40af", fontWeight: 600 }}>
                🔵 Departamento A
              </p>
              <select
                value={depFiltro}
                onChange={e => setDepFiltro(e.target.value)}
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: "8px",
                  border: "1px solid #bfdbfe", fontSize: "12px",
                  color: "#374151", background: "#eff6ff"
                }}
              >
                <option value="">Selecciona...</option>
                {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: "120px" }}>
              <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#0891b2", fontWeight: 600 }}>
                🟦 Departamento B
              </p>
              <select
                value={depFiltroB}
                onChange={e => setDepFiltroB(e.target.value)}
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: "8px",
                  border: "1px solid #a5f3fc", fontSize: "12px",
                  color: "#374151", background: "#ecfeff"
                }}
              >
                <option value="">Selecciona...</option>
                {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {!depFiltro && !depFiltroB ? (
            <div style={{
              height: "260px", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              color: "#94a3b8", fontSize: "13px", gap: "8px"
            }}>
              <span style={{ fontSize: "32px" }}>🗺️</span>
              <p style={{ margin: 0 }}>Selecciona al menos un departamento</p>
              <p style={{ margin: 0, fontSize: "11px" }}>para visualizar su perfil salarial</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="rango" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <PolarRadiusAxis tick={{ fontSize: 9, fill: "#94a3b8" }} />
                  {depFiltro && (
                    <Radar
                      name={depFiltro}
                      dataKey={depFiltro}
                      stroke="#1e40af" fill="#1e40af" fillOpacity={0.3}
                    />
                  )}
                  {depFiltroB && (
                    <Radar
                      name={depFiltroB}
                      dataKey={depFiltroB}
                      stroke="#0891b2" fill="#0891b2" fillOpacity={0.2}
                    />
                  )}
                  <Tooltip
                    formatter={v => v.toLocaleString("es-CO")}
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: "16px", justifyContent: "center", fontSize: "11px", marginTop: "8px" }}>
                {depFiltro && (
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "12px", height: "12px", borderRadius: "2px", background: "#1e40af", display: "inline-block" }} />
                    {depFiltro.length > 15 ? depFiltro.slice(0, 15) + "…" : depFiltro}
                  </span>
                )}
                {depFiltroB && (
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "12px", height: "12px", borderRadius: "2px", background: "#0891b2", display: "inline-block" }} />
                    {depFiltroB.length > 15 ? depFiltroB.slice(0, 15) + "…" : depFiltroB}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Modal detalle departamento */}
      <Modal abierto={!!depModal} onCerrar={() => setDepModal(null)}>
        {depModal && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                  {depModal.departamento}
                </h2>
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#94a3b8" }}>
                  {depModal.total.toLocaleString("es-CO")} vacantes con rango salarial definido
                </p>
              </div>
              <button onClick={() => setDepModal(null)} style={{
                background: "#f1f5f9", border: "none", borderRadius: "8px",
                width: "32px", height: "32px", cursor: "pointer",
                fontSize: "16px", color: "#64748b",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>✕</button>
            </div>
            {depModal.filas.map(f => (
              <div key={f.rango} style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{f.rango}</span>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>{f.pct}%</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: COLORES_SALARIO[f.rango] ?? "#1e40af" }}>
                      {f.total.toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
                <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "99px" }}>
                  <div style={{
                    height: "100%", borderRadius: "99px",
                    width: `${f.pct}%`,
                    background: COLORES_SALARIO[f.rango] ?? "#1e40af",
                    transition: "width 0.6s ease"
                  }} />
                </div>
              </div>
            ))}
          </>
        )}
      </Modal>

    </motion.div>
  );
}