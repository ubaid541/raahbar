import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full py-12 border-t border-white/5 bg-background mt-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-8 py-16 max-w-7xl mx-auto">
        <div>
          <Link to="/" className="font-headline font-black text-primary text-3xl mb-4 block">
            RaahBar
          </Link>
          <p className="font-body text-sm tracking-wide text-on-background/50 max-w-sm uppercase">
            © 2024 RaahBar. Plan Your Ride North. Built for Pakistani roads and mountain passes.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 content-start">
          <Link to="/passes" className="font-body text-sm text-on-background/40 hover:text-secondary transition-all text-left">Road Safety</Link>
          <Link to="/passes" className="font-body text-sm text-on-background/40 hover:text-secondary transition-all text-left">Pass Status</Link>
          <Link to="/guesthouses" className="font-body text-sm text-on-background/40 hover:text-secondary transition-all text-left">Guesthouses</Link>
          <Link to="/planner" className="font-body text-sm text-on-background/40 hover:text-secondary transition-all text-left">Plan a Trip</Link>
        </div>
      </div>
    </footer>
  );
}
