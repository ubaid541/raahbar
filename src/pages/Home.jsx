import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Route as RouteIcon, Bed, RefreshCw } from 'lucide-react';

const HERO_IMG = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80&auto=format&fit=crop';

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-20"
    >
      {/* Hero */}
      <section className="relative h-[600px] rounded-[2rem] overflow-hidden flex flex-col justify-center items-center text-center p-8">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover grayscale opacity-40"
            src={HERO_IMG}
            alt="Mountain road in Northern Pakistan"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background to-background"></div>
        </div>
        <div className="relative z-10 space-y-6 max-w-4xl">
          <span className="font-label text-sm uppercase tracking-[0.5em] text-primary font-black">Built for the Karakoram</span>
          <h1 className="font-headline text-6xl md:text-9xl font-black tracking-tighter leading-none">
            THE NORTH <br /><span className="italic text-primary">AWAITS.</span>
          </h1>
          <p className="text-xl text-on-surface-variant max-w-2xl mx-auto font-medium">
            Real-time road logistics, curated basecamps, and AI-engineered routes for the world's most challenging terrain.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-8">
            <Link
              to="/planner"
              className="bg-primary text-background px-10 py-5 rounded-2xl font-headline font-black text-lg uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-primary/20 min-h-[48px] flex items-center justify-center"
            >
              Start Expedition Planner
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 rounded-3xl bg-surface border border-white/5 space-y-4">
          <RouteIcon className="text-secondary w-10 h-10" />
          <h3 className="font-headline text-2xl font-bold">Custom AI Routes</h3>
          <p className="text-on-surface-variant">Day-by-day expedition routing tailored to your motorcycle type, travel duration, and season.</p>
        </div>
        <div className="p-8 rounded-3xl bg-surface border border-white/5 space-y-4">
          <RefreshCw className="text-tertiary w-10 h-10" />
          <h3 className="font-headline text-2xl font-bold">Altitude & Pass Alerts</h3>
          <p className="text-on-surface-variant">Automatic altitude hypoxia warnings and pass timing guidelines embedded into every day's route.</p>
        </div>
        <div className="p-8 rounded-3xl bg-surface border border-white/5 space-y-4">
          <RouteIcon className="text-primary w-10 h-10" />
          <h3 className="font-headline text-2xl font-bold">Gear & Permit Checklist</h3>
          <p className="text-on-surface-variant">Comprehensive gear lists and travel permit requirement breakdown for high-altitude passes.</p>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="space-y-8">
        <div className="space-y-2">
          <span className="font-label text-xs uppercase tracking-[0.3em] text-tertiary font-bold">Popular Routes</span>
          <h2 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter">
            LEGENDARY <span className="text-primary italic">ROADS.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'KKH to Khunjerab', desc: 'The iconic Karakoram Highway finishing at the world\'s highest paved border crossing.', days: '7–10 Days', difficulty: 'Intermediate' },
            { title: 'Naran to Skardu', desc: 'Via Babusar Pass into the Indus valley and across to Skardu\'s desert landscape.', days: '5–7 Days', difficulty: 'Veteran' },
            { title: 'Fairy Meadows Loop', desc: 'Ride to the base of Nanga Parbat and back through the Kaghan valley.', days: '4–6 Days', difficulty: 'Rookie' },
          ].map((route) => (
            <div key={route.title} className="group bg-surface rounded-2xl overflow-hidden border border-white/5 hover:border-primary/20 transition-all">
              <div className="p-6 space-y-3">
                <h3 className="font-headline text-xl font-bold">{route.title}</h3>
                <p className="text-on-surface-variant text-sm">{route.desc}</p>
                <div className="flex gap-2 pt-2">
                  <span className="font-label text-[10px] uppercase tracking-wider bg-surface-high px-3 py-1 rounded-full">{route.days}</span>
                  <span className="font-label text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-3 py-1 rounded-full">{route.difficulty}</span>
                </div>
                <Link
                  to="/planner"
                  className="w-full mt-4 py-3 rounded-xl font-label font-bold text-xs uppercase tracking-widest border border-white/10 hover:bg-primary hover:text-background hover:border-transparent transition-all min-h-[48px] flex items-center justify-center"
                >
                  Plan This Route
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
