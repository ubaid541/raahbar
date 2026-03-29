export interface MountainPass {
  id: string;
  name: string;
  status: 'OPEN' | 'CLOSED';
  altitude: number;
  season: string;
  roadCondition: string;
  imageUrl: string;
}

export interface Guesthouse {
  id: string;
  name: string;
  location: string;
  region: string;
  priceLevel: number; // 1 to 3 ($ to $$$)
  description: string;
  imageUrl: string;
  isRiderFriendly: boolean;
  isBudgetPro?: boolean;
}

export interface RouteDay {
  day: number;
  route: string;
  checkpoint: string;
  checkpointNote?: string;
  altitude: number;
  altitudeTrend: 'up' | 'down' | 'warning';
  sleepLocation: string;
}

export type Screen = 'home' | 'planner' | 'guesthouses' | 'passes';
