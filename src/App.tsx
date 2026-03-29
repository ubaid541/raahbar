/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  RefreshCw, 
  MapPin, 
  MessageSquare, 
  Map as MapIcon, 
  CloudLightning, 
  ArrowRight, 
  Home as HomeIcon, 
  Route as RouteIcon, 
  Bed, 
  Mountain,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  FileText,
  TrendingUp,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen, MountainPass, Guesthouse, RouteDay } from './types';
import { MOUNTAIN_PASSES, GUESTHOUSES, MOCK_ROUTE } from './constants';

// --- Components ---

const TopAppBar = ({ currentScreen }: { currentScreen: Screen }) => (
  <header className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-md border-b border-white/5">
    <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Menu className="text-primary w-6 h-6" />
        <h1 className="text-2xl font-bold tracking-tighter text-primary uppercase font-headline">Ride North</h1>
      </div>
      <nav className="hidden md:flex items-center gap-8 font-label text-[10px] uppercase font-bold tracking-widest">
        <a className={`transition-colors duration-300 ${currentScreen === 'home' ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-background opacity-80 hover:opacity-100'}`} href="#">Home</a>
        <a className={`transition-colors duration-300 ${currentScreen === 'planner' ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-background opacity-80 hover:opacity-100'}`} href="#">Planner</a>
        <a className={`transition-colors duration-300 ${currentScreen === 'guesthouses' ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-background opacity-80 hover:opacity-100'}`} href="#">Guesthouses</a>
        <a className={`transition-colors duration-300 ${currentScreen === 'passes' ? 'text-primary border-b-2 border-primary pb-1' : 'text-on-background opacity-80 hover:opacity-100'}`} href="#">Passes</a>
      </nav>
      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 bg-surface-highest">
        <img 
          alt="User profile avatar" 
          className="w-full h-full object-cover" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBM5xXB4ozzxJULMKXqNCI3S5mU6UltjubowKRJiSAm2kXwZiqjnycmy-5Tn8r_dAD--UCAsOOmLhqVezmdPFLy9NZRLgNsjP6OcIFSTqanQRNqOlZm2VJWtHf1Qw1UuAkdVy-yVEGx-BMHGJAEWw5b8cEXNUTKB_S0rn2Mmxsw9hfbzdiyKVwp2xVW85gWcAIw16UeC2jux1uq0860AQDzXBlTSh4oAF0y8WONHVv-U75G1SzBFcAgfuG1XjZWtNImLrDndOwGHrA"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  </header>
);

const BottomNavBar = ({ currentScreen, setScreen }: { currentScreen: Screen, setScreen: (s: Screen) => void }) => (
  <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 md:hidden bg-background/80 backdrop-blur-xl border-t border-white/5 rounded-t-2xl">
    <button 
      onClick={() => setScreen('home')}
      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${currentScreen === 'home' ? 'bg-primary/20 text-primary scale-105' : 'text-on-background/60'}`}
    >
      <HomeIcon className="w-6 h-6 mb-1" />
      <span className="font-label text-[10px] uppercase font-bold">Home</span>
    </button>
    <button 
      onClick={() => setScreen('planner')}
      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${currentScreen === 'planner' ? 'bg-primary/20 text-primary scale-105' : 'text-on-background/60'}`}
    >
      <RouteIcon className="w-6 h-6 mb-1" />
      <span className="font-label text-[10px] uppercase font-bold">Planner</span>
    </button>
    <button 
      onClick={() => setScreen('guesthouses')}
      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${currentScreen === 'guesthouses' ? 'bg-primary/20 text-primary scale-105' : 'text-on-background/60'}`}
    >
      <Bed className="w-6 h-6 mb-1" />
      <span className="font-label text-[10px] uppercase font-bold">Beds</span>
    </button>
    <button 
      onClick={() => setScreen('passes')}
      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${currentScreen === 'passes' ? 'bg-primary/20 text-primary scale-105' : 'text-on-background/60'}`}
    >
      <Mountain className="w-6 h-6 mb-1" />
      <span className="font-label text-[10px] uppercase font-bold">Passes</span>
    </button>
  </nav>
);

// --- Screens ---

const PassesScreen = ({ key }: { key?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-12"
  >
    <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="space-y-2">
        <span className="font-label text-xs uppercase tracking-[0.3em] text-tertiary font-bold">Real-time Expedition Data</span>
        <h2 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter text-on-surface">Mountain Pass <span className="text-primary italic">Status</span></h2>
      </div>
      <div className="flex items-center gap-3 bg-surface-high px-4 py-2 rounded-xl border border-white/5">
        <RefreshCw className="text-secondary animate-spin-slow w-5 h-5" />
        <div className="flex flex-col">
          <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">Last Updated</span>
          <span className="font-headline text-sm font-bold text-on-surface">Oct 24, 14:32 GMT+5</span>
        </div>
      </div>
    </section>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {MOUNTAIN_PASSES.map((pass) => (
        <div key={pass.id} className="group relative overflow-hidden bg-surface rounded-2xl flex flex-col h-full border border-white/5 shadow-2xl transition-all duration-500 hover:bg-surface-high">
          <div className="h-48 overflow-hidden relative">
            <img 
              className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" 
              src={pass.imageUrl} 
              alt={pass.name}
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-4 right-4">
              <span className={`font-label text-xs font-black px-3 py-1.5 rounded-lg tracking-tighter uppercase ring-1 ${pass.status === 'OPEN' ? 'bg-secondary-container text-secondary ring-secondary/20' : 'bg-error-container text-error ring-error/20'}`}>
                {pass.status}
              </span>
            </div>
            <div className="absolute bottom-4 left-4">
              <span className="font-headline text-2xl font-black text-white drop-shadow-lg">{pass.name}</span>
            </div>
          </div>
          <div className="p-6 space-y-4 flex-grow">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="font-label text-[10px] uppercase text-on-surface-variant">Altitude</span>
                <p className="font-headline text-lg font-bold">{pass.altitude.toLocaleString()}<span className="text-xs ml-1 text-on-surface-variant font-normal">m</span></p>
              </div>
              <div className="space-y-1">
                <span className="font-label text-[10px] uppercase text-on-surface-variant">Season</span>
                <p className="font-label text-xs font-bold uppercase tracking-tight">{pass.season}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-white/5 space-y-2">
              <span className="font-label text-[10px] uppercase text-primary font-bold tracking-widest">Road Condition</span>
              <p className="text-sm text-on-surface-variant leading-relaxed">{pass.roadCondition}</p>
            </div>
          </div>
        </div>
      ))}
    </div>

    <section className="bg-tertiary/10 border-l-4 border-tertiary p-8 rounded-r-2xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex gap-4">
          <div className="bg-tertiary-container/20 p-3 rounded-xl">
            <CloudLightning className="text-tertiary w-6 h-6" />
          </div>
          <div>
            <h3 className="font-headline text-xl font-bold">Meteorological Advisory</h3>
            <p className="text-on-surface-variant text-sm max-w-xl">A western disturbance is expected to hit the Gilgit-Baltistan region starting Thursday. Expect sudden drops in visibility and temperature across all passes above 3,500m.</p>
          </div>
        </div>
        <button className="bg-primary hover:bg-primary-container text-background font-headline font-bold px-8 py-4 rounded-xl transition-all flex items-center gap-2 group">
          Full Weather Forecast
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </section>
  </motion.div>
);

const GuesthousesScreen = ({ key }: { key?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-12"
  >
    <section>
      <span className="font-label text-xs uppercase tracking-widest text-tertiary mb-2 block font-bold">Basecamp Selection</span>
      <h2 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-6">SHELTER FROM <br/><span className="text-tertiary">THE STORM.</span></h2>
      <p className="max-w-xl text-on-surface-variant font-medium leading-relaxed">Curated list of guesthouses across the northern territories that understand the soul of a rider. Secure parking, warm meals, and mechanics on call.</p>
    </section>

    <div className="flex flex-wrap gap-3">
      <button className="px-6 py-3 rounded-full bg-tertiary text-background font-label font-bold text-xs uppercase tracking-widest transition-transform active:scale-95">All Regions</button>
      <button className="px-6 py-3 rounded-full bg-surface-high text-on-surface-variant font-label font-bold text-xs uppercase tracking-widest hover:bg-surface-highest transition-all active:scale-95">Gilgit Baltistan</button>
      <button className="px-6 py-3 rounded-full bg-surface-high text-on-surface-variant font-label font-bold text-xs uppercase tracking-widest hover:bg-surface-highest transition-all active:scale-95">Khyber Pakhtunkhwa</button>
      <button className="px-6 py-3 rounded-full bg-surface-high text-on-surface-variant font-label font-bold text-xs uppercase tracking-widest hover:bg-surface-highest transition-all active:scale-95">Azad Jammu & Kashmir</button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      {GUESTHOUSES.map((gh, idx) => {
        const isWide = idx % 3 === 0;
        return (
          <div key={gh.id} className={`${isWide ? 'md:col-span-8' : 'md:col-span-4'} group relative overflow-hidden rounded-2xl bg-surface transition-all duration-500 hover:shadow-2xl hover:shadow-tertiary/10`}>
            <div className={`grid grid-cols-1 ${isWide ? 'md:grid-cols-2' : ''} h-full`}>
              <div className={`relative ${isWide ? 'h-64 md:h-full' : 'h-48'} overflow-hidden`}>
                <img 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  src={gh.imageUrl} 
                  alt={gh.name}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  {gh.isRiderFriendly && (
                    <span className="bg-secondary text-secondary-container px-3 py-1 rounded-lg font-label text-[10px] font-black uppercase tracking-tighter">Rider Friendly</span>
                  )}
                  {gh.isBudgetPro && (
                    <span className="bg-primary/20 backdrop-blur-md text-primary px-3 py-1 rounded-lg font-label text-[10px] font-black uppercase tracking-tighter">Budget Pro</span>
                  )}
                </div>
              </div>
              <div className="p-8 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className={`font-headline ${isWide ? 'text-3xl' : 'text-2xl'} font-bold mb-1`}>{gh.name}</h3>
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <MapPin className="w-3 h-3" />
                        <span className="font-label text-xs uppercase tracking-wide">{gh.location}</span>
                      </div>
                    </div>
                    <span className="font-headline text-xl text-tertiary font-bold">
                      {Array(gh.priceLevel).fill('$').join('')}
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">{gh.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <a className="flex-1 bg-tertiary text-background py-3 rounded-xl font-label font-bold text-xs uppercase tracking-widest text-center transition-all hover:bg-tertiary-container flex items-center justify-center gap-2" href="#">
                    <MessageSquare className="w-4 h-4 fill-current" />
                    WhatsApp Contact
                  </a>
                  {isWide && (
                    <button className="w-12 h-12 rounded-xl bg-surface-highest flex items-center justify-center text-tertiary transition-colors hover:bg-tertiary hover:text-background">
                      <MapIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>

    <section className="bg-tertiary-container/10 border border-tertiary/20 rounded-3xl p-8 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
        <CloudLightning className="w-[160px] h-[160px]" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <CloudLightning className="text-tertiary w-8 h-8 fill-current" />
          <h2 className="font-headline text-3xl font-bold uppercase tracking-tight">Insider Rider Tips</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-headline text-lg font-bold text-tertiary mb-3 uppercase tracking-wider">Booking Early</h4>
            <p className="text-sm text-on-surface-variant leading-relaxed">During June-August, popular rider stops in Hunza and Skardu fill up 4 weeks in advance. Always WhatsApp at least 48 hours before arrival to confirm secure parking availability.</p>
          </div>
          <div>
            <h4 className="font-headline text-lg font-bold text-tertiary mb-3 uppercase tracking-wider">Parking Security</h4>
            <p className="text-sm text-on-surface-variant leading-relaxed">Look for 'Walled Parking'. Many roadside guesthouses offer parking but lacks security. All 'Rider-Friendly' tagged spots here have gated or guarded bike areas.</p>
          </div>
          <div>
            <h4 className="font-headline text-lg font-bold text-tertiary mb-3 uppercase tracking-wider">Alt-Amenities</h4>
            <p className="text-sm text-on-surface-variant leading-relaxed">Power outages are frequent. Guesthouses with dedicated solar backup are prioritized in our list. Look for the 'Solar' icon in detailed views to ensure you can charge your gear.</p>
          </div>
        </div>
      </div>
    </section>
  </motion.div>
);

const PlannerScreen = ({ key }: { key?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-12"
  >
    <section className="relative h-[353px] rounded-3xl overflow-hidden flex flex-col justify-end p-8 md:p-12">
      <div className="absolute inset-0 z-0">
        <img 
          className="w-full h-full object-cover" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgMM6WjersUjea22rmrd6zj2HDKy5P50LPoE0wrFrAgw8ZJEsFFAC8hEI9Kje_xWR4kAne26qmR4agzYaMykfSq_umVgWueFod1ynrrDKpr-KZFNA3ePTaZkedpKaQmX36v_vle_vE0KPji1zu5CLPqvhc0dkO-baKjrwQV8ApykCPsRMLulAaK--UJZSEUap5sIOUNOp5TjRGLzqOCewWpaJxyVdZQV31Upo9bqubYwiXlvyl1M_nbE3nvpyuJm-DmnxDRNGNtxw" 
          alt="Mission Control"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
      </div>
      <div className="relative z-10 space-y-2">
        <span className="font-label text-xs font-black uppercase tracking-[0.3em] text-secondary">Route Planning</span>
        <h2 className="font-headline text-4xl md:text-6xl font-bold tracking-tighter">Mission Control.</h2>
        <p className="max-w-xl text-on-surface-variant font-medium">Engineer your journey through the high passes of the Karakoram. Real-time logistics for the serious rider.</p>
      </div>
    </section>

    <div className="relative overflow-hidden bg-error-container/20 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 border-l-4 border-error">
      <AlertTriangle className="text-error w-8 h-8 shrink-0" />
      <div className="flex-grow">
        <p className="font-label text-xs font-black uppercase text-error">Active Road Alert</p>
        <p className="text-on-background font-semibold">Babusar Pass remains CLOSED due to unseasonal snowfall. Expect diversions via KKH. Last check: 45 mins ago.</p>
      </div>
      <button className="bg-error px-6 py-2 rounded-full font-bold text-background text-sm hover:scale-105 transition-transform">Details</button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <section className="lg:col-span-4 bg-surface rounded-3xl p-8 space-y-8 sticky top-28">
        <div className="space-y-1">
          <h3 className="font-headline text-2xl font-bold">Parameters</h3>
          <p className="text-on-surface-variant text-sm font-label">Configure your expedition profile</p>
        </div>
        <form className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-outline">Start City</label>
              <input className="w-full bg-surface-highest border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-on-surface font-semibold" type="text" defaultValue="Islamabad" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-outline">Destination</label>
              <input className="w-full bg-surface-highest border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-on-surface font-semibold" placeholder="e.g. Khunjerab Pass" type="text" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline">Days</label>
                <select className="w-full bg-surface-highest border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-on-surface font-semibold">
                  <option>7 Days</option>
                  <option>10 Days</option>
                  <option>14 Days</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline">Month</label>
                <select className="w-full bg-surface-highest border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-on-surface font-semibold">
                  <option>July</option>
                  <option>August</option>
                  <option>September</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-outline">Bike Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button className="bg-primary text-background p-3 rounded-xl font-bold text-xs uppercase" type="button">Adventure</button>
                <button className="bg-surface-highest text-on-surface-variant p-3 rounded-xl font-bold text-xs uppercase hover:bg-surface-bright" type="button">Scrambler</button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-outline">Exp Level</label>
              <input className="w-full accent-primary" type="range" />
              <div className="flex justify-between text-[10px] text-outline font-bold uppercase">
                <span>Rookie</span>
                <span className="text-primary">Veteran</span>
              </div>
            </div>
          </div>
          <button className="w-full bg-gradient-to-r from-primary to-primary-container py-4 rounded-xl font-black font-headline text-background uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-primary/20">Generate Expedition</button>
        </form>
      </section>

      <section className="lg:col-span-8 space-y-12">
        <div className="bg-secondary-container/10 rounded-3xl p-1 border border-secondary/10 overflow-hidden">
          <div className="bg-secondary-container/20 p-8 rounded-[1.4rem] space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="bg-secondary text-secondary-container px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-label">AI Optimized Route</span>
                <h3 className="text-3xl font-headline font-bold mt-2">The High Road: Gilgit & Beyond</h3>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-secondary font-headline font-bold text-xl">1,240 <span className="text-xs text-outline uppercase font-label">KM</span></span>
              </div>
            </div>

            <div className="space-y-6">
              {MOCK_ROUTE.map((day) => (
                <div key={day.day} className="group relative bg-surface rounded-2xl p-6 transition-all hover:bg-surface-high cursor-pointer">
                  <div className="absolute -left-3 top-6 w-1 h-12 bg-secondary rounded-full"></div>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-32 shrink-0">
                      <p className="font-headline text-4xl font-bold text-outline-variant group-hover:text-secondary transition-colors">0{day.day}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-outline">{day.route}</p>
                    </div>
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Checkpoint</p>
                        <p className="font-bold">{day.checkpoint}</p>
                        {day.checkpointNote && <p className="text-xs text-on-surface-variant italic">{day.checkpointNote}</p>}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Altitude</p>
                        <p className="font-headline font-bold">
                          {day.altitude.toLocaleString()}m 
                          {day.altitudeTrend === 'up' && <TrendingUp className="w-4 h-4 inline ml-1" />}
                          {day.altitudeTrend === 'warning' && <AlertTriangle className="w-4 h-4 inline ml-1 text-error" />}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Sleep</p>
                        <p className="font-bold text-tertiary">{day.sleepLocation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface rounded-3xl p-8 border-t-8 border-primary">
            <div className="flex items-center gap-3 mb-6">
              <Wrench className="text-primary w-6 h-6" />
              <h4 className="font-headline text-xl font-bold uppercase tracking-tight">Essential Gear</h4>
            </div>
            <ul className="space-y-4">
              {['Dual-sport Helmet (ECE Rated)', 'Thermal Base Layers', 'Tire Plug Kit & Mini-Pump'].map((item) => (
                <li key={item} className="flex items-center gap-4 group">
                  <div className="w-6 h-6 rounded border-2 border-outline-variant group-hover:border-primary transition-colors flex items-center justify-center">
                    <CheckCircle2 className="text-primary w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="font-medium text-on-surface-variant group-hover:text-on-surface">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-surface rounded-3xl p-8 border-t-8 border-tertiary">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="text-tertiary w-6 h-6" />
              <h4 className="font-headline text-xl font-bold uppercase tracking-tight">Travel Permits</h4>
            </div>
            <div className="space-y-6">
              <div className="bg-surface-highest p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-bold">GB Entry Permit</p>
                  <p className="text-[10px] text-outline uppercase font-black">Required for foreigners</p>
                </div>
                <CheckCircle2 className="text-secondary w-5 h-5" />
              </div>
              <div className="bg-surface-highest p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-bold">Khunjerab Border Pass</p>
                  <p className="text-[10px] text-outline uppercase font-black">Local checkpoint only</p>
                </div>
                <Clock className="text-outline-variant w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </motion.div>
);

const HomeScreen = ({ setScreen, key }: { setScreen: (s: Screen) => void, key?: string }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="space-y-20"
  >
    <section className="relative h-[600px] rounded-[2rem] overflow-hidden flex flex-col justify-center items-center text-center p-8">
      <div className="absolute inset-0 z-0">
        <img 
          className="w-full h-full object-cover grayscale opacity-40" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgMM6WjersUjea22rmrd6zj2HDKy5P50LPoE0wrFrAgw8ZJEsFFAC8hEI9Kje_xWR4kAne26qmR4agzYaMykfSq_umVgWueFod1ynrrDKpr-KZFNA3ePTaZkedpKaQmX36v_vle_vE0KPji1zu5CLPqvhc0dkO-baKjrwQV8ApykCPsRMLulAaK--UJZSEUap5sIOUNOp5TjRGLzqOCewWpaJxyVdZQV31Upo9bqubYwiXlvyl1M_nbE3nvpyuJm-DmnxDRNGNtxw" 
          alt="Hero"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background to-background"></div>
      </div>
      <div className="relative z-10 space-y-6 max-w-4xl">
        <span className="font-label text-sm uppercase tracking-[0.5em] text-primary font-black">Built for the Karakoram</span>
        <h1 className="font-headline text-6xl md:text-9xl font-black tracking-tighter leading-none">THE NORTH <br/><span className="italic text-primary">AWAITS.</span></h1>
        <p className="text-xl text-on-surface-variant max-w-2xl mx-auto font-medium">Real-time road logistics, curated basecamps, and AI-engineered routes for the world's most challenging terrain.</p>
        <div className="flex flex-wrap justify-center gap-4 pt-8">
          <button onClick={() => setScreen('planner')} className="bg-primary text-background px-10 py-5 rounded-2xl font-headline font-black text-lg uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-primary/20">Start Planning</button>
          <button onClick={() => setScreen('passes')} className="bg-surface-high border border-white/10 text-on-surface px-10 py-5 rounded-2xl font-headline font-black text-lg uppercase tracking-widest hover:bg-surface-highest transition-all">Check Passes</button>
        </div>
      </div>
    </section>

    <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="p-8 rounded-3xl bg-surface border border-white/5 space-y-4">
        <RefreshCw className="text-secondary w-10 h-10" />
        <h3 className="font-headline text-2xl font-bold">Live Logistics</h3>
        <p className="text-on-surface-variant">Real-time status of high-altitude passes, weather advisories, and road blockages updated by local scouts.</p>
      </div>
      <div className="p-8 rounded-3xl bg-surface border border-white/5 space-y-4">
        <Bed className="text-tertiary w-10 h-10" />
        <h3 className="font-headline text-2xl font-bold">Rider Basecamps</h3>
        <p className="text-on-surface-variant">Hand-picked guesthouses with secure motorcycle parking, mechanics on call, and hot showers.</p>
      </div>
      <div className="p-8 rounded-3xl bg-surface border border-white/5 space-y-4">
        <RouteIcon className="text-primary w-10 h-10" />
        <h3 className="font-headline text-2xl font-bold">AI Engineering</h3>
        <p className="text-on-surface-variant">Custom expedition routes optimized for your bike type, experience level, and seasonal constraints.</p>
      </div>
    </section>
  </motion.div>
);

// --- Main App ---

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');

  // Scroll to top on screen change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-primary/30">
      <TopAppBar currentScreen={screen} />
      
      <main className="pt-28 pb-32 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {screen === 'home' && <HomeScreen key="home" setScreen={setScreen} />}
          {screen === 'planner' && <PlannerScreen key="planner" />}
          {screen === 'guesthouses' && <GuesthousesScreen key="guesthouses" />}
          {screen === 'passes' && <PassesScreen key="passes" />}
        </AnimatePresence>
      </main>

      <footer className="w-full py-12 border-t border-white/5 bg-background mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-8 py-16 max-w-7xl mx-auto">
          <div>
            <h2 className="font-headline font-black text-primary text-3xl mb-4">RIDE NORTH</h2>
            <p className="font-body text-sm tracking-wide text-on-background/50 max-w-sm uppercase">
              © 2024 RIDE NORTH. BUILT FOR THE KARAKORAM. MISSION CRITICAL DATA FOR THE BOLD.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <a className="font-body text-sm text-on-background/40 hover:text-secondary transition-all" href="#">Road Safety</a>
            <a className="font-body text-sm text-on-background/40 hover:text-secondary transition-all" href="#">Permit Guide</a>
            <a className="font-body text-sm text-on-background/40 hover:text-secondary transition-all" href="#">Emergency Contacts</a>
            <a className="font-body text-sm text-on-background/40 hover:text-secondary transition-all" href="#">Weather API</a>
          </div>
        </div>
      </footer>

      <BottomNavBar currentScreen={screen} setScreen={setScreen} />
    </div>
  );
}
