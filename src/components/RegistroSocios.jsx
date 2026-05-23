import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useModal } from '../context/ModalContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, Trash2, Search } from 'lucide-react';

const RegistroSocios = ({ isAdmin }) => {
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { showModal } = useModal();

  const fetchSocios = async () => {
    try {
      const { data, error } = await supabase.from('usuarios').select('*');
      if (error) throw error;
      setSocios(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching socios:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSocios();
  }, []);

  const handleDelete = async (socio) => {
    const isConfirmed = await showModal({ 
      type: 'confirm', 
      title: 'Eliminar Socio', 
      message: '¿Está seguro de eliminar este socio de la base de datos y todas las planillas?' 
    });

    if (isConfirmed) {
      try {
        const { error: errorUser } = await supabase.from('usuarios').delete().eq('id', socio.id);
        if (errorUser) throw errorUser;

        if (socio.nombreApellido) {
          const { error: errorPlanilla } = await supabase.from('planilla_mensual').delete().eq('socio', socio.nombreApellido);
          if (errorPlanilla) console.error("Error al borrar de planilla_mensual:", errorPlanilla);
        }

        fetchSocios();
      } catch (error) {
        console.error("Error deleting socio:", error);
      }
    }
  };

  const sociosFiltrados = socios.filter(socio => 
    (socio.nombreApellido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (socio.jerarquia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (socio.dni || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Fecha de cumpleaños - Casino de Suboficiales", 14, 15);
    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 22);
    
    const tableColumn = ["Jerarquía", "Nombre y Apellido", "Fecha Nac.", "Edad"];
    const tableRows = [];

    sociosFiltrados.forEach(socio => {
      const socioData = [
        socio.jerarquia || '-',
        socio.nombreApellido,
        socio.fechaNacimiento,
        socio.edad
      ];
      tableRows.push(socioData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      headStyles: { fillColor: [25, 135, 84] },
      styles: { fontSize: 10, halign: 'center' },
      columnStyles: { 1: { halign: 'left' } }
    });
    
    doc.save("fecha_cumpleanios_socios.pdf");
  };

  return (
    <div className="card">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Fecha de Cumpleaños</h3>
        <button onClick={handleDownloadPDF} className="btn btn-primary d-flex gap-2">
          <Download size={18} /> Descargar PDF
        </button>
      </div>

      <div className="mb-4 position-relative">
        <Search className="position-absolute" style={{ top: '12px', left: '12px', color: '#999' }} size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre, jerarquía o DNI..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
          style={{ paddingLeft: '40px', borderRadius: '8px', border: '1px solid #ccc' }}
          autoComplete="off"
        />
      </div>

      {loading ? (
        <p>Cargando datos...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--primary-green)', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', color: 'white' }}>Jerarquía</th>
                <th style={{ padding: '12px 8px', color: 'white' }}>Nombre y Apellido</th>
                <th style={{ padding: '12px 8px', color: 'white' }}>Fecha Cumpleaños</th>
                <th style={{ padding: '12px 8px', color: 'white' }}>Edad</th>
                {isAdmin && <th style={{ padding: '12px 8px', color: 'white' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {sociosFiltrados.map(socio => (
                <tr key={socio.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 8px' }}>{socio.jerarquia}</td>
                  <td style={{ padding: '12px 8px' }}>{socio.nombreApellido}</td>
                  <td style={{ padding: '12px 8px' }}>{socio.fechaNacimiento}</td>
                  <td style={{ padding: '12px 8px' }}>{socio.edad}</td>
                  {isAdmin && (
                    <td style={{ padding: '12px 8px' }}>
                      <button onClick={() => handleDelete(socio)} className="btn btn-danger" style={{ padding: '6px 12px' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {sociosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="text-center" style={{ padding: '20px' }}>
                    No se encontraron socios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RegistroSocios;
