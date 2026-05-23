import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useModal } from '../context/ModalContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, Trash2, Edit2, Save, X, Search } from 'lucide-react';

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const PlanillaMensual = ({ isAdmin }) => {
  const [filas, setFilas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const { showModal } = useModal();

  const JERARQUIAS = [
    "Suboficial Mayor", "Suboficial Principal", "Sargento Ayudante", 
    "Sargento Primero", "Sargento", "Cabo Primero", "Cabo", "Gendarme"
  ];

  const fetchPlanilla = async () => {
    try {
      const { data, error } = await supabase.from('planilla_mensual').select('*');
      if (error) throw error;
      setFilas(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching planilla:", error);
      setLoading(false);
    }
  };

  const filasFiltradas = filas.filter(fila => 
    (fila.socio || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (fila.jerarquia || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calcularTotalFila = (fila) => {
    return MESES.reduce((acc, mes) => acc + (parseFloat(fila[mes]) || 0), 0);
  };

  const calcularTotalMes = (mes) => {
    return filasFiltradas.reduce((acc, fila) => acc + (parseFloat(fila[mes]) || 0), 0);
  };

  const calcularTotalGeneral = () => {
    return filasFiltradas.reduce((acc, fila) => acc + calcularTotalFila(fila), 0);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlanilla();
  }, []);



  const handleDelete = async (fila) => {
    const isConfirmed = await showModal({ 
      type: 'confirm', 
      title: 'Eliminar Socio', 
      message: '¿Está seguro de eliminar este socio de la planilla y base de datos?' 
    });

    if (isConfirmed) {
      try {
        const { error: errorPlanilla } = await supabase.from('planilla_mensual').delete().eq('id', fila.id);
        if (errorPlanilla) throw errorPlanilla;

        if (fila.socio) {
           const { error: errorUser } = await supabase.from('usuarios').delete().eq('nombreApellido', fila.socio);
           if (errorUser) console.error("Error al borrar usuario:", errorUser);
        }

        fetchPlanilla();
      } catch (error) {
        console.error("Error deleting row:", error);
      }
    }
  };

  const handleEditClick = (fila) => {
    setEditingId(fila.id);
    setEditData({ jerarquia: fila.jerarquia || '', socio: fila.socio });
  };

  const handleSaveEdit = async (id) => {
    try {
      const { error } = await supabase.from('planilla_mensual').update(editData).eq('id', id);
      if (error) throw error;
      setFilas(filas.map(f => f.id === id ? { ...f, ...editData } : f));
      setEditingId(null);
    } catch (error) {
      console.error("Error updating fila:", error);
    }
  };

  const handleUpdateMonto = async (id, mes, valorActual, nuevoValor) => {
    if (!isAdmin || valorActual == nuevoValor) return;
    try {
      const { error } = await supabase.from('planilla_mensual').update({ [mes]: nuevoValor }).eq('id', id);
      if (error) throw error;
      // Actualizar estado local para UX rápida
      setFilas(filas.map(f => f.id === id ? { ...f, [mes]: nuevoValor } : f));
    } catch (error) {
      console.error("Error updating monto:", error);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text("Planilla Mensual - Casino de Suboficiales", 14, 15);
    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 22);
    
    const tableColumn = ["Jerarquía", "Socio", ...MESES, "Total"];
    const tableRows = [];

    filasFiltradas.forEach((fila) => {
      const rowData = [fila.jerarquia || '-', fila.socio];
      MESES.forEach(mes => {
        rowData.push(fila[mes] ? `$${fila[mes]}` : '-');
      });
      rowData.push(`$${calcularTotalFila(fila)}`);
      tableRows.push(rowData);
    });

    const totalRow = ["", "TOTALES", ...MESES.map(mes => `$${calcularTotalMes(mes)}`), `$${calcularTotalGeneral()}`];
    tableRows.push(totalRow);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      headStyles: { fillColor: [25, 135, 84] },
      styles: { fontSize: 8, halign: 'center' },
      columnStyles: { 1: { halign: 'left' } }
    });
    
    doc.save("planilla_mensual.pdf");
  };

  return (
    <div className="card">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Planilla Mensual</h3>
        <button onClick={handleDownloadPDF} className="btn btn-primary d-flex gap-2">
          <Download size={18} /> Descargar PDF
        </button>
      </div>



      <div className="mb-4 position-relative">
        <Search className="position-absolute" style={{ top: '12px', left: '12px', color: '#999' }} size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre o jerarquía..." 
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
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--primary-green)' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left' }}>Jerarquía</th>
                <th style={{ padding: '12px 8px', textAlign: 'left' }}>Socio</th>
                {MESES.map(mes => (
                  <th key={mes} style={{ padding: '12px 4px', fontSize: '0.9rem' }}>{mes}</th>
                ))}
                <th style={{ padding: '12px 8px', fontSize: '0.9rem' }}>Total</th>
                {isAdmin && <th style={{ padding: '12px 8px' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filasFiltradas.map((fila) => (
                <tr key={fila.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                    {editingId === fila.id ? (
                      <select 
                        value={editData.jerarquia} 
                        onChange={(e) => setEditData({...editData, jerarquia: e.target.value})}
                        className="form-control form-control-sm"
                      >
                        <option value="">Jerarquía...</option>
                        {JERARQUIAS.map((j) => <option key={j} value={j}>{j}</option>)}
                      </select>
                    ) : (
                      fila.jerarquia || '-'
                    )}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '500' }}>
                    {editingId === fila.id ? (
                      <input 
                        type="text" 
                        value={editData.socio} 
                        onChange={(e) => setEditData({...editData, socio: e.target.value})}
                        className="form-control form-control-sm"
                      />
                    ) : (
                      fila.socio
                    )}
                  </td>
                  {MESES.map(mes => (
                    <td key={mes} style={{ padding: '12px 4px' }}>
                      {isAdmin && editingId === fila.id ? (
                        <div className="input-group input-group-sm" style={{ width: '70px', margin: '0 auto' }}>
                          <span className="input-group-text" style={{ padding: '2px 4px', fontSize: '0.8rem' }}>$</span>
                          <input
                            type="number"
                            className="form-control text-center"
                            defaultValue={fila[mes] || ''}
                            onBlur={(e) => handleUpdateMonto(fila.id, mes, fila[mes], e.target.value)}
                            style={{ padding: '2px 4px', fontSize: '0.85rem' }}
                            placeholder="-"
                          />
                        </div>
                      ) : (
                        <span style={{ 
                          fontWeight: fila[mes] ? '600' : 'normal',
                          color: fila[mes] ? 'var(--primary-green)' : '#999'
                        }}>
                          {fila[mes] ? `$${fila[mes]}` : '-'}
                        </span>
                      )}
                    </td>
                  ))}
                  <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>
                    ${calcularTotalFila(fila)}
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '12px 8px' }}>
                      {editingId === fila.id ? (
                        <div className="d-flex gap-2 justify-content-center">
                          <button onClick={() => handleSaveEdit(fila.id)} className="btn btn-success" style={{ padding: '6px 12px' }}>
                            <Save size={16} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="btn btn-secondary" style={{ padding: '6px 12px' }}>
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="d-flex gap-2 justify-content-center">
                          <button onClick={() => handleEditClick(fila)} className="btn btn-primary" style={{ padding: '6px 12px' }}>
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(fila)} className="btn btn-danger" style={{ padding: '6px 12px' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {filasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 16 : 15} className="text-center" style={{ padding: '20px' }}>
                    No se encontraron socios.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: 'var(--light-bg)', fontWeight: 'bold', borderTop: '2px solid var(--primary-green)' }}>
                <td colSpan="2" style={{ padding: '12px 8px', textAlign: 'right' }}>TOTALES</td>
                {MESES.map(mes => (
                  <td key={mes} style={{ padding: '12px 4px' }}>${calcularTotalMes(mes)}</td>
                ))}
                <td style={{ padding: '12px 8px' }}>${calcularTotalGeneral()}</td>
                {isAdmin && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default PlanillaMensual;
