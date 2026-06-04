import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useModal } from '../context/ModalContext';
import { Eye, EyeOff } from 'lucide-react';
import CambiarContrasena from './CambiarContrasena';

import './Login.css';

const Login = ({ onLogin }) => {
  const [mi, setMi] = useState('');
  const [ce, setCe] = useState('');
  const [showCe, setShowCe] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const navigate = useNavigate();
  const { showModal } = useModal();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Obtenemos las credenciales desde la variable de entorno (formato: user1:pass1,user2:pass2)
    const adminCreds = import.meta.env.VITE_ADMIN_CREDENTIALS || '';
    const admins = adminCreds.split(',').map(c => {
      const [user, pass] = c.split(':');
      return { user: user?.trim(), pass: pass?.trim() };
    });

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
          
          // Actualizar último acceso (ignora error si no existe la columna)
          supabase.from('usuarios').update({ ultimo_acceso: new Date().toISOString() }).eq('id', userData.id).then();

          onLogin({ 
            role: 'user', 
            name: userData.nombreApellido || mi, 
            rank: userData.jerarquia || 'Socio',
            id: userData.id,
            dni: userData.dni
          });
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



  if (showChangePassword) {
    return <CambiarContrasena onBack={() => setShowChangePassword(false)} />;
  }

  return (
    <div className="login-container">
      <div className="login-card text-center">
        <h2>Casino de Suboficiales . Escuadrón de Seguridad Vial Santa Catalina</h2>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label>MI (Usuario)</label>
            <input
              type="text"
              className="login-input"
              value={mi}
              onChange={(e) => setMi(e.target.value)}
              required
            />
          </div>
          <div className="form-group position-relative">
            <label>Contraseña</label>
            <input
              type={showCe ? "text" : "password"}
              className="login-input"
              value={ce}
              onChange={(e) => setCe(e.target.value)}
              required
              autoComplete="new-password"
              style={{ paddingRight: '40px' }}
            />
            <button 
              type="button"
              className="password-toggle"
              onClick={() => setShowCe(!showCe)}
              title={showCe ? "Ocultar contraseña" : "Ver contraseña"}
            >
              {showCe ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          <button type="submit" className="login-btn">
            Ingresar a la App
          </button>
          
          <button 
            type="button" 
            onClick={() => setShowChangePassword(true)}
            className="link-btn"
          >
            ¿Desea modificar su contraseña?
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
