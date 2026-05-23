import { useState } from 'react';
import PlanillaMensual from './PlanillaMensual';
import DocumentacionGastos from './DocumentacionGastos';
import GaleriaFotografica from './GaleriaFotografica';
import Balance from './Balance';
import RegistroSocios from './RegistroSocios';
import RegistroNuevoUsuario from './RegistroNuevoUsuario';
import PlanillaCompletaSocio from './PlanillaCompletaSocio';
import Estadisticas from './Estadisticas';

const PanelAdministrador = () => {
  const [activeTab, setActiveTab] = useState('planilla');

  const tabs = [
    { id: 'planilla', label: 'Planilla Mensual' },
    { id: 'documentacion', label: 'Documentación' },
    { id: 'galeria', label: 'Galería' },
    { id: 'balance', label: 'Balance' },
    { id: 'nuevoSocio', label: 'Alta Socio' },
    { id: 'socios', label: 'Fecha de cumpleaños' },
    { id: 'planillaCompleta', label: 'Planilla Completa Socio' },
    { id: 'estadisticas', label: 'Estadísticas' }
  ];

  return (
    <div className="container">
      <h2 className="mb-4">Panel de Control (Administrador)</h2>
      <p className="text-light mb-4">
        Desde este panel usted puede cargar, modificar, eliminar y guardar datos del sistema.
      </p>

      <div className="card mb-4" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #E0E0E0', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '1 1 auto',
                textAlign: 'center',
                padding: '16px 12px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid var(--primary-green)' : '3px solid transparent',
                color: activeTab === tab.id ? 'var(--primary-green)' : 'var(--text-light)',
                fontWeight: activeTab === tab.id ? '600' : '400',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'var(--transition)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-content">
        {activeTab === 'planilla' && <PlanillaMensual isAdmin={true} />}
        {activeTab === 'documentacion' && <DocumentacionGastos isAdmin={true} />}
        {activeTab === 'galeria' && <GaleriaFotografica isAdmin={true} />}
        {activeTab === 'balance' && <Balance isAdmin={true} />}
        {activeTab === 'nuevoSocio' && <RegistroNuevoUsuario />}
        {activeTab === 'socios' && <RegistroSocios isAdmin={true} />}
        {activeTab === 'planillaCompleta' && <PlanillaCompletaSocio isAdmin={true} />}
        {activeTab === 'estadisticas' && <Estadisticas />}
      </div>
    </div>
  );
};

export default PanelAdministrador;
