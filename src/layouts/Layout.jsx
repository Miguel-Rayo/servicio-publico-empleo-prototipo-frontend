import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";

export default function Layout() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  return (
    <div style={{ display: "flex", width: "100%", minHeight: "100vh" }}>
      {/* Overlay móvil */}
      {sidebarAbierto && (
        <div onClick={() => setSidebarAbierto(false)} style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 99,
          display: "none",
        }} className="mobile-overlay" />
      )}

      <Sidebar abierto={sidebarAbierto} onCerrar={() => setSidebarAbierto(false)} />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Topbar móvil */}
        <div className="topbar-mobile" style={{
          display:        "none",
          alignItems:     "center",
          gap:            "12px",
          padding:        "14px 20px",
          background:     "#0f172a",
          position:       "sticky",
          top:            0,
          zIndex:         98,
        }}>
          <button onClick={() => setSidebarAbierto(!sidebarAbierto)} style={{
            background: "none", border: "none",
            color: "#f8fafc", fontSize: "20px", cursor: "pointer", lineHeight: 1
          }}>☰</button>
          <span style={{ color: "#f8fafc", fontWeight: 700, fontSize: "15px" }}>
            Servicio Público de Empleo
          </span>
        </div>

        <main style={{
          flex:    1,
          padding: "32px",
          width:   "100%",
        }} className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}