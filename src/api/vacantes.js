// todas las llamadas al backend

// src/api/vacantes.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/vacantes",
});

export const getResumen         = ()       => API.get("/resumen").then(r => r.data);
export const getPorDepartamento = ()       => API.get("/por-departamento").then(r => r.data);
export const getPorSalario      = ()       => API.get("/por-salario").then(r => r.data);
export const getPorNivelEstudios= ()       => API.get("/por-nivel-estudios").then(r => r.data);
export const getPorSector       = ()       => API.get("/por-sector").then(r => r.data);
export const getPorContrato     = ()       => API.get("/por-contrato").then(r => r.data);
export const getListado         = (params) => API.get("/listado", { params }).then(r => r.data);
export const getTendenciaDiaria      = () => API.get("/tendencia-diaria").then(r => r.data);
export const getPorMunicipio         = () => API.get("/por-municipio").then(r => r.data);
export const getSalarioPorDep        = () => API.get("/salario-por-departamento").then(r => r.data);
export const getExperienciaVsEstudios= () => API.get("/experiencia-vs-estudios").then(r => r.data);
export const getTopPrestadores       = () => API.get("/top-prestadores").then(r => r.data);
export const getInclusion            = () => API.get("/inclusion").then(r => r.data);
export const getBrecha               = () => API.get("/brecha-sectorial").then(r => r.data);