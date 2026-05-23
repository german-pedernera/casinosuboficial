import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useModal } from '../context/ModalContext';
import { Download, Trash2, Upload, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import './Galeria.css';

const ImageCarousel = ({ urls, fileNames, descripcion, onDownload, onDelete, isAdmin }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === urls.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? urls.length - 1 : prev - 1));
  };

  const isMultiple = urls.length > 1;

  return (
    <div className="card p-2" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', width: '100%', height: '200px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
        <img 
          src={urls[currentIndex]} 
          alt={descripcion} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
        {isMultiple && (
          <>
            <button 
              onClick={prevSlide}
              style={{ position: 'absolute', left: '5px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={nextSlide}
              style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}
            >
              <ChevronRight size={20} />
            </button>
            <div style={{ position: 'absolute', bottom: '5px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>
              {currentIndex + 1} / {urls.length}
            </div>
          </>
        )}
      </div>
      <p className="mt-2 text-dark" style={{fontWeight: '500', fontSize: '0.9rem'}}>{descripcion}</p>
      <div className="d-flex gap-2 mt-auto">
        <button 
          className="btn btn-primary flex-grow-1 d-flex justify-content-center" 
          onClick={() => {
            urls.forEach((url, i) => {
              setTimeout(() => {
                onDownload(url, `${descripcion}_${i + 1}`);
              }, i * 400); // 400ms delay between downloads to prevent browser blocking
            });
          }}
          style={{padding: '8px', fontSize: '0.8rem'}}
          title="Descargar todas las imágenes"
        >
          <Download size={16} />
        </button>
        {isAdmin && (
          <button 
            className="btn btn-danger" 
            onClick={() => onDelete(fileNames)}
            style={{padding: '8px'}}
            title="Eliminar publicación"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

const GaleriaFotografica = ({ isAdmin }) => {
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { showModal } = useModal();

  const fetchFotos = async () => {
    try {
      const { data, error } = await supabase.from('galeria').select('*').order('fecha', { ascending: false });
      if (error) throw error;
      setFotos(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching fotos:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFotos();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!files || files.length === 0 || !descripcion) return;

    setUploading(true);
    
    try {
      const uploadedUrls = [];
      const uploadedFileNames = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${Date.now()}_${i}_${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('galeria')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('galeria')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
        uploadedFileNames.push(fileName);
      }

      const { error: dbError } = await supabase.from('galeria').insert([{
        descripcion: descripcion,
        url: JSON.stringify(uploadedUrls),
        fileName: JSON.stringify(uploadedFileNames),
        fecha: new Date().toISOString()
      }]);

      if (dbError) throw dbError;

      setDescripcion('');
      setFiles([]);
      e.target.reset();
      setUploading(false);
      fetchFotos();
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploading(false);
    }
  };

  const handleDelete = async (docId, fileNamesRaw) => {
    const isConfirmed = await showModal({ 
      type: 'confirm', 
      title: 'Eliminar Fotografía', 
      message: '¿Está seguro de eliminar esta publicación y todas sus fotos?' 
    });

    if (isConfirmed) {
      try {
        let fileNamesToDelete = [];
        try {
          fileNamesToDelete = JSON.parse(fileNamesRaw);
          if (!Array.isArray(fileNamesToDelete)) {
            fileNamesToDelete = [fileNamesRaw];
          }
        } catch {
          // If it's old data and not a valid JSON array string
          fileNamesToDelete = [fileNamesRaw];
        }

        if (fileNamesToDelete.length > 0) {
          await supabase.storage.from('galeria').remove(fileNamesToDelete);
        }

        const { error } = await supabase.from('galeria').delete().eq('id', docId);
        if (error) throw error;
        
        fetchFotos();
      } catch (error) {
        console.error("Error deleting foto:", error);
      }
    }
  };

  const handleDownloadImage = async (url, desc) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${desc || 'imagen'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error("Error al descargar", e);
      window.open(url, '_blank');
    }
  };

  const filteredFotos = fotos.filter(foto => 
    foto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card">
      <h3 className="mb-4">Galería Fotográfica</h3>

      {isAdmin && (
        <form onSubmit={handleUpload} className="card mb-4" style={{ backgroundColor: '#E8F8F5' }}>
          <h4 className="mb-4">Subir Nueva Publicación</h4>
          <div className="d-flex gap-4 align-items-center" style={{ flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Breve descripción" 
              value={descripcion} 
              onChange={(e) => setDescripcion(e.target.value)} 
              required 
              style={{ flex: 1, minWidth: '200px' }}
            />
            <input 
              type="file" 
              accept="image/*"
              multiple
              onChange={(e) => setFiles(e.target.files)} 
              required 
            />
            <button type="submit" className="btn btn-primary d-flex gap-2" disabled={uploading}>
              {uploading ? 'Subiendo...' : <><Upload size={18} /> Subir Foto(s)</>}
            </button>
          </div>
        </form>
      )}

      <div className="mb-4 position-relative">
        <Search className="position-absolute" style={{ top: '12px', left: '12px', color: '#999' }} size={20} />
        <input 
          type="text" 
          placeholder="Buscar publicación por descripción..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
          style={{ paddingLeft: '40px', borderRadius: '8px', border: '1px solid #ccc' }}
          autoComplete="off"
        />
      </div>

      {loading ? (
        <p>Cargando galería...</p>
      ) : filteredFotos.length > 0 ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
          gap: '20px' 
        }}>
          {filteredFotos.map((foto) => {
            let urls = [];
            let fileNames = foto.fileName;
            try {
              urls = JSON.parse(foto.url);
              if (!Array.isArray(urls)) urls = [foto.url];
            } catch {
              urls = [foto.url];
            }

            return (
              <ImageCarousel 
                key={foto.id}
                urls={urls}
                fileNames={fileNames}
                descripcion={foto.descripcion}
                onDownload={handleDownloadImage}
                onDelete={() => handleDelete(foto.id, foto.fileName)}
                isAdmin={isAdmin}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-light">No se encontraron fotografías.</p>
      )}
    </div>
  );
};

export default GaleriaFotografica;
