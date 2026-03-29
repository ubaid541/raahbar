import { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, RefreshCw, Route } from 'lucide-react';
import TripForm from '../components/TripForm.jsx';
import ItineraryOutput from '../components/ItineraryOutput.jsx';

const PLANNER_HERO = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80&auto=format&fit=crop';

export default function Planner() {
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
    >
      {/* Hero Banner */}
      <section className="relative h-[353px] rounded-3xl overflow-hidden flex flex-col justify-end p-8 md:p-12">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover"
            src={PLANNER_HERO}
            alt="Mountain road for trip planning"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
        </div>
        <div className="relative z-10 space-y-2">
          <span className="font-label text-xs font-black uppercase tracking-[0.3em] text-secondary">Route Planning</span>
          <h2 className="font-headline text-4xl md:text-6xl font-bold tracking-tighter">Mission Control.</h2>
          <p className="max-w-xl text-on-surface-variant font-medium">
            Engineer your journey through the high passes of the Karakoram. Real-time logistics for the serious rider.
          </p>
        </div>
      </section>

      {/* Error Alert */}
      {error && (
        <div className="relative overflow-hidden bg-error-container/20 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 border-l-4 border-error">
          <AlertTriangle className="text-error w-8 h-8 shrink-0" />
          <div className="flex-grow">
            <p className="font-label text-xs font-black uppercase text-error">Error</p>
            <p className="text-on-background font-semibold">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="bg-error px-6 py-2 rounded-full font-bold text-background text-sm hover:scale-105 transition-transform min-h-[48px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <TripForm
          onResult={setItinerary}
          onLoading={setLoading}
          onError={setError}
        />

        <section className="lg:col-span-8 space-y-12">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <div className="relative">
                <Route className="w-16 h-16 text-primary animate-pulse" />
                <RefreshCw className="w-8 h-8 text-secondary animate-spin absolute -bottom-2 -right-2" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-headline text-2xl font-bold">RaahBar is planning your route...</p>
                <p className="text-on-surface-variant font-label text-sm uppercase tracking-widest">Analyzing passes, fuel stops & altitude risks</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !itinerary && !error && (
            <div className="flex flex-col items-center justify-center py-24 gap-6 border border-dashed border-white/10 rounded-3xl">
              <Route className="w-16 h-16 text-on-surface-variant opacity-30" />
              <div className="text-center space-y-2">
                <p className="font-headline text-2xl font-bold text-on-surface-variant opacity-50">Your itinerary will appear here</p>
                <p className="text-on-surface-variant opacity-40 font-label text-sm uppercase tracking-widest">Fill in the form and hit Generate</p>
              </div>
            </div>
          )}

          {/* Itinerary Output */}
          {!loading && itinerary && (
            <ItineraryOutput itinerary={itinerary} />
          )}
        </section>
      </div>
    </motion.div>
  );
}
