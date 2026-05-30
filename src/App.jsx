import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';

import PanelPrincipal from './components/PanelPrincipal';
import DocumentacionGastos from './components/DocumentacionGastos';
import PlanillaMensual from './components/PlanillaMensual';
import GaleriaFotografica from './components/GaleriaFotografica';
import Balance from './components/Balance';
import RegistroSocios from './components/RegistroSocios';
import PanelAdministrador from './components/PanelAdministrador';
import Estadisticas from './components/Estadisticas';
import InstallPrompt from './components/InstallPrompt';
import { ModalProvider } from './context/ModalContext';

function App() {
  const [user, setUser] = useState(null);

  return (
    <ModalProvider>
      <InstallPrompt />
      <BrowserRouter>
        <Routes>
        <Route 
          path="/" 
          element={!user ? <Login onLogin={setUser} /> : <Navigate to={user.role === 'admin' ? "/admin" : "/panel"} />} 
        />
        
        {/* Rutas protegidas dentro del Layout */}
        <Route element={user ? <Layout user={user} onLogout={() => setUser(null)} /> : <Navigate to="/" />}>
          <Route path="/panel" element={<PanelPrincipal user={user} />} />
          <Route path="/documentacion" element={<DocumentacionGastos isAdmin={false} />} />
          <Route path="/planilla" element={<PlanillaMensual isAdmin={false} />} />
          <Route path="/galeria" element={<GaleriaFotografica isAdmin={false} />} />
          <Route path="/balance" element={<Balance isAdmin={false} />} />
          <Route path="/socios" element={<RegistroSocios isAdmin={false} />} />
          <Route path="/estadisticas" element={<Estadisticas isAdmin={false} />} />
          <Route path="/admin" element={user?.role === 'admin' ? <PanelAdministrador /> : <Navigate to="/panel" />} />
        </Route>
        </Routes>
      </BrowserRouter>
    </ModalProvider>
  );
}

export default App;
