import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { getListado, getPorDepartamento } from "../api/vacantes";

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const NIVELES   = ["Básica Secundaria","Media","Técnico","Tecnólogico","Universitarios","Especilización","Primaria","No Aplica","Otro"];
const CONTRATOS = ["Término fijo","Término indefinido","Por obra o labor","Prestación de servicios","Otra"];
const SALARIOS  = ["$884.251 - $1.000.000","$1.000.001 - $1.500.000","$1.500.001 - $2.000.000","$2.000.001 - $3.000.000","$3.000.001 - $4.000.000","$4.000.001 - $6.000.000","$6.000.001 - $8.000.000","A Convenir"];

const FILTROS_INICIALES = {
  departamento:   "",
  nivel_estudios: "",
  tipo_contrato:  "",
  rango_salarial: "",
};

const LIMIT = 25;

function Badge({ label, onRemove, color = "#1e40af" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      background: "#eff6ff", color, border: `1px solid #bfdbfe`,
      borderRadius: "99px", padding: "4px 10px", fontSize: "12px", fontWeight: 500
    }}>
      {label}
      <button onClick={onRemove} style={{
        background: "none", border: "none", cursor: "pointer",
        color, fontSize: "14px", lineHeight: 1, padding: 0
      }}>×</button>
    </span>
  );
}

export default function Explorador() {
  const [data,          setData]          = useState([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [cargando,      setCargando]      = useState(false);
  const [filtros,       setFiltros]       = useState(FILTROS_INICIALES);
  const [departamentos, setDepartamentos] = useState([]);
  const [detalle,       setDetalle]       = useState(null);
  const [exportando,    setExportando]    = useState(false);

  // Cargar departamentos para el select
  useEffect(() => {
    getPorDepartamento().then(setDepartamentos);
  }, []);

  // Cargar vacantes
  const cargar = useCallback(() => {
    setCargando(true);
    const params = { page, limit: LIMIT };
    Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
    getListado(params)
      .then(res => { setData(res.data); setTotal(res.total); })
      .finally(() => setCargando(false));
  }, [filtros, page]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleFiltro = (campo, valor) => {
    setFiltros(f => ({ ...f, [campo]: valor }));
    setPage(1);
  };

  const limpiarFiltro = (campo) => {
    setFiltros(f => ({ ...f, [campo]: "" }));
    setPage(1);
  };

  const limpiarTodo = () => {
    setFiltros(FILTROS_INICIALES);
    setPage(1);
  };

  const totalPaginas   = Math.ceil(total / LIMIT);
  const filtrosActivos = Object.entries(filtros).filter(([, v]) => v);

  // Exportar CSV
  const exportarCSV = async () => {
    setExportando(true);
    try {
      const params = { page: 1, limit: 1000 };
      Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await getListado(params);

      const cabeceras = [
        "Código","Cargo","Título","Departamento","Municipio",
        "Rango Salarial","Tipo Contrato","Nivel Estudios",
        "Cantidad Vacantes","Fecha Publicación","Fecha Vencimiento"
      ];

      const filas = res.data.map(v => [
        v.codigo_vacante,
        `"${(v.cargo ?? "").replace(/"/g, "'")}"`,
        `"${(v.titulo_vacante ?? "").replace(/"/g, "'")}"`,
        `"${(v.departamento ?? "").replace(/"/g, "'")}"`,
        `"${(v.municipio ?? "").replace(/"/g, "'")}"`,
        `"${(v.rango_salarial ?? "").replace(/"/g, "'")}"`,
        `"${(v.tipo_contrato ?? "").replace(/"/g, "'")}"`,
        `"${(v.nivel_estudios ?? "").replace(/"/g, "'")}"`,
        v.cantidad_vacantes ?? 0,
        v.fecha_publicacion ? new Date(v.fecha_publicacion).toLocaleDateString("es-CO") : "",
        v.fecha_vencimiento ? new Date(v.fecha_vencimiento).toLocaleDateString("es-CO") : "",
      ].join(","));

      const csv     = [cabeceras.join(","), ...filas].join("\n");
      const blob    = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url     = URL.createObjectURL(blob);
      const link    = document.createElement("a");
      link.href     = url;
      link.download = `vacantes_${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportando(false);
    }
  };

  const selectStyle = {
    padding: "8px 12px", borderRadius: "8px", fontSize: "13px",
    border: "1px solid #e2e8f0", background: "#f8fafc",
    color: "#374151", cursor: "pointer",
  };

  return (
    <motion.div initial="hidden" animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>

      {/* Encabezado */}
      <motion.div variants={fadeUp} style={{ marginBottom: "28px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
          Explorador de Vacantes
        </h1>
        <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "14px" }}>
          Navega, filtra y exporta el catálogo completo de vacantes activas
        </p>
      </motion.div>

      {/* Panel de filtros */}
      <motion.div variants={fadeUp} style={{
        background: "#ffffff", borderRadius: "12px",
        padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        marginBottom: "16px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>
            🔽 Filtros
          </p>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              {total.toLocaleString("es-CO")} resultados
            </span>
            <button
              onClick={exportarCSV}
              disabled={exportando}
              style={{
                padding: "7px 16px", borderRadius: "8px", fontSize: "12px",
                fontWeight: 600, cursor: exportando ? "wait" : "pointer",
                border: "none",
                background: exportando ? "#94a3b8" : "#0f172a",
                color: "#ffffff", display: "flex", alignItems: "center", gap: "6px",
                transition: "background 0.15s"
              }}
            >
              {exportando ? "⏳ Exportando..." : "⬇️ Exportar CSV"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          <select style={selectStyle} value={filtros.departamento}
            onChange={e => handleFiltro("departamento", e.target.value)}>
            <option value="">Todos los departamentos</option>
            {departamentos.map(d => (
              <option key={d.departamento} value={d.departamento}>{d.departamento}</option>
            ))}
          </select>

          <select style={selectStyle} value={filtros.nivel_estudios}
            onChange={e => handleFiltro("nivel_estudios", e.target.value)}>
            <option value="">Todos los niveles</option>
            {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>

          <select style={selectStyle} value={filtros.tipo_contrato}
            onChange={e => handleFiltro("tipo_contrato", e.target.value)}>
            <option value="">Todos los contratos</option>
            {CONTRATOS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select style={selectStyle} value={filtros.rango_salarial}
            onChange={e => handleFiltro("rango_salarial", e.target.value)}>
            <option value="">Todos los salarios</option>
            {SALARIOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Badges de filtros activos */}
        {filtrosActivos.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "14px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>Activos:</span>
            {filtrosActivos.map(([campo, valor]) => (
              <Badge key={campo} label={valor} onRemove={() => limpiarFiltro(campo)} />
            ))}
            <button onClick={limpiarTodo} style={{
              padding: "4px 12px", borderRadius: "99px", fontSize: "12px",
              border: "1px solid #fca5a5", background: "#fef2f2",
              color: "#dc2626", cursor: "pointer", fontWeight: 500
            }}>
              Limpiar todo
            </button>
          </div>
        )}
      </motion.div>

      {/* Tabla */}
      <motion.div variants={fadeUp} style={{
        background: "#ffffff", borderRadius: "12px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden"
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                {["Cargo","Departamento","Municipio","Salario","Contrato","Estudios","Plazas","Publicación"].map(h => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left",
                    fontWeight: 700, color: "#374151",
                    whiteSpace: "nowrap", fontSize: "12px",
                    letterSpacing: "0.03em"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>⏳</div>
                    Cargando vacantes...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔍</div>
                    No hay vacantes con los filtros seleccionados.
                  </td>
                </tr>
              ) : data.map((v, i) => (
                <tr
                  key={v.codigo_vacante}
                  onClick={() => setDetalle(v)}
                  style={{
                    background:  i % 2 === 0 ? "#ffffff" : "#fafafa",
                    borderBottom: "1px solid #f1f5f9",
                    cursor: "pointer", transition: "background 0.12s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#ffffff" : "#fafafa"}
                >
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a", maxWidth: "200px" }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {v.cargo}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", fontWeight: 400 }}>
                      {v.codigo_vacante}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#374151", whiteSpace: "nowrap" }}>{v.departamento}</td>
                  <td style={{ padding: "12px 16px", color: "#374151", whiteSpace: "nowrap" }}>{v.municipio}</td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    <span style={{
                      background: "#eff6ff", color: "#1e40af",
                      padding: "3px 8px", borderRadius: "99px",
                      fontSize: "11px", fontWeight: 600
                    }}>
                      {v.rango_salarial}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#374151", whiteSpace: "nowrap" }}>{v.tipo_contrato}</td>
                  <td style={{ padding: "12px 16px", color: "#374151", whiteSpace: "nowrap" }}>{v.nivel_estudios}</td>
                  <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 700, color: "#0f172a" }}>
                    {v.cantidad_vacantes}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#94a3b8", whiteSpace: "nowrap", fontSize: "12px" }}>
                    {v.fecha_publicacion
                      ? new Date(v.fecha_publicacion).toLocaleDateString("es-CO")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px", borderTop: "1px solid #f1f5f9",
            flexWrap: "wrap", gap: "12px"
          }}>
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              Mostrando {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} de{" "}
              <strong>{total.toLocaleString("es-CO")}</strong> vacantes
            </span>

            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button onClick={() => setPage(1)} disabled={page === 1}
                style={{
                  padding: "6px 10px", borderRadius: "6px", fontSize: "12px",
                  border: "1px solid #e2e8f0", cursor: page === 1 ? "default" : "pointer",
                  background: page === 1 ? "#f3f4f6" : "#ffffff",
                  color: page === 1 ? "#9ca3af" : "#374151"
                }}>«</button>

              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{
                  padding: "6px 14px", borderRadius: "6px", fontSize: "12px",
                  border: "1px solid #e2e8f0", cursor: page === 1 ? "default" : "pointer",
                  background: page === 1 ? "#f3f4f6" : "#ffffff",
                  color: page === 1 ? "#9ca3af" : "#374151"
                }}>← Anterior</button>

              {/* Páginas numéricas */}
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                let p;
                if (totalPaginas <= 5) p = i + 1;
                else if (page <= 3)    p = i + 1;
                else if (page >= totalPaginas - 2) p = totalPaginas - 4 + i;
                else p = page - 2 + i;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{
                      padding: "6px 12px", borderRadius: "6px", fontSize: "12px",
                      border: p === page ? "none" : "1px solid #e2e8f0",
                      cursor: "pointer",
                      background: p === page ? "#1e40af" : "#ffffff",
                      color:      p === page ? "#ffffff" : "#374151",
                      fontWeight: p === page ? 700 : 400,
                    }}>{p}</button>
                );
              })}

              <button onClick={() => setPage(p => Math.min(totalPaginas, p + 1))} disabled={page === totalPaginas}
                style={{
                  padding: "6px 14px", borderRadius: "6px", fontSize: "12px",
                  border: "1px solid #e2e8f0",
                  cursor: page === totalPaginas ? "default" : "pointer",
                  background: page === totalPaginas ? "#f3f4f6" : "#ffffff",
                  color: page === totalPaginas ? "#9ca3af" : "#374151"
                }}>Siguiente →</button>

              <button onClick={() => setPage(totalPaginas)} disabled={page === totalPaginas}
                style={{
                  padding: "6px 10px", borderRadius: "6px", fontSize: "12px",
                  border: "1px solid #e2e8f0",
                  cursor: page === totalPaginas ? "default" : "pointer",
                  background: page === totalPaginas ? "#f3f4f6" : "#ffffff",
                  color: page === totalPaginas ? "#9ca3af" : "#374151"
                }}>»</button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modal detalle vacante */}
      {detalle && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => setDetalle(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.7)",
            zIndex: 1000, display: "flex", alignItems: "center",
            justifyContent: "center", padding: "20px"
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: "#ffffff", borderRadius: "16px",
              padding: "32px", maxWidth: "640px", width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              maxHeight: "85vh", overflowY: "auto"
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div style={{ flex: 1, paddingRight: "16px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#94a3b8" }}>
                  {detalle.codigo_vacante}
                </p>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a", lineHeight: 1.4 }}>
                  {detalle.cargo}
                </h2>
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#64748b" }}>
                  {detalle.municipio}, {detalle.departamento}
                </p>
              </div>
              <button onClick={() => setDetalle(null)} style={{
                background: "#f1f5f9", border: "none", borderRadius: "8px",
                width: "32px", height: "32px", cursor: "pointer",
                fontSize: "16px", color: "#64748b", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>✕</button>
            </div>

            {/* Tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
              {[
                { label: detalle.rango_salarial,   bg: "#eff6ff", color: "#1e40af"  },
                { label: detalle.tipo_contrato,    bg: "#f0fdf4", color: "#15803d"  },
                { label: detalle.nivel_estudios,   bg: "#fdf4ff", color: "#7e22ce"  },
                { label: `${detalle.cantidad_vacantes} plaza${detalle.cantidad_vacantes !== 1 ? "s" : ""}`, bg: "#fff7ed", color: "#c2410c" },
              ].filter(t => t.label).map(({ label, bg, color }) => (
                <span key={label} style={{
                  background: bg, color, padding: "4px 12px",
                  borderRadius: "99px", fontSize: "12px", fontWeight: 600
                }}>{label}</span>
              ))}
            </div>

            {/* Fechas */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: "12px", marginBottom: "20px"
            }}>
              {[
                { label: "📅 Publicación",  val: detalle.fecha_publicacion },
                { label: "⏰ Vencimiento",  val: detalle.fecha_vencimiento },
              ].map(({ label, val }) => (
                <div key={label} style={{
                  background: "#f8fafc", borderRadius: "8px", padding: "12px 14px"
                }}>
                  <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>{label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "14px", fontWeight: 700, color: "#374151" }}>
                    {val ? new Date(val).toLocaleDateString("es-CO", { dateStyle: "long" }) : "—"}
                  </p>
                </div>
              ))}
            </div>

            {/* Días restantes */}
            {detalle.fecha_vencimiento && (() => {
              const dias = Math.ceil((new Date(detalle.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24));
              const color = dias < 7 ? "#dc2626" : dias < 30 ? "#d97706" : "#16a34a";
              const bg    = dias < 7 ? "#fef2f2" : dias < 30 ? "#fffbeb" : "#f0fdf4";
              return dias > 0 ? (
                <div style={{
                  background: bg, borderRadius: "8px", padding: "10px 14px",
                  marginBottom: "20px", textAlign: "center"
                }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color }}>
                    ⏱️ {dias} día{dias !== 1 ? "s" : ""} restante{dias !== 1 ? "s" : ""} para aplicar
                  </p>
                </div>
              ) : (
                <div style={{
                  background: "#fef2f2", borderRadius: "8px", padding: "10px 14px",
                  marginBottom: "20px", textAlign: "center"
                }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#dc2626" }}>
                    ⚠️ Esta vacante ha vencido
                  </p>
                </div>
              );
            })()}

            {/* Título vacante si es diferente al cargo */}
            {detalle.titulo_vacante && detalle.titulo_vacante !== detalle.cargo && (
              <div style={{ marginBottom: "16px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
                  TÍTULO DE LA VACANTE
                </p>
                <p style={{ margin: 0, fontSize: "14px", color: "#374151" }}>
                  {detalle.titulo_vacante}
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

    </motion.div>
  );
}