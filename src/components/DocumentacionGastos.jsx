import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useModal } from '../context/ModalContext';
import { Download, Trash2, Upload, FileText, Search } from 'lucide-react';

const DocumentacionGastos = ({ isAdmin }) => {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [file, setFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { showModal } = useModal();

  const fetchDocumentos = async () => {
    try {
      const { data, error } = await supabase.from('documentacion').select('*');
      if (error) throw error;
      setDocumentos(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching documentos:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDocumentos();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !titulo) return;

    setUploading(true);
    const fileName = `${Date.now()}_${file.name}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('documentacion')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documentacion')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('documentacion').insert([{
        titulo: titulo,
        url: publicUrl,
        fileName: fileName,
        fecha: new Date().toISOString()
      }]);

      if (dbError) throw dbError;

      setTitulo('');
      setFile(null);
      setUploading(false);
      fetchDocumentos();
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploading(false);
    }
  };

  const handleDelete = async (docId, fileName) => {
    const isConfirmed = await showModal({ 
      type: 'confirm', 
      title: 'Eliminar Documento', 
      message: '¿Está seguro de eliminar este documento?' 
    });

    if (isConfirmed) {
      try {
        await supabase.storage.from('documentacion').remove([fileName]);
        const { error } = await supabase.from('documentacion').delete().eq('id', docId);
        if (error) throw error;
        fetchDocumentos();
      } catch (error) {
        console.error("Error deleting documento:", error);
      }
    }
  };

  return (
    <div className="card">
      <h3 className="mb-4">Documentación de Gastos</h3>
      
      {isAdmin && (
        <form onSubmit={handleUpload} className="card mb-4" style={{ backgroundColor: 'var(--light-green)' }}>
          <h4 className="mb-4">Subir Nuevo Documento</h4>
          <div className="d-flex gap-4 align-items-center" style={{ flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Título descriptivo del documento" 
              value={titulo} 
              onChange={(e) => setTitulo(e.target.value)} 
              required 
              style={{ flex: 1, minWidth: '200px' }}
            />
            <input 
              type="file" 
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0])} 
              required 
            />
            <button type="submit" className="btn btn-primary d-flex gap-2" disabled={uploading}>
              {uploading ? 'Subiendo...' : <><Upload size={18} /> Subir PDF</>}
            </button>
          </div>
        </form>
      )}

      <div className="mb-4 position-relative">
        <Search className="position-absolute" style={{ top: '12px', left: '12px', color: '#999' }} size={20} />
        <input 
          type="text" 
          placeholder="Buscar documento por título..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
          style={{ paddingLeft: '40px', borderRadius: '8px', border: '1px solid #ccc' }}
          autoComplete="off"
        />
      </div>

      {loading ? (
        <p>Cargando documentos...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {documentos.filter(item => item.titulo.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
            <div key={item.id} className="card d-flex flex-column justify-content-between" style={{ padding: '16px', border: '1px solid #eee' }}>
              <div className="d-flex align-items-center gap-2 mb-4">
                <FileText size={32} color="var(--primary-green)" />
                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{item.titulo}</h4>
              </div>
              <div className="d-flex justify-content-center gap-3 w-100">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary d-flex align-items-center justify-content-center gap-2" style={{ padding: '8px 16px', textDecoration: 'none', fontSize: '0.9rem', flex: 1 }}>
                  <Download size={16} /> Descargar PDF
                </a>
                {isAdmin && (
                  <button onClick={() => handleDelete(item.id, item.fileName)} className="btn btn-danger" style={{ padding: '8px 16px' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {documentos.filter(item => item.titulo.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
            <p className="text-light" style={{ gridColumn: '1 / -1' }}>No se encontraron documentos.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentacionGastos;
