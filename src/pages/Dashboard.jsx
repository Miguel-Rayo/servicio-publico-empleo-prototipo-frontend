import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getResumen, getPorDepartamento } from "../api/vacantes";
import MapaColombia from "../components/MapaColombia";
import KPICard      from "../components/KPICard";
import BarChart     from "../components/BarChart";

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Dashboard() {
  const [resumen,           setResumen]           = useState(null);
  const [departamentos,     setDepartamentos]     = useState([]);
  const [depSeleccionado,   setDepSeleccionado]   = useState(null);
  const [cargando,          setCargando]          = useState(true);

  useEffect(() => {
    Promise.all([getResumen(), getPorDepartamento()])
      .then(([res, dep]) => {
        setResumen(res);
        setDepartamentos(dep);
      })
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "60vh", fontSize: "14px", color: "#94a3b8"
    }}>
      Cargando resumen nacional...
    </div>
  );

  const depData = depSeleccionado
    ? departamentos.filter(d => d.departamento === depSeleccionado)
    : departamentos.slice(0, 15);

  return (
    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>

      {/* Encabezado */}
      <motion.div variants={fadeUp} style={{ marginBottom: "28px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
          Resumen Nacional
        </h1>
        <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "14px" }}>
          Panorama general del mercado laboral colombiano · Datos del Servicio Público de Empleo
        </p>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={fadeUp} style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "16px", marginBottom: "24px"
      }}>
        <KPICard titulo="Total Vacantes"    valor={resumen?.total_vacantes}  subtitulo="Registros activos"       color="#1e40af" />
        <KPICard titulo="Total Plazas"      valor={resumen?.total_plazas}    subtitulo="Puestos disponibles"     color="#0369a1" />
        <KPICard titulo="Con Teletrabajo"   valor={resumen?.con_teletrabajo} subtitulo="Modalidad remota"        color="#0891b2" />
        <KPICard titulo="Para Discapacidad" valor={resumen?.para_discapacidad} subtitulo="Inclusión laboral"     color="#0d9488" />
        <KPICard
          titulo="Departamentos"
          valor={departamentos.length}
          subtitulo="Con vacantes activas"
          color="#7c3aed"
        />
        <KPICard
          titulo="Promedio Plazas"
          valor={resumen?.total_vacantes
            ? Math.round(resumen.total_plazas / resumen.total_vacantes)
            : 0}
          subtitulo="Plazas por vacante"
          color="#b45309"
        />
      </motion.div>

      {/* Mapa + Top departamentos */}
      <motion.div variants={fadeUp} style={{
        display: "grid", gridTemplateColumns: "1.4fr 1fr",
        gap: "16px", marginBottom: "24px"
      }}>

        {/* Mapa */}
        <div style={{
          background: "#ffffff", borderRadius: "12px",
          padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
        }}>
          <div style={{ marginBottom: "16px" }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
              Distribución Geográfica de Vacantes
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>
              {depSeleccionado
                ? `Mostrando: ${depSeleccionado}`
                : "Haz clic en un departamento para filtrar"}
            </p>
          </div>
          <MapaColombia
            datos={departamentos}
            onSelectDepartamento={setDepSeleccionado}
          />
        </div>

        {/* Ranking departamentos */}
        <div style={{
          background: "#ffffff", borderRadius: "12px",
          padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          overflowY: "auto", maxHeight: "600px"
        }}>
          <p style={{ margin: "0 0 16px", fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
            {depSeleccionado ? `📍 ${depSeleccionado}` : "🏆 Top Departamentos"}
          </p>

          {depSeleccionado && (
            <button onClick={() => setDepSeleccionado(null)} style={{
              marginBottom: "16px", padding: "6px 12px",
              borderRadius: "6px", border: "1px solid #e2e8f0",
              background: "#f8fafc", color: "#64748b",
              cursor: "pointer", fontSize: "12px"
            }}>
              ← Ver todos
            </button>
          )}

          {(depSeleccionado ? depData : departamentos.slice(0, 15)).map((d, i) => {
            const max   = departamentos[0]?.total || 1;
            const pct   = Math.round((d.total / max) * 100);
            return (
              <div key={d.departamento} style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12px", color: "#374151", fontWeight: 500 }}>
                    {!depSeleccionado && <span style={{ color: "#94a3b8", marginRight: "6px" }}>#{i + 1}</span>}
                    {d.departamento}
                  </span>
                  <span style={{ fontSize: "12px", color: "#1e40af", fontWeight: 700 }}>
                    {d.total.toLocaleString("es-CO")}
                  </span>
                </div>
                <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "99px" }}>
                  <div style={{
                    height: "100%", borderRadius: "99px",
                    width: `${pct}%`,
                    background: "linear-gradient(90deg, #1e40af, #3b82f6)",
                    transition: "width 0.6s ease"
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Barra inferior: top 15 en gráfica */}
      <motion.div variants={fadeUp}>
        <BarChart
          datos={departamentos.slice(0, 15)}
          keyX="departamento"
          titulo="Top 15 Departamentos — Volumen de Vacantes"
          color="#1e40af"
        />
      </motion.div>

    </motion.div>
  );
}