import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./layouts/Layout";
import Dashboard     from "./pages/Dashboard";
import Sectores      from "./pages/Sectores";
import Salarios      from "./pages/Salarios";
import Perfiles      from "./pages/Perfiles";
import Tendencias    from "./pages/Tendencias";
import Prestadores   from "./pages/Prestadores";
import Inclusion     from "./pages/Inclusion";
import Explorador    from "./pages/Explorador";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index         element={<Dashboard />}   />
          <Route path="sectores"    element={<Sectores />}    />
          <Route path="salarios"    element={<Salarios />}    />
          <Route path="perfiles"    element={<Perfiles />}    />
          <Route path="tendencias"  element={<Tendencias />}  />
          <Route path="prestadores" element={<Prestadores />} />
          <Route path="inclusion"   element={<Inclusion />}   />
          <Route path="explorador"  element={<Explorador />}  />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}