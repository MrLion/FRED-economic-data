import { NavLink } from 'react-router-dom';
import { Home, LayoutGrid, Database, FileText } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', icon: <Home size={22} /> },
  { to: '/categories', label: 'Categories', icon: <LayoutGrid size={22} /> },
  { to: '/sources', label: 'Sources', icon: <Database size={22} /> },
  { to: '/releases', label: 'Releases', icon: <FileText size={22} /> },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export { navItems };
