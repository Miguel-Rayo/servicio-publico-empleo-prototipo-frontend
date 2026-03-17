import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { getTopPrestadores } from "../api/vacantes";

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const COLORES = [
  "#1e40af","#1d4ed8","#2563eb","#3b82f6","#60a5fa",
  "#0369a1","#0284c7","#0891b2","#06b6d4","#0d9488",
  "#0f766e","#115e59","#134e4a","#1e3a8a","#312e81",
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

export default function Prestadores() {
  const [datos,      setDatos]      = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [modal,      setModal]      = useState(null);
  const [busqueda,   setBusqueda]   = useState("");
  const [ordenarPor, setOrdenarPor] = useState("total_vacantes");
  const [vista,      setVista]      = useState("barras"); // "barras" | "tarjetas"

  useEffect(() => {
    getTopPrestadores()
      .then(setDatos)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#94a3b8" }}>
      Cargando ranking de prestadores...
    </div>
  );

  // KPIs
  const totalPrestadores   = datos.length;
  const totalVacantes      = datos.reduce((s, d) => s + d.total_vacantes, 0);
  const totalPlazas        = datos.reduce((s, d) => s + (d.total_plazas || 0), 0);
  const maxCobertura       = [...datos].sort((a, b) => b.departamentos_cubiertos - a.departamentos_cubiertos)[0];
  const lider              = datos[0];

  // Filtrar y ordenar
  const datosFiltrados = [...datos]
    .filter(d => d.nombre_prestador?.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => b[ordenarPor] - a[ordenarPor]);

  const maxValor = datosFiltrados[0]?.[ordenarPor] || 1;

  // Datos para gráfica de barras (top 15)
  const datosGrafica = datosFiltrados.slice(0, 15).map(d => ({
    ...d,
    nombre_corto: d.nombre_prestador?.length > 25
      ? d.nombre_prestador.slice(0, 25) + "…"
      : d.nombre_prestador,
  }));

  return (
    <motion.div initial="hidden" animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>

      {/* Encabezado */}
      <motion.div variants={fadeUp} style={{ marginBottom: "28px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
          Ranking de Prestadores
        </h1>
        <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "14px" }}>
          Empresas y entidades con mayor volumen de vacantes publicadas en el Servicio Público de Empleo
        </p>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={fadeUp} style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "16px", marginBottom: "24px"
      }}>
        <KPIMini titulo="Prestadores top 20"   valor={totalPrestadores}  color="#1e40af" />
        <KPIMini titulo="Vacantes acumuladas"  valor={totalVacantes}     color="#0369a1" />
        <KPIMini titulo="Plazas acumuladas"    valor={totalPlazas}       color="#0891b2" />
        <KPIMini
          titulo="Mayor cobertura"
          valor={maxCobertura?.departamentos_cubiertos}
          sub={maxCobertura?.nombre_prestador?.slice(0, 22) + "…"}
          color="#7c3aed"
        />
        <KPIMini
          titulo="Líder en vacantes"
          valor={lider?.total_vacantes}
          sub={lider?.nombre_prestador?.slice(0, 22) + "…"}
          color="#b45309"
        />
      </motion.div>

      {/* Controles */}
      <motion.div variants={fadeUp} style={{
        background: "#ffffff", borderRadius: "12px",
        padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        marginBottom: "20px", display: "flex",
        gap: "12px", flexWrap: "wrap", alignItems: "center"
      }}>
        {/* Búsqueda */}
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar prestador..."
          style={{
            flex: 1, minWidth: "200px", padding: "8px 14px",
            borderRadius: "8px", border: "1px solid #e2e8f0",
            fontSize: "13px", color: "#374151", background: "#f8fafc",
            outline: "none"
          }}
        />

        {/* Ordenar */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { key: "total_vacantes",           label: "Vacantes"    },
            { key: "total_plazas",             label: "Plazas"      },
            { key: "departamentos_cubiertos",  label: "Cobertura"   },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setOrdenarPor(key)} style={{
              padding: "6px 14px", borderRadius: "6px", fontSize: "12px",
              fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
              border:     ordenarPor === key ? "none" : "1px solid #e2e8f0",
              background: ordenarPor === key ? "#1e40af" : "#f8fafc",
              color:      ordenarPor === key ? "#ffffff" : "#64748b",
            }}>{label}</button>
          ))}
        </div>

        {/* Vista */}
        <div style={{ display: "flex", gap: "4px" }}>
          {[
            { key: "barras",   label: "📊" },
            { key: "tarjetas", label: "🃏" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setVista(key)} style={{
              padding: "6px 12px", borderRadius: "6px", fontSize: "14px",
              cursor: "pointer", transition: "all 0.15s",
              border:     vista === key ? "none" : "1px solid #e2e8f0",
              background: vista === key ? "#0f172a" : "#f8fafc",
            }}>{label}</button>
          ))}
        </div>
      </motion.div>

      {/* Vista barras */}
      {vista === "barras" && (
        <motion.div variants={fadeUp} style={{
          background: "#ffffff", borderRadius: "12px",
          padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          marginBottom: "24px"
        }}>
          <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
            Top 15 Prestadores
          </p>
          <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#94a3b8" }}>
            <strong style={{ color: "#1e40af" }}>Clic en barra para ver detalle completo</strong>
          </p>
          <ResponsiveContainer width="100%" height={420}>
            <BarChart
              data={datosGrafica}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 200, bottom: 0 }}
              onClick={e => e?.activePayload && setModal(e.activePayload[0]?.payload)}
              style={{ cursor: "pointer" }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis
                type="category" dataKey="nombre_corto"
                tick={{ fontSize: 11, fill: "#374151" }}
                width={195}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{
                      background: "#0f172a", borderRadius: "8px",
                      padding: "12px 16px", fontSize: "12px",
                      color: "#f8fafc", maxWidth: "260px"
                    }}>
                      <p style={{ margin: "0 0 8px", fontWeight: 700, lineHeight: 1.4 }}>
                        {d.nombre_prestador}
                      </p>
                      <p style={{ margin: "2px 0", color: "#93c5fd" }}>
                        Vacantes: <strong>{d.total_vacantes.toLocaleString("es-CO")}</strong>
                      </p>
                      <p style={{ margin: "2px 0", color: "#6ee7b7" }}>
                        Plazas: <strong>{(d.total_plazas || 0).toLocaleString("es-CO")}</strong>
                      </p>
                      <p style={{ margin: "2px 0", color: "#fcd34d" }}>
                        Departamentos: <strong>{d.departamentos_cubiertos}</strong>
                      </p>
                      <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: "11px" }}>
                        Clic para ver detalle →
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey={ordenarPor} radius={[0, 4, 4, 0]}>
                {datosGrafica.map((_, i) => (
                  <Cell key={i} fill={COLORES[i % COLORES.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Vista tarjetas */}
      {vista === "tarjetas" && (
        <motion.div variants={fadeUp} style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "16px", marginBottom: "24px"
        }}>
          {datosFiltrados.map((d, i) => (
            <motion.div
              key={d.nombre_prestador}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setModal(d)}
              style={{
                background: "#ffffff", borderRadius: "12px",
                padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                cursor: "pointer", transition: "all 0.2s",
                borderLeft: `4px solid ${COLORES[i % COLORES.length]}`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(30,64,175,0.15)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Ranking badge */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <span style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: COLORES[i % COLORES.length],
                  color: "#fff", fontSize: "12px", fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0
                }}>#{i + 1}</span>
                <span style={{
                  fontSize: "11px", color: "#64748b",
                  background: "#f1f5f9", padding: "3px 8px",
                  borderRadius: "99px"
                }}>
                  {d.departamentos_cubiertos} depts.
                </span>
              </div>

              {/* Nombre */}
              <p style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 700, color: "#0f172a", lineHeight: 1.4 }}>
                {d.nombre_prestador}
              </p>

              {/* Métricas */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { label: "Vacantes",  valor: d.total_vacantes,          color: "#1e40af" },
                  { label: "Plazas",    valor: d.total_plazas || 0,       color: "#0369a1" },
                ].map(({ label, valor, color }) => (
                  <div key={label} style={{
                    background: "#f8fafc", borderRadius: "8px",
                    padding: "10px 12px", textAlign: "center"
                  }}>
                    <p style={{ margin: 0, fontSize: "10px", color: "#94a3b8" }}>{label}</p>
                    <p style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: 800, color }}>
                      {valor.toLocaleString("es-CO")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Barra de progreso relativa */}
              <div style={{ marginTop: "12px" }}>
                <div style={{ height: "4px", background: "#f1f5f9", borderRadius: "99px" }}>
                  <div style={{
                    height: "100%", borderRadius: "99px",
                    width: `${Math.round((d[ordenarPor] / maxValor) * 100)}%`,
                    background: COLORES[i % COLORES.length],
                    transition: "width 0.6s ease"
                  }} />
                </div>
                <p style={{ margin: "4px 0 0", fontSize: "10px", color: "#94a3b8", textAlign: "right" }}>
                  {Math.round((d[ordenarPor] / maxValor) * 100)}% del líder
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Sin resultados */}
      {datosFiltrados.length === 0 && (
        <motion.div variants={fadeUp} style={{
          background: "#ffffff", borderRadius: "12px", padding: "48px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          textAlign: "center", color: "#94a3b8"
        }}>
          <p style={{ fontSize: "32px", margin: "0 0 12px" }}>🔍</p>
          <p style={{ margin: 0, fontSize: "14px" }}>No se encontraron prestadores con ese nombre.</p>
        </motion.div>
      )}

      {/* Modal detalle prestador */}
      <Modal abierto={!!modal} onCerrar={() => setModal(null)}>
        {modal && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div style={{ flex: 1, paddingRight: "16px" }}>
                <p style={{ margin: "0 0 6px", fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                  Prestador del Servicio de Empleo
                </p>
                <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#0f172a", lineHeight: 1.4 }}>
                  {modal.nombre_prestador}
                </h2>
              </div>
              <button onClick={() => setModal(null)} style={{
                background: "#f1f5f9", border: "none", borderRadius: "8px",
                width: "32px", height: "32px", cursor: "pointer",
                fontSize: "16px", color: "#64748b", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>✕</button>
            </div>

            {/* Métricas en grid */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: "12px", marginBottom: "24px"
            }}>
              {[
                { label: "Total Vacantes",     valor: modal.total_vacantes,          color: "#1e40af", bg: "#eff6ff" },
                { label: "Total Plazas",       valor: modal.total_plazas || 0,       color: "#0369a1", bg: "#f0f9ff" },
                { label: "Depts. cubiertos",   valor: modal.departamentos_cubiertos, color: "#0891b2", bg: "#ecfeff" },
              ].map(({ label, valor, color, bg }) => (
                <div key={label} style={{
                  background: bg, borderRadius: "10px",
                  padding: "14px 16px", textAlign: "center"
                }}>
                  <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>{label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: 800, color }}>
                    {(valor ?? 0).toLocaleString("es-CO")}
                  </p>
                </div>
              ))}
            </div>

            {/* Comparación vs líder */}
            <div style={{
              background: "#f8fafc", borderRadius: "10px",
              padding: "16px", marginBottom: "16px"
            }}>
              <p style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                Comparación vs líder del ranking
              </p>
              {[
                { label: "Vacantes",      val: modal.total_vacantes,          max: lider?.total_vacantes,          color: "#1e40af" },
                { label: "Plazas",        val: modal.total_plazas || 0,       max: lider?.total_plazas || 1,       color: "#0369a1" },
                { label: "Departamentos", val: modal.departamentos_cubiertos, max: maxCobertura?.departamentos_cubiertos, color: "#0891b2" },
              ].map(({ label, val, max, color }) => {
                const pct = max > 0 ? Math.round((val / max) * 100) : 0;
                return (
                  <div key={label} style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{label}</span>
                      <span style={{ fontSize: "12px", fontWeight: 700, color }}>
                        {val.toLocaleString("es-CO")} <span style={{ color: "#94a3b8", fontWeight: 400 }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "99px" }}>
                      <div style={{
                        height: "100%", borderRadius: "99px",
                        width: `${pct}%`, background: color,
                        transition: "width 0.6s ease"
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Plazas por vacante */}
            <div style={{
              background: "#fefce8", borderRadius: "10px",
              padding: "14px 16px", border: "1px solid #fde68a"
            }}>
              <p style={{ margin: "0 0 4px", fontSize: "12px", fontWeight: 600, color: "#92400e" }}>
                📊 Eficiencia de contratación
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "#78350f", lineHeight: 1.6 }}>
                Promedio de{" "}
                <strong>
                  {modal.total_vacantes > 0
                    ? ((modal.total_plazas || 0) / modal.total_vacantes).toFixed(1)
                    : "0"} plazas por vacante
                </strong>{" "}
                — cubriendo{" "}
                <strong>{modal.departamentos_cubiertos} departamento{modal.departamentos_cubiertos !== 1 ? "s" : ""}</strong>{" "}
                del territorio nacional.
              </p>
            </div>
          </>
        )}
      </Modal>

    </motion.div>
  );
}