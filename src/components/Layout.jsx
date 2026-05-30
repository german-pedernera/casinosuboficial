import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { Menu, X, LogOut, LayoutDashboard, FileText, Calendar, Image as ImageIcon, Users, FileSpreadsheet, PieChart } from 'lucide-react';
import './Layout.css';

const Layout = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();


  useEffect(() => {
    const sessionId = Math.random().toString(36).substring(2, 15);
    const roomOne = supabase.channel('online-users', {
      config: {
        presence: {
          key: sessionId,
        },
      },
    });

    roomOne
      .on('presence', { event: 'sync' }, () => {
        const newState = roomOne.presenceState();
        const activeCount = Object.keys(newState).length;
        setOnlineCount(Math.max(1, activeCount));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await roomOne.track({
            user: user?.name || 'Guest',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(roomOne);
    };
  }, [user]);

  const handleLogout = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      onLogout();
      navigate('/');
    }, 1000);
  };

  const navLinks = [
    { path: '/panel', label: 'Panel Principal', icon: <LayoutDashboard size={20} />, roles: ['user', 'admin'] },
    { path: '/planilla', label: 'Planilla Mensual', icon: <Calendar size={20} />, roles: ['user', 'admin'] },
    { path: '/balance', label: 'Balance Ingreso / Egreso', icon: <FileSpreadsheet size={20} />, roles: ['user', 'admin'] },
    { path: '/documentacion', label: 'Documentación Gastos', icon: <FileText size={20} />, roles: ['user', 'admin'] },
    { path: '/galeria', label: 'Galería Fotográfica', icon: <ImageIcon size={20} />, roles: ['user', 'admin'] },
    { path: '/socios', label: 'Fecha de Cumpleaños', icon: <Users size={20} />, roles: ['user', 'admin'] },
    { path: '/estadisticas', label: 'Estadísticas', icon: <PieChart size={20} />, roles: ['user', 'admin'] },
    { path: '/admin', label: 'Panel de Control', icon: <LayoutDashboard size={20} />, roles: ['admin'] },
  ];

  const allowedLinks = navLinks.filter(link => link.roles.includes(user?.role));

  return (
    <div className={`layout-container ${isExiting ? 'layout-exit' : 'layout-enter'}`}>
      {/* Navbar Mobile/Desktop */}
      <nav className="navbar">
        <Link to="/panel" className="navbar-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="circle-logo-small"></div>
          <span className="navbar-title">Casino Oficiales</span>
        </Link>
        
        <div className="navbar-user d-flex align-items-center">
          <span className="d-none-mobile" style={{ color: '#17a2b8', fontWeight: '500', marginRight: '20px', fontSize: '0.9rem' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#28a745', marginRight: '6px' }}></span>
            Oficiales conectados: <strong>{onlineCount}</strong>
          </span>
          <span className="user-info d-none-mobile">
            {user?.role === 'admin' && <span style={{ color: '#ffc107', marginRight: '5px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #ffc107', padding: '2px 5px', borderRadius: '4px' }}>ADMIN</span>}
            {user?.rank && <b>{user.rank}</b>} {user?.name}
          </span>
          <button className="menu-toggle btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <div className="main-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
          <div className="sidebar-header mobile-only">
            <span className="user-info">
              {user?.role === 'admin' && <span style={{ color: '#ffc107', marginRight: '5px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #ffc107', padding: '2px 5px', borderRadius: '4px', display: 'inline-block', marginBottom: '5px' }}>ADMIN</span>}<br/>
              {user?.rank && <b>{user.rank}</b>} {user?.name}
            </span>
            <p style={{ color: '#17a2b8', fontWeight: '500', fontSize: '0.85rem', marginTop: '10px', marginBottom: 0 }}>
              Personas conectadas: {onlineCount}
            </p>
          </div>
          <ul className="nav-list">
            {allowedLinks.map((link) => (
              <li key={link.path} className="nav-item">
                <Link 
                  to={link.path} 
                  className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.icon}
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="nav-item mt-4">
              <button className="nav-link btn-logout" onClick={handleLogout}>
                <LogOut size={20} />
                Salir de la aplicación
              </button>
            </li>
          </ul>
        </aside>

        {/* Content */}
        <main className="content">
          <Outlet context={{ onlineCount }} />
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMenuOpen(false)}></div>
      )}

      {/* Botón flotante de WhatsApp */}
      <a 
        href="https://chat.whatsapp.com/GRAhacEZeOiLGvpFQb3iKO?s=cl&p=a&mlu=0" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="whatsapp-float"
        title="Unirse al grupo de Oficiales"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
        </svg>
      </a>
    </div>
  );
};

export default Layout;
