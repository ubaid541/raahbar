import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.info('Supabase environment variables not set. Using static fallback data for Guesthouses and Mountain Passes.');
}

const FALLBACK_GUESTHOUSES = [
  {
    id: '1',
    name: 'Hunza Serena Inn',
    location: 'Karimabad, Hunza Valley',
    region: 'GB',
    price_range: 'Luxury',
    notes: 'The gold standard for Karakoram stays. Dedicated basement parking for motorcycles, 24/7 hot showers, and mechanics on call.',
    whatsapp: '+923001234567',
    rider_friendly: true,
  },
  {
    id: '2',
    name: 'Passu Peaks Lodge',
    location: 'Passu, Gojal',
    region: 'GB',
    price_range: 'Budget',
    notes: 'Cozy rider haven right under the Passu Cones. Secure walled parking area, hot tea on arrival, and spare inner tubes available.',
    whatsapp: '+923019876543',
    rider_friendly: true,
  },
  {
    id: '3',
    name: 'Raikot Gazebo & Camps',
    location: 'Raikot Bridge, KKH',
    region: 'GB',
    price_range: 'Mid-range',
    notes: 'Ideal staging point for Fairy Meadows. Secure guarded bike garage at Raikot Bridge while you take the jeep track up.',
    whatsapp: '+923335557788',
    rider_friendly: true,
  },
  {
    id: '4',
    name: 'Naran Heights Rider Inn',
    location: 'Naran Bazaar, Kaghan Valley',
    region: 'KPK',
    price_range: 'Budget',
    notes: 'Located on Naran main bypass. Washing bay for muddy bikes after Babusar pass, warm water heaters, and tool kits on standby.',
    whatsapp: '+923124443322',
    rider_friendly: true,
  },
  {
    id: '5',
    name: 'Neelum Haven Hotel',
    location: 'Kutton, Neelum Valley',
    region: 'AJK',
    price_range: 'Mid-range',
    notes: 'Riverside guesthouse in Neelum Valley. Covered parking lot for motorbikes, generator power backup, and fresh trout meals.',
    whatsapp: '+923458889900',
    rider_friendly: true,
  },
];

const FALLBACK_PASSES = [
  {
    id: '1',
    name: 'Khunjerab Pass',
    status: 'open',
    altitude_m: 4693,
    open_months: 'April – November',
    notes: 'Paved highway. Minimal ice on northern bends. High winds reported near border gate. SCOM SIM active.',
  },
  {
    id: '2',
    name: 'Babusar Pass',
    status: 'closed',
    altitude_m: 4173,
    open_months: 'May – October',
    notes: 'Heavy snowfall at summit. Road closed for winter/early spring. Use KKH via Besham and Chilas.',
  },
  {
    id: '3',
    name: 'Shandur Pass',
    status: 'open',
    altitude_m: 3700,
    open_months: 'June – September',
    notes: 'Unpaved gravel pass connecting Chitral and Ghizer. Passable for 4x4 and dual-sport/adventure bikes.',
  },
  {
    id: '4',
    name: 'Lowari Tunnel',
    status: 'open',
    altitude_m: 3118,
    open_months: 'Year-Round',
    notes: 'Tunnel operational 24/7 for all traffic. Old high pass restricted to local transport.',
  },
  {
    id: '5',
    name: 'Deosai Plains',
    status: 'closed',
    altitude_m: 4115,
    open_months: 'June – September',
    notes: 'Second highest plateau in the world. Currently snowbound. Clearance expected mid-June.',
  },
  {
    id: '6',
    name: 'Broghil Pass',
    status: 'closed',
    altitude_m: 3882,
    open_months: 'July – September',
    notes: 'Remote high-altitude border valley in upper Chitral. Extreme terrain suitable only for experienced dual-sport riders.',
  },
];

/**
 * Fetch all guesthouses from Supabase with fallback to local mock data.
 * @returns {Promise<{ data: object[], error: object|null }>}
 */
export async function fetchGuesthouses() {
  if (!supabase) {
    return { data: FALLBACK_GUESTHOUSES, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('guesthouses')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('Supabase fetch returned error or empty, using fallback:', error?.message);
      return { data: FALLBACK_GUESTHOUSES, error: null };
    }
    return { data, error: null };
  } catch (err) {
    console.warn('Supabase fetch exception, using fallback:', err.message);
    return { data: FALLBACK_GUESTHOUSES, error: null };
  }
}

/**
 * Fetch all pass statuses from Supabase with fallback to local mock data.
 * @returns {Promise<{ data: object[], error: object|null }>}
 */
export async function fetchPassStatuses() {
  if (!supabase) {
    return { data: FALLBACK_PASSES, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('pass_status')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('Supabase fetch returned error or empty, using fallback:', error?.message);
      return { data: FALLBACK_PASSES, error: null };
    }
    return { data, error: null };
  } catch (err) {
    console.warn('Supabase fetch exception, using fallback:', err.message);
    return { data: FALLBACK_PASSES, error: null };
  }
}

