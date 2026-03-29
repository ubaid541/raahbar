import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { fetchGuesthouses } from '../lib/supabase.js';
import GuesthouseCard from '../components/GuesthouseCard.jsx';

const REGIONS = ['All Regions', 'GB', 'KPK', 'AJK'];
const REGION_LABELS = { GB: 'Gilgit Baltistan', KPK: 'Khyber Pakhtunkhwa', AJK: 'Azad Jammu & Kashmir' };

export default function Guesthouses() {
  const [guesthouses, setGuesthouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [region, setRegion] = useState('All Regions');

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await fetchGuesthouses();
    if (err) {
      setError('Failed to load guesthouses. Please try again.');
    } else {
      setGuesthouses(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = region === 'All Regions'
    ? guesthouses
    : guesthouses.filter((g) => g.region === region);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
    >
      <section>
        <span className="font-label text-xs uppercase tracking-widest text-tertiary mb-2 block font-bold">Basecamp Selection</span>
        <h2 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-6">
          SHELTER FROM <br /><span className="text-tertiary">THE STORM.</span>
        </h2>
        <p className="max-w-xl text-on-surface-variant font-medium leading-relaxed">
          Curated guesthouses across the northern territories that understand the soul of a rider. Secure parking, warm meals, and mechanics on call.
        </p>
      </section>

      {/* Region Filter */}
      <div className="flex flex-wrap gap-3">
        {REGIONS.map((r) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className={`px-6 py-3 rounded-full font-label font-bold text-xs uppercase tracking-widest transition-all active:scale-95 min-h-[48px] ${region === r ? 'bg-tertiary text-background' : 'bg-surface-high text-on-surface-variant hover:bg-surface-highest'}`}
          >
            {r === 'All Regions' ? r : REGION_LABELS[r] || r}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-24 gap-4">
          <RefreshCw className="w-8 h-8 text-tertiary animate-spin" />
          <p className="font-headline text-xl font-bold text-on-surface-variant">Loading guesthouses...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <p className="font-headline text-2xl font-bold text-error">{error}</p>
          <button
            onClick={load}
            className="bg-tertiary text-background px-8 py-4 rounded-xl font-label font-bold text-xs uppercase tracking-widest hover:bg-tertiary-container transition-all min-h-[48px]"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 border border-dashed border-white/10 rounded-3xl">
          <p className="font-headline text-2xl font-bold text-on-surface-variant opacity-50">No guesthouses found</p>
          <p className="text-on-surface-variant opacity-40 font-label text-sm uppercase tracking-widest">Try a different region filter</p>
        </div>
      )}

      {/* Guesthouse Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {filtered.map((gh, idx) => (
            <GuesthouseCard key={gh.id} guesthouse={gh} isWide={idx % 3 === 0} />
          ))}
        </div>
      )}

      {/* Rider Tips */}
      <section className="bg-tertiary-container/10 border border-tertiary/20 rounded-3xl p-8 md:p-12">
        <h2 className="font-headline text-3xl font-bold uppercase tracking-tight mb-8">Insider Rider Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Book Early', body: 'During June–August, popular spots in Hunza and Skardu fill up 4 weeks in advance. WhatsApp at least 48 hours before arrival.' },
            { title: 'Parking Security', body: 'Look for "Walled Parking". All "Rider Friendly" tagged spots have gated or guarded bike areas.' },
            { title: 'Power Backup', body: 'Outages are frequent. Guesthouses with solar backup are prioritized to ensure you can charge your gear.' },
          ].map((tip) => (
            <div key={tip.title}>
              <h4 className="font-headline text-lg font-bold text-tertiary mb-3 uppercase tracking-wider">{tip.title}</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">{tip.body}</p>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
