// src/components/MapaColombia.jsx
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Normaliza nombres para hacer match entre GeoJSON y datos de la API
function normalizar(str) {
  if (!str) return "";
  return str
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\s]/g, "")
    .trim();
}

// Escala de color azul según intensidad
function getColor(valor, max) {
  if (!valor || max === 0) return "#e2e8f0";
  const ratio = valor / max;
  if (ratio > 0.8) return "#1e3a8a";
  if (ratio > 0.6) return "#1e40af";
  if (ratio > 0.4) return "#2563eb";
  if (ratio > 0.2) return "#3b82f6";
  if (ratio > 0.1) return "#60a5fa";
  if (ratio > 0.05) return "#93c5fd";
  return "#bfdbfe";
}

export default function MapaColombia({ datos = [], onSelectDepartamento }) {
  const [geojson,      setGeojson]      = useState(null);
  const [mapaData,     setMapaData]     = useState({});
  const [maxVacantes,  setMaxVacantes]  = useState(0);
  const [seleccionado, setSeleccionado] = useState(null);

  // Cargar GeoJSON
  useEffect(() => {
    fetch("/colombia.geojson")
      .then(r => r.json())
      .then(setGeojson);
  }, []);

  // Construir lookup: nombreNormalizado → total
  useEffect(() => {
    if (!datos.length) return;
    const lookup = {};
    let max = 0;
    datos.forEach(d => {
      const key = normalizar(d.departamento);
      lookup[key] = d.total;
      if (d.total > max) max = d.total;
    });
    setMapaData(lookup);
    setMaxVacantes(max);
  }, [datos]);

  if (!geojson) return (
    <div style={{
      height: "500px", display: "flex", alignItems: "center",
      justifyContent: "center", color: "#94a3b8", fontSize: "14px"
    }}>
      Cargando mapa...
    </div>
  );

  const estiloCapa = (feature) => {
    const nombre = normalizar(feature.properties.NOMBRE_DPT || feature.properties.name || "");
    const valor  = mapaData[nombre] || 0;
    const esSeleccionado = seleccionado === nombre;
    return {
      fillColor:   getColor(valor, maxVacantes),
      fillOpacity: esSeleccionado ? 1 : 0.85,
      color:       esSeleccionado ? "#f59e0b" : "#ffffff",
      weight:      esSeleccionado ? 2.5 : 1,
    };
  };

  const onEachFeature = (feature, layer) => {
    const nombre    = normalizar(feature.properties.NOMBRE_DPT || feature.properties.name || "");
    const nombreReal = feature.properties.NOMBRE_DPT || feature.properties.name || "";
    const vacantes  = mapaData[nombre] || 0;

    layer.on({
      click: () => {
        setSeleccionado(nombre);
        // Buscar el nombre original en los datos para pasarlo al padre
        const encontrado = datos.find(d => normalizar(d.departamento) === nombre);
        if (onSelectDepartamento) {
          onSelectDepartamento(encontrado ? encontrado.departamento : null);
        }
      },
      mouseover: (e) => {
        e.target.setStyle({ fillOpacity: 1, weight: 2 });
      },
      mouseout: (e) => {
        e.target.setStyle(estiloCapa(feature));
      },
    });
  };

  return (
    <div style={{ position: "relative" }}>
      <MapContainer
        center={[4.5, -74.0]}
        zoom={5}
        style={{ height: "500px", borderRadius: "12px", zIndex: 0 }}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        />
        <GeoJSON
          key={JSON.stringify(mapaData)}
          data={geojson}
          style={estiloCapa}
          onEachFeature={onEachFeature}
        >
        </GeoJSON>
      </MapContainer>

      {/* Leyenda */}
      <div style={{
        position: "absolute", bottom: "20px", right: "20px",
        background: "rgba(255,255,255,0.95)", borderRadius: "8px",
        padding: "12px 16px", zIndex: 1000,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)", fontSize: "11px"
      }}>
        <p style={{ margin: "0 0 8px", fontWeight: 600, color: "#374151" }}>Vacantes</p>
        {[
          { color: "#1e3a8a", label: "Muy alta" },
          { color: "#2563eb", label: "Alta"     },
          { color: "#60a5fa", label: "Media"    },
          { color: "#bfdbfe", label: "Baja"     },
          { color: "#e2e8f0", label: "Sin datos" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <div style={{ width: "14px", height: "14px", borderRadius: "3px", background: color }} />
            <span style={{ color: "#6b7280" }}>{label}</span>
          </div>
        ))}
        {seleccionado && (
          <button onClick={() => { setSeleccionado(null); onSelectDepartamento?.(null); }}
            style={{
              marginTop: "8px", width: "100%", padding: "4px",
              borderRadius: "4px", border: "1px solid #e5e7eb",
              background: "#f9fafb", color: "#6b7280",
              cursor: "pointer", fontSize: "11px"
            }}>
            Limpiar selección
          </button>
        )}
      </div>
    </div>
  );
}