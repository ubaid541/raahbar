import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, CloudLightning } from 'lucide-react';
import { fetchPassStatuses } from '../lib/supabase.js';
import PassStatusBadge from '../components/PassStatusBadge.jsx';

const PASS_IMAGES = {
  'Khunjerab Pass': 'https://images.unsplash.com/photo-1547036967-23d11aacaeca?w=800&q=80&auto=format&fit=crop',
  'Babusar Pass': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80&auto=format&fit=crop',
  'Shandur Pass': 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80&auto=format&fit=crop',
  'Lowari Tunnel': 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80&auto=format&fit=crop',
  'Deosai Plains': 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&q=80&auto=format&fit=crop',
  'Broghil Pass': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&auto=format&fit=crop',
};
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&auto=format&fit=crop';

export default function PassStatus() {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchPassStatuses();
    if (err) {
      setError('Failed to load pass status data. Please try again.');
    } else {
      setPasses(data || []);
      setLastUpdated(new Date());
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
    >
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="font-label text-xs uppercase tracking-[0.3em] text-tertiary font-bold">Real-time Expedition Data</span>
          <h2 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter text-on-surface">
            Mountain Pass <span className="text-primary italic">Status</span>
          </h2>
        </div>
        <div className="flex items-center gap-3 bg-surface-high px-4 py-2 rounded-xl border border-white/5">
          <RefreshCw className={`text-secondary w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <div className="flex flex-col">
            <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Last Updated</span>
            <span className="font-headline text-sm font-bold text-on-surface">
              {lastUpdated ? lastUpdated.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }) : '—'}
            </span>
          </div>
        </div>
      </section>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-24 gap-4">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="font-headline text-xl font-bold text-on-surface-variant">Loading pass data...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <p className="font-headline text-2xl font-bold text-error">{error}</p>
          <button
            onClick={load}
            className="bg-primary text-background px-8 py-4 rounded-xl font-label font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all min-h-[48px]"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && passes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 border border-dashed border-white/10 rounded-3xl">
          <p className="font-headline text-2xl font-bold text-on-surface-variant opacity-50">No pass data available</p>
        </div>
      )}

      {/* Pass Cards Grid */}
      {!loading && !error && passes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {passes.map((pass) => (
            <div key={pass.id} className="group relative overflow-hidden bg-surface rounded-2xl flex flex-col h-full border border-white/5 shadow-2xl transition-all duration-500 hover:bg-surface-high">
              <div className="h-48 overflow-hidden relative">
                <img
                  className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                  src={PASS_IMAGES[pass.name] || DEFAULT_IMG}
                  alt={pass.name}
                  loading="lazy"
                />
                <div className="absolute top-4 right-4">
                  <PassStatusBadge status={pass.status} />
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="font-headline text-2xl font-black text-white drop-shadow-lg">{pass.name}</span>
                </div>
              </div>
              <div className="p-6 space-y-4 flex-grow">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="font-label text-[10px] uppercase text-on-surface-variant">Altitude</span>
                    <p className="font-headline text-lg font-bold">
                      {pass.altitude_m?.toLocaleString() || '—'}<span className="text-xs ml-1 text-on-surface-variant font-normal">m</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-label text-[10px] uppercase text-on-surface-variant">Open Season</span>
                    <p className="font-label text-xs font-bold uppercase tracking-tight">{pass.open_months || '—'}</p>
                  </div>
                </div>
                {pass.notes && (
                  <div className="pt-4 border-t border-white/5 space-y-2">
                    <span className="font-label text-[10px] uppercase text-primary font-bold tracking-widest">Notes</span>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{pass.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Advisory */}
      <section className="bg-tertiary/10 border-l-4 border-tertiary p-8 rounded-r-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex gap-4">
            <div className="bg-tertiary-container/20 p-3 rounded-xl">
              <CloudLightning className="text-tertiary w-6 h-6" />
            </div>
            <div>
              <h3 className="font-headline text-xl font-bold">Seasonal Advisory</h3>
              <p className="text-on-surface-variant text-sm max-w-xl">
                Pass openings vary year to year based on snowfall. Always verify with local authorities or Facebook groups before departure. Carry emergency supplies.
              </p>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
