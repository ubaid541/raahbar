import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Loader2 } from 'lucide-react';
import { generateItinerary } from '../lib/openrouter.js';
import { searchLocations } from '../lib/routing.js';

const BIKE_TYPES = ['125cc', '150cc', '250cc', 'Adventure', 'Scrambler'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAYS_OPTIONS = [
  { value: 'Auto', label: 'Auto (Recommended)' },
  { value: '2', label: '2 Days' },
  { value: '3', label: '3 Days' },
  { value: '5', label: '5 Days' },
  { value: '7', label: '7 Days' },
  { value: '10', label: '10 Days' },
  { value: '14', label: '14 Days' },
];

/**
 * Reusable Hybrid Verified + Nominatim Autocomplete Input for Start City & Destination
 */
function LocationAutocompleteInput({ id, name, label, value, onChange, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const nextVal = e.target.value.slice(0, 200);
    onChange(nextVal);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (nextVal.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsSearching(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsSearching(true);
      const results = await searchLocations(nextVal, controller.signal);
      if (!controller.signal.aborted) {
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelect = (item) => {
    onChange(item.name);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label
        htmlFor={id}
        className="block text-[10px] font-black uppercase tracking-widest text-outline"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          className="w-full bg-surface-highest border-none rounded-xl py-3 pl-4 pr-9 focus:ring-2 focus:ring-primary text-on-surface font-semibold outline-none"
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <MapPin className="w-4 h-4 opacity-50" />
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-40 left-0 right-0 mt-1 bg-surface-highest border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-white/5">
          {suggestions.map((item, idx) => (
            <li key={`${item.name}-${idx}`}>
              <button
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-4 py-2.5 hover:bg-primary/15 transition-colors flex items-center justify-between gap-2"
              >
                <span className="font-bold text-xs text-on-surface">{item.name}</span>
                <span className="text-[10px] text-on-surface-variant font-label uppercase tracking-wider truncate max-w-[165px]">
                  {item.region}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function TripForm({ onResult, onLoading, onError, onProgress }) {
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    from: searchParams.get('from') || 'Islamabad',
    to: searchParams.get('to') || '',
    days: searchParams.get('days') || 'Auto',
    month: searchParams.get('month') || 'July',
    bikeType: searchParams.get('bike') || 'Adventure',
    expLevel: searchParams.get('exp') ? Number(searchParams.get('exp')) : 50,
  });

  useEffect(() => {
    const qFrom = searchParams.get('from');
    const qTo = searchParams.get('to');
    const qDays = searchParams.get('days');
    const qBike = searchParams.get('bike');
    const qExp = searchParams.get('exp');

    if (qFrom || qTo || qDays || qBike || qExp) {
      setForm((prev) => ({
        ...prev,
        from: qFrom || prev.from,
        to: qTo || prev.to,
        days: qDays || prev.days,
        bikeType: qBike || prev.bikeType,
        expLevel: qExp ? Number(qExp) : prev.expLevel,
      }));
    }
  }, [searchParams]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const abortControllerRef = useRef(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!form.from.trim() || !form.to.trim()) {
      onError('Please fill in both Start City and Destination.');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsSubmitting(true);
    onLoading(true);
    onError(null);
    onResult(null);

    try {
      const expLabel =
        form.expLevel < 34 ? 'Rookie' : form.expLevel < 67 ? 'Intermediate' : 'Veteran';
      const itinerary = await generateItinerary(
        { ...form, expLevel: expLabel },
        (statusMsg) => {
          if (onProgress) onProgress(statusMsg);
        },
        abortController.signal
      );

      if (!abortController.signal.aborted) {
        onResult(itinerary);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[TripForm] Previous request aborted.');
        return;
      }
      onError(err.message);
    } finally {
      if (!abortController.signal.aborted) {
        setIsSubmitting(false);
        onLoading(false);
      }
    }
  };

  return (
    <section className="lg:col-span-4 bg-surface rounded-3xl p-6 space-y-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto border border-white/5">
      <div className="space-y-1">
        <h3 className="font-headline text-2xl font-bold">Parameters</h3>
        <p className="text-on-surface-variant text-sm font-label">Configure your expedition profile</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-4">
          <LocationAutocompleteInput
            id="trip-from"
            name="from"
            label="Start City"
            value={form.from}
            onChange={(val) => handleChange('from', val)}
            placeholder="e.g. Islamabad, Lahore..."
          />

          <LocationAutocompleteInput
            id="trip-to"
            name="to"
            label="Destination"
            value={form.to}
            onChange={(val) => handleChange('to', val)}
            placeholder="e.g. Naran, Hunza, Skardu..."
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="trip-days"
                className="block text-[10px] font-black uppercase tracking-widest text-outline"
              >
                Days
              </label>
              <select
                id="trip-days"
                name="days"
                className="w-full bg-surface-highest border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-on-surface font-semibold outline-none text-sm"
                value={form.days}
                onChange={(e) => handleChange('days', e.target.value)}
              >
                {DAYS_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="trip-month"
                className="block text-[10px] font-black uppercase tracking-widest text-outline"
              >
                Month
              </label>
              <select
                id="trip-month"
                name="month"
                className="w-full bg-surface-highest border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-on-surface font-semibold outline-none text-sm"
                value={form.month}
                onChange={(e) => handleChange('month', e.target.value)}
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2" role="group" aria-labelledby="bike-type-label">
            <p
              id="bike-type-label"
              className="text-[10px] font-black uppercase tracking-widest text-outline"
            >
              Bike Type
            </p>
            <div className="grid grid-cols-3 gap-2">
              {BIKE_TYPES.map((bike) => (
                <button
                  key={bike}
                  type="button"
                  onClick={() => handleChange('bikeType', bike)}
                  className={`p-3 rounded-xl font-bold text-xs uppercase transition-all ${
                    form.bikeType === bike
                      ? 'bg-primary text-background'
                      : 'bg-surface-highest text-on-surface-variant hover:bg-surface-high'
                  }`}
                >
                  {bike}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="trip-exp"
              className="block text-[10px] font-black uppercase tracking-widest text-outline"
            >
              Experience Level
            </label>
            <input
              id="trip-exp"
              name="expLevel"
              className="w-full accent-primary"
              type="range"
              min="0"
              max="100"
              value={form.expLevel}
              onChange={(e) => handleChange('expLevel', Number(e.target.value))}
            />
            <div className="flex justify-between text-[10px] text-outline font-bold uppercase">
              <span className={form.expLevel < 34 ? 'text-primary' : 'text-outline'}>Rookie</span>
              <span className={form.expLevel >= 34 && form.expLevel < 67 ? 'text-primary' : 'text-outline'}>
                Intermediate
              </span>
              <span className={form.expLevel >= 67 ? 'text-primary' : 'text-outline'}>Veteran</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleGenerate}
          className={`w-full bg-gradient-to-r from-primary to-primary-container py-4 rounded-xl font-black font-headline text-background uppercase tracking-widest transition-all shadow-xl shadow-primary/20 min-h-[48px] ${
            isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:brightness-110'
          }`}
        >
          {isSubmitting ? 'Planning Route...' : 'Generate Expedition'}
        </button>
      </div>
    </section>
  );
}
