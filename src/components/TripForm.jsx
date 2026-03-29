import { useState } from 'react';
import { generateItinerary } from '../lib/openrouter.js';

const BIKE_TYPES = ['125cc', '150cc', '250cc', 'Adventure', 'Scrambler'];
const MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November'];
const DAYS_OPTIONS = ['3', '5', '7', '10', '14'];

export default function TripForm({ onResult, onLoading, onError }) {
  const [form, setForm] = useState({
    from: 'Islamabad',
    to: '',
    days: '7',
    month: 'July',
    bikeType: 'Adventure',
    expLevel: 50,
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!form.from.trim() || !form.to.trim()) {
      onError('Please fill in both Start City and Destination.');
      return;
    }

    onLoading(true);
    onError(null);
    onResult(null);

    try {
      const expLabel = form.expLevel < 34 ? 'Rookie' : form.expLevel < 67 ? 'Intermediate' : 'Veteran';
      const itinerary = await generateItinerary({ ...form, expLevel: expLabel });
      onResult(itinerary);
    } catch (err) {
      onError(err.message);
    } finally {
      onLoading(false);
    }
  };

  return (
    <section className="lg:col-span-4 bg-surface rounded-3xl p-8 space-y-8 sticky top-28">
      <div className="space-y-1">
        <h3 className="font-headline text-2xl font-bold">Parameters</h3>
        <p className="text-on-surface-variant text-sm font-label">Configure your expedition profile</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-outline">Start City</label>
            <input
              className="w-full bg-surface-highest border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-on-surface font-semibold outline-none"
              type="text"
              value={form.from}
              onChange={(e) => handleChange('from', e.target.value.slice(0, 500))}
              placeholder="e.g. Islamabad"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-outline">Destination</label>
            <input
              className="w-full bg-surface-highest border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-on-surface font-semibold outline-none"
              type="text"
              value={form.to}
              onChange={(e) => handleChange('to', e.target.value.slice(0, 500))}
              placeholder="e.g. Khunjerab Pass"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-outline">Days</label>
              <select
                className="w-full bg-surface-highest border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-on-surface font-semibold outline-none"
                value={form.days}
                onChange={(e) => handleChange('days', e.target.value)}
              >
                {DAYS_OPTIONS.map((d) => <option key={d} value={d}>{d} Days</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-outline">Month</label>
              <select
                className="w-full bg-surface-highest border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-on-surface font-semibold outline-none"
                value={form.month}
                onChange={(e) => handleChange('month', e.target.value)}
              >
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-outline">Bike Type</label>
            <div className="grid grid-cols-3 gap-2">
              {BIKE_TYPES.map((bike) => (
                <button
                  key={bike}
                  type="button"
                  onClick={() => handleChange('bikeType', bike)}
                  className={`p-3 rounded-xl font-bold text-xs uppercase transition-all ${form.bikeType === bike ? 'bg-primary text-background' : 'bg-surface-highest text-on-surface-variant hover:bg-surface-high'}`}
                >
                  {bike}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-outline">Experience Level</label>
            <input
              className="w-full accent-primary"
              type="range"
              min="0"
              max="100"
              value={form.expLevel}
              onChange={(e) => handleChange('expLevel', Number(e.target.value))}
            />
            <div className="flex justify-between text-[10px] text-outline font-bold uppercase">
              <span>Rookie</span>
              <span className={form.expLevel >= 34 && form.expLevel < 67 ? 'text-primary' : 'text-outline'}>Intermediate</span>
              <span className={form.expLevel >= 67 ? 'text-primary' : 'text-outline'}>Veteran</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          className="w-full bg-gradient-to-r from-primary to-primary-container py-4 rounded-xl font-black font-headline text-background uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-primary/20 min-h-[48px]"
        >
          Generate Expedition
        </button>
      </div>
    </section>
  );
}
