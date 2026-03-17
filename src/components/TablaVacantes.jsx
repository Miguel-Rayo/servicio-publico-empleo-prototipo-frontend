// tabla con filtros y paginación

// src/components/TablaVacantes.jsx
import { useState, useEffect } from "react";
import { getListado } from "../api/vacantes";

const FILTROS_INICIALES = {
  departamento:   "",
  nivel_estudios: "",
  tipo_contrato:  "",
  rango_salarial: "",
};

const NIVELES    = ["Básica Secundaria", "Media", "Técnico", "Tecnólogico", "Universitarios", "Especilización", "Primaria", "No Aplica", "Otro"];
const CONTRATOS  = ["Término fijo", "Término indefinido", "Por obra o labor", "Prestación de servicios", "Otra"];
const SALARIOS   = ["$884.251 - $1.000.000", "$1.000.001 - $1.500.000", "$1.500.001 - $2.000.000", "$2.000.001 - $3.000.000", "$3.000.001 - $4.000.000", "$4.000.001 - $6.000.000", "$6.000.001 - $8.000.000", "A Convenir"];

export default function TablaVacantes({ departamentos = [] }) {
  const [filtros, setFiltros]   = useState(FILTROS_INICIALES);
  const [data, setData]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const LIMIT = 20;

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: LIMIT };
    Object.entries(filtros).forEach(([k, v]) => { if (v) params[k] = v; });

    getListado(params)
      .then(res => { setData(res.data); setTotal(res.total); })
      .finally(() => setLoading(false));
  }, [filtros, page]);

  const totalPaginas = Math.ceil(total / LIMIT);

  const handleFiltro = (campo, valor) => {
    setFiltros(f => ({ ...f, [campo]: valor }));
    setPage(1);
  };

  const selectStyle = {
    padding: "8px 12px", borderRadius: "8px", fontSize: "13px",
    border: "1px solid #e5e7eb", background: "#f9fafb",
    color: "#374151", cursor: "pointer", minWidth: "160px"
  };

  return (
    <div style={{
      background: "#ffffff", borderRadius: "12px",
      padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.1)"
    }}>
      <p style={{ margin: "0 0 16px", fontWeight: 600, fontSize: "15px", color: "#111827" }}>
        Listado de Vacantes
        <span style={{ fontWeight: 400, fontSize: "13px", color: "#6b7280", marginLeft: "10px" }}>
          {total.toLocaleString("es-CO")} resultados
        </span>
      </p>

      {/* Filtros */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
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

        {Object.values(filtros).some(v => v) && (
          <button onClick={() => { setFiltros(FILTROS_INICIALES); setPage(1); }}
            style={{
              padding: "8px 16px", borderRadius: "8px", fontSize: "13px",
              border: "1px solid #fca5a5", background: "#fef2f2",
              color: "#dc2626", cursor: "pointer"
            }}>
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Cargo", "Departamento", "Municipio", "Salario", "Contrato", "Nivel Estudios", "Plazas", "Publicación"].map(h => (
                <th key={h} style={{
                  padding: "10px 14px", textAlign: "left",
                  fontWeight: 600, color: "#374151",
                  borderBottom: "2px solid #e5e7eb", whiteSpace: "nowrap"
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                Cargando...
              </td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                No hay resultados para los filtros seleccionados.
              </td></tr>
            ) : data.map((v, i) => (
              <tr key={v.codigo_vacante} style={{
                background: i % 2 === 0 ? "#ffffff" : "#f9fafb",
                transition: "background 0.15s"
              }}
                onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#ffffff" : "#f9fafb"}
              >
                <td style={{ padding: "10px 14px", color: "#111827", fontWeight: 500 }}>{v.cargo}</td>
                <td style={{ padding: "10px 14px", color: "#374151" }}>{v.departamento}</td>
                <td style={{ padding: "10px 14px", color: "#374151" }}>{v.municipio}</td>
                <td style={{ padding: "10px 14px", color: "#374151", whiteSpace: "nowrap" }}>{v.rango_salarial}</td>
                <td style={{ padding: "10px 14px", color: "#374151" }}>{v.tipo_contrato}</td>
                <td style={{ padding: "10px 14px", color: "#374151" }}>{v.nivel_estudios}</td>
                <td style={{ padding: "10px 14px", color: "#374151", textAlign: "center" }}>{v.cantidad_vacantes}</td>
                <td style={{ padding: "10px 14px", color: "#6b7280", whiteSpace: "nowrap" }}>
                  {v.fecha_publicacion ? new Date(v.fecha_publicacion).toLocaleDateString("es-CO") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{
              padding: "6px 14px", borderRadius: "6px", fontSize: "13px",
              border: "1px solid #e5e7eb", background: page === 1 ? "#f3f4f6" : "#ffffff",
              color: page === 1 ? "#9ca3af" : "#374151", cursor: page === 1 ? "default" : "pointer"
            }}>← Anterior</button>

          <span style={{ fontSize: "13px", color: "#6b7280" }}>
            Página {page} de {totalPaginas.toLocaleString("es-CO")}
          </span>

          <button onClick={() => setPage(p => Math.min(totalPaginas, p + 1))} disabled={page === totalPaginas}
            style={{
              padding: "6px 14px", borderRadius: "6px", fontSize: "13px",
              border: "1px solid #e5e7eb", background: page === totalPaginas ? "#f3f4f6" : "#ffffff",
              color: page === totalPaginas ? "#9ca3af" : "#374151", cursor: page === totalPaginas ? "default" : "pointer"
            }}>Siguiente →</button>
        </div>
      )}
    </div>
  );
}