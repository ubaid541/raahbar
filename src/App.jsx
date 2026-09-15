import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';

import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import BottomNav from './components/BottomNav.jsx';
import Home from './pages/Home.jsx';
import Planner from './pages/Planner.jsx';
// import Guesthouses from './pages/Guesthouses.jsx';
// import PassStatus from './pages/PassStatus.jsx';

export default function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-primary/30">
      <Navbar />

      <main className="pt-28 pb-32 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/planner" element={<Planner />} />
            {/* <Route path="/guesthouses" element={<Guesthouses />} /> */}
            {/* <Route path="/passes" element={<PassStatus />} /> */}
          </Routes>
        </AnimatePresence>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
