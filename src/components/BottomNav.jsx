import { Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Route as RouteIcon, Bed, Mountain } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Home', Icon: HomeIcon },
    { path: '/planner', label: 'Planner', Icon: RouteIcon },
    // { path: '/guesthouses', label: 'Beds', Icon: Bed },
    // { path: '/passes', label: 'Passes', Icon: Mountain },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 md:hidden bg-background/80 backdrop-blur-xl border-t border-white/5 rounded-t-2xl">
      {navItems.map(({ path, label, Icon }) => (
        <Link
          key={path}
          to={path}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${location.pathname === path ? 'bg-primary/20 text-primary scale-105' : 'text-on-background/60'}`}
        >
          <Icon className="w-6 h-6 mb-1" />
          <span className="font-label text-[10px] uppercase font-bold">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
