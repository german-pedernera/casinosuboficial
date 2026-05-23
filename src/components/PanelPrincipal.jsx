import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useOutletContext } from 'react-router-dom';
import { ThumbsUp, Trash2 } from 'lucide-react';

const PanelPrincipal = ({ user }) => {
  const { onlineCount } = useOutletContext() || { onlineCount: 1 };
  const [propuesta, setPropuesta] = useState('');
  const [mi, setMi] = useState('');
  const [ce, setCe] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [propuestas, setPropuestas] = useState([]);
  const [loadingPropuestas, setLoadingPropuestas] = useState(true);

  const fetchPropuestas = async () => {
    try {
      const { data, error } = await supabase
        .from('propuestas')
        .select('*')
        .order('fecha', { ascending: false });
      
      if (error) throw error;
      setPropuestas(data || []);
    } catch (error) {
      console.error("Error fetching propuestas:", error);
    } finally {
      setLoadingPropuestas(false);
    }
  };

  useEffect(() => {
    fetchPropuestas();
  }, []);

  const handleEnviarPropuesta = async (e) => {
    e.preventDefault();
    if (!propuesta || !mi || !ce) {
      setMensaje('Por favor, complete todos los campos.');
      return;
    }

    try {
      const { error } = await supabase.from('propuestas').insert([{
        mi: mi,
        ce: ce,
        propuesta: propuesta,
        fecha: new Date().toISOString(),
        jerarquia: user?.rank || 'N/A',
        nombre: user?.name || 'Usuario',
        votos: []
      }]);
      if (error) throw error;
      setPropuesta('');
      setMi('');
      setCe('');
      setMensaje('¡Propuesta enviada exitosamente!');
      fetchPropuestas();
      
      setTimeout(() => setMensaje(''), 5000);
    } catch (error) {
      console.error('Error al enviar propuesta:', error);
      setMensaje('Hubo un error al enviar la propuesta.');
    }
  };

  const handleVote = async (propuestaId, currentVotos) => {
    // Usamos el nombre del usuario como identificador único para los votos 
    // (idealmente sería el MI si lo tuviéramos global, pero el name sirve para control de socios)
    const userId = user?.name || 'Anonimo'; 
    
    let votosArray = [];
    try {
      if (typeof currentVotos === 'string') {
        votosArray = JSON.parse(currentVotos);
      } else if (Array.isArray(currentVotos)) {
        votosArray = currentVotos;
      }
    } catch (e) {
      votosArray = [];
    }

    if (votosArray.includes(userId)) {
      alert("Ya has votado por esta propuesta.");
      return;
    }

    const nuevosVotos = [...votosArray, userId];

    try {
      const { error } = await supabase
        .from('propuestas')
        .update({ votos: nuevosVotos })
        .eq('id', propuestaId);

      if (error) throw error;
      
      // Actualizar estado local
      setPropuestas(propuestas.map(p => 
        p.id === propuestaId ? { ...p, votos: nuevosVotos } : p
      ));
    } catch (error) {
      console.error("Error al votar:", error);
      alert("Hubo un error al registrar tu voto. ¿Ya agregaste la columna 'votos' en Supabase?");
    }
  };

  const handleDeletePropuesta = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta propuesta?")) return;
    
    try {
      const { error } = await supabase.from('propuestas').delete().eq('id', id);
      if (error) throw error;
      setPropuestas(propuestas.filter(p => p.id !== id));
    } catch (error) {
      console.error("Error al eliminar propuesta:", error);
      alert("Hubo un error al eliminar la propuesta.");
    }
  };

  return (
    <div className="container">
      <h2 className="mb-4">Panel Principal</h2>
      
      <div className="card mb-4">
        <h3>Bienvenido/a, {user?.rank} {user?.name}</h3>
        <p className="text-light mt-4">Personas actualmente ingresadas en la aplicación: <strong>{onlineCount}</strong></p>
      </div>

      <div className="card mb-4">
        <h3>Buzón de Propuestas</h3>
        <p className="text-light mb-4">Deje su mensaje o propuesta para ser evaluada por los integrantes del casino.</p>
        
        <form onSubmit={handleEnviarPropuesta} autoComplete="off" className="d-flex flex-column gap-4">
          <div>
            <textarea
              placeholder="Escriba su propuesta aquí..."
              value={propuesta}
              onChange={(e) => setPropuesta(e.target.value)}
              rows={4}
              maxLength={250}
              required
            ></textarea>
            <div className="text-end" style={{ fontSize: '0.8rem', color: '#999', marginTop: '4px' }}>
              {propuesta.length}/250 caracteres
            </div>
          </div>
          <div className="d-flex gap-4 flex-column-mobile">
            <input
              type="text"
              placeholder="Ingrese su MI"
              value={mi}
              onChange={(e) => setMi(e.target.value)}
              required
              autoComplete="none"
            />
            <input
              type="password"
              placeholder="Ingrese su CE"
              value={ce}
              onChange={(e) => setCe(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          {mensaje && <p className={mensaje.includes('error') ? 'text-danger' : 'text-success'} style={{color: mensaje.includes('error') ? 'var(--danger)' : 'var(--primary-green)'}}>{mensaje}</p>}
          <button type="submit" className="btn btn-primary btn-mobile-full" style={{alignSelf: 'flex-start'}}>
            Enviar Propuesta
          </button>
        </form>
      </div>

      <div className="card">
        <h3 className="mb-4">Propuestas de la Comunidad</h3>
        {loadingPropuestas ? (
          <p className="text-light">Cargando propuestas...</p>
        ) : propuestas.length === 0 ? (
          <p className="text-light">Aún no hay propuestas enviadas.</p>
        ) : (
          <div className="d-flex flex-column gap-3">
            {propuestas.map(p => {
              let votos = [];
              try {
                if (typeof p.votos === 'string') votos = JSON.parse(p.votos);
                else if (Array.isArray(p.votos)) votos = p.votos;
              } catch(e) { votos = []; }

              const userId = user?.name || 'Anonimo';
              const yaVoto = votos.includes(userId);

              return (
                <div key={p.id} className="p-3" style={{ border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9fcfb' }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <strong>{p.jerarquia} {p.nombre}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        {new Date(p.fecha).toLocaleDateString()} a las {new Date(p.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    {user?.role === 'admin' && (
                      <button 
                        onClick={() => handleDeletePropuesta(p.id)}
                        className="btn btn-danger btn-sm d-flex align-items-center justify-content-center"
                        style={{ padding: '6px' }}
                        title="Eliminar Propuesta"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p style={{ color: '#333', marginBottom: '15px', whiteSpace: 'pre-wrap' }}>{p.propuesta}</p>
                  
                  <div className="d-flex align-items-center gap-2">
                    <button 
                      onClick={() => handleVote(p.id, p.votos)}
                      className={`btn d-flex align-items-center justify-content-center gap-2 ${yaVoto ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ 
                        padding: '6px 16px', 
                        fontSize: '0.9rem', 
                        borderRadius: '20px',
                        backgroundColor: yaVoto ? '#999' : 'var(--primary-green)',
                        border: 'none',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: yaVoto ? 'default' : 'pointer'
                      }}
                      disabled={yaVoto}
                    >
                      <ThumbsUp size={16} fill={yaVoto ? 'white' : 'none'} />
                      <span>{votos.length} {votos.length === 1 ? 'Voto' : 'Votos'}</span>
                    </button>
                    {yaVoto && <span style={{ fontSize: '0.85rem', color: 'var(--primary-green)', fontWeight: 'bold' }}>¡Ya votaste!</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PanelPrincipal;
