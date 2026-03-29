import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/planner', label: 'Planner' },
    { path: '/guesthouses', label: 'Guesthouses' },
    { path: '/passes', label: 'Passes' },
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-md border-b border-white/5">
      <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <Menu className="text-primary w-6 h-6" />
            <span className="text-2xl font-bold tracking-tighter text-primary uppercase font-headline">RaahBar</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-8 font-label text-[10px] uppercase font-bold tracking-widest">
          {navItems.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`transition-colors duration-300 ${location.pathname === path ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-background opacity-80 hover:opacity-100'}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
