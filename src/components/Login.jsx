import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useModal } from '../context/ModalContext';
import './Login.css';

const Login = ({ onLogin }) => {
  const [mi, setMi] = useState('');
  const [ce, setCe] = useState('');
  const navigate = useNavigate();
  const { showModal } = useModal();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validar administradores hardcodeados
    const admins = [
      { user: 'Ger25$', pass: 'Emi25$' },
      { user: 'Pab26$', pass: 'Pas25$' },
      { user: 'Noe26$', pass: 'Riv26$' }
    ];

    const isAdmin = admins.find(a => a.user === mi && a.pass === ce);
    
    if (isAdmin) {
      onLogin({ role: 'admin', name: mi });
      navigate('/panel');
    } else if (mi && ce) {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('dni', mi)
          .eq('ce', ce);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const userData = data[0];
          onLogin({ role: 'user', name: userData.nombreApellido || mi, rank: userData.jerarquia || 'Socio' });
          navigate('/panel');
        } else {
          await showModal({ type: 'alert', title: 'Acceso Denegado', message: 'Credenciales incorrectas o usuario no registrado.' });
        }
      } catch (error) {
        console.error("Error al verificar credenciales:", error);
        await showModal({ type: 'alert', title: 'Error', message: 'Error de conexión con la base de datos.' });
      }
    } else {
      await showModal({ type: 'alert', title: 'Atención', message: 'Por favor ingrese MI y CE' });
    }
  };



  return (
    <div className="login-container">
      <div className="card login-card">
        <div className="text-center mb-4">
          <div className="circle-logo mx-auto"></div>
          <h2 className="mt-4" style={{ color: 'var(--primary-green)' }}>
            Casino de Suboficiales del Escuadrón de Seguridad Vial “Santa Catalina”
          </h2>
        </div>
        <form onSubmit={handleSubmit} autoComplete="off" className="d-flex flex-column gap-4">
          <div>
            <input
              type="text"
              placeholder="MI (Usuario)"
              value={mi}
              onChange={(e) => setMi(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="CE (Contraseña)"
              value={ce}
              onChange={(e) => setCe(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="d-flex justify-content-center mt-4">
            <button type="submit" className="btn btn-primary">
              Ingresar a la App
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
