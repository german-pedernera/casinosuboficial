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
    { path: '/documentacion', label: 'Documentación Gastos', icon: <FileText size={20} />, roles: ['user', 'admin'] },
    { path: '/planilla', label: 'Planilla Mensual', icon: <Calendar size={20} />, roles: ['user', 'admin'] },
    { path: '/galeria', label: 'Galería Fotográfica', icon: <ImageIcon size={20} />, roles: ['user', 'admin'] },
    { path: '/balance', label: 'Balance Ingreso / Egreso', icon: <FileSpreadsheet size={20} />, roles: ['user', 'admin'] },
    { path: '/socios', label: 'Fecha de Cumpleaños', icon: <Users size={20} />, roles: ['user', 'admin'] },
    { path: '/estadisticas', label: 'Estadísticas', icon: <PieChart size={20} />, roles: ['user', 'admin'] },
    { path: '/admin', label: 'Panel de Control', icon: <LayoutDashboard size={20} />, roles: ['admin'] },
  ];

  const allowedLinks = navLinks.filter(link => link.roles.includes(user?.role));

  return (
    <div className={`layout-container ${isExiting ? 'layout-exit' : 'layout-enter'}`}>
      {/* Navbar Mobile/Desktop */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="circle-logo-small"></div>
          <span className="navbar-title">Casino Suboficiales</span>
        </div>
        
        <div className="navbar-user d-flex align-items-center">
          <span className="d-none-mobile" style={{ color: '#17a2b8', fontWeight: '500', marginRight: '20px', fontSize: '0.9rem' }}>
            Personas actualmente ingresadas en la aplicación: {onlineCount}
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
    </div>
  );
};

export default Layout;
