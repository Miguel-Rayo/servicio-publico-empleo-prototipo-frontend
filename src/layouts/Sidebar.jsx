import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/",            icono: "🗺️",  label: "Resumen Nacional"  },
  { to: "/sectores",    icono: "🏭",  label: "Sectores"           },
  { to: "/salarios",    icono: "💰",  label: "Salarios"           },
  { to: "/perfiles",    icono: "🎓",  label: "Perfiles"           },
  { to: "/tendencias",  icono: "📅",  label: "Tendencias"         },
  { to: "/prestadores", icono: "🏆",  label: "Prestadores"        },
  { to: "/inclusion",   icono: "♿",  label: "Inclusión"          },
  { to: "/explorador",  icono: "📋",  label: "Explorador"         },
];

export default function Sidebar({ abierto, onCerrar }) {
  return (
    <aside className={`sidebar ${abierto ? "sidebar-abierto" : ""}`} style={{
      width:         "220px",
      minHeight:     "100vh",
      background:    "#0f172a",
      display:       "flex",
      flexDirection: "column",
      flexShrink:    0,
      position:      "sticky",
      top:           0,
      alignSelf:     "flex-start",
      height:        "100vh",
      overflowY:     "auto",
    }}>
      <div style={{ padding: "24px 20px 16px" }}>
        <p style={{ margin: 0, color: "#f8fafc", fontWeight: 800, fontSize: "15px", lineHeight: 1.3 }}>
          Servicio Público<br />de Empleo
        </p>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "11px" }}>
          Colombia · Análisis Laboral
        </p>
      </div>

      <div style={{ height: "1px", background: "#1e293b", margin: "0 20px 12px" }} />

      <nav style={{ flex: 1, padding: "0 10px" }}>
        {NAV.map(({ to, icono, label }) => (
          <NavLink key={to} to={to} end={to === "/"}
            onClick={onCerrar}
            style={({ isActive }) => ({
              display:        "flex",
              alignItems:     "center",
              gap:            "10px",
              padding:        "10px 12px",
              borderRadius:   "8px",
              marginBottom:   "2px",
              textDecoration: "none",
              fontSize:       "13px",
              fontWeight:     isActive ? 600 : 400,
              color:          isActive ? "#f8fafc" : "#94a3b8",
              background:     isActive ? "#1e40af" : "transparent",
              transition:     "all 0.15s",
            })}
          >
            <span style={{ fontSize: "16px" }}>{icono}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: "16px 20px" }}>
        <p style={{ margin: 0, color: "#334155", fontSize: "11px" }}>
          SymbioTIC © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}