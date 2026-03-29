import { MountainPass, Guesthouse, RouteDay } from './types';

export const MOUNTAIN_PASSES: MountainPass[] = [
  {
    id: 'khunjerab',
    name: 'KHUNJERAB',
    status: 'OPEN',
    altitude: 4693,
    season: 'MAY — NOV',
    roadCondition: 'Paved highway. Minimal ice on northern bends. High winds reported near the border gate.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfZcsrv8cftE3PHdfJty9xCcQaqgDZ1h5bwqprgiph9Rw5TXt8UAoVmKUAk1kArXeHQBr7_T-VJLGXvGpT-TAWg7QdVFhCq7cgtS7SJ1vvxPwqeBzfshsQcyAgamLryBonMjl_txIkYRzEHM26cw_YV9FSM_ZmYnFSI-CkY-NBtKtNBaguCHBtuJhK3GpwJMmHc9O3aMYcevd-RsziHAxmXjnfFc7jcJhc-gfjBK4UygEcnREGfP1MYoM9u59MLI1AsnAIEh-1nSU',
  },
  {
    id: 'babusar',
    name: 'BABUSAR',
    status: 'CLOSED',
    altitude: 4173,
    season: 'JUN — OCT',
    roadCondition: 'Heavy snowfall at summit. Road blocked by landslide at KM 142. Clearance expected in 48h.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoumGZnLDjfeFOb7hWxBH6DHlRW0X5ZNhW0z430JH6-7qqtnXQBVqDDaiXPzK65RF7UmwviG2X-muPIJsvZ9CJvK3Ynp3BBud07_JjDlpVMvvA8NTbuemVRNbZYDyXll2bumpx3bO8n1HCQS_TkWGD0UyIlECCiaVWvSk-47dyymz9iIb6oW1dZJFXM-6ztQkB0CtSvafWWB_IK23Tb-wQnFl-0pxnwFmL_BtL-8xJ7QKQJgdUDCLAZncmaAZfc2INDeAeI0Zk_pg',
  },
  {
    id: 'shandur',
    name: 'SHANDUR',
    status: 'OPEN',
    altitude: 3700,
    season: 'APR — NOV',
    roadCondition: 'Unpaved/Gravel. Passable for 4x4 and adventure bikes. Watch for river crossings in afternoon melt.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCS_TggIkLE7HF4Yuna1kre1qLrlvxWSrYT3VRr-Lat5Kp9UVqMa9N7J01iYZwmVzjeOHY2F0U-hDkZ2bGDu6JJsMBzpumS8HBIsiaLdtgLNVc8GjCjAQ1JpBDiwW-11mSd69qCmPPnpK4q_UH2mBcBsRz1hdwdl06bXVYPYVRmFrcGA0rHUOnnrrSuwMS24xWEHhLWA457TfWyh9ppu_EoHvH8Kc38qzd1bqZQCQnFIn_GFsIUZkCqUbq1F1eR3P9u-pyBH_0HtlA',
  },
  {
    id: 'lowari',
    name: 'LOWARI',
    status: 'OPEN',
    altitude: 3118,
    season: 'YEAR ROUND',
    roadCondition: 'Tunnel is operational 24/7. Top pass road restricted to locals due to construction work.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMdRbXXbgbBQWy2QlvmdWHnra9SQNtZ52K0cVsfWHQhb70HExfoHgW0YBlX0thQAOCCT8QIVAQl_Rn7CWMWsJ_mWm0xbU0rbJj2GqREX77vSZWvj4Dv-yb5y_YGu_F7zHnDK7tKcZ7cWuxKkNv7pNOv4b9z9ktjv4iQ4gb_5BqnEqWa8eg5bHFzeeLcaoqGjHSFGDW5Ax3kUQzuiXtRkEXkdjFsb8xAAaKsTf6z424UAaxbpaRqifopOvPSSAITDbG9OTJOkHV9yM',
  },
];

export const GUESTHOUSES: Guesthouse[] = [
  {
    id: 'hunza-serena',
    name: 'Hunza Serena Inn',
    location: 'Karimabad, Gilgit Baltistan',
    region: 'Gilgit Baltistan',
    priceLevel: 3,
    description: 'The gold standard for Karokaram stays. Dedicated basement parking for motorcycles and 24/7 hot showers essential for long hauls.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDroNmq4Ne2-1UU661NdIZHpKzaUu5JKQvnU8wZttEoln6JqH-WPoissfUIERdUld80sukv5jhSxoKJYm3Fm86C4nLWa-gymcHMdgGiUsqJtu97ih71B2gXW9vsnjhozcexuZM104RbR0yqqWN5ukNO4VQMu4AVNh3GVNwKr5RL25on1TAOTbSKhV_OWNZ5TSs2o7tNs7KMjv4CCGj0OPPvn9FFVqgLkPssICvqUSBB12OUxdfR9mcKuHE0-1EUeLaGjIpyE0o6WD4',
    isRiderFriendly: true,
  },
  {
    id: 'passu-peaks',
    name: 'Passu Peaks Lodge',
    location: 'Passu, Gojal',
    region: 'Gilgit Baltistan',
    priceLevel: 1,
    description: 'Cozy interior of a mountain cabin with wood walls, a small fireplace, and traditional rugs.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfu4eyTPmNOZJOKXzFJ-0CbmZYYsAoC09-QzyqFTrD8QVWEFPfl-atQSGOapbdrOGlN_tldIDaeyFe14XZpMnk9Wq7KVkGDeQcX51S1WYzC0Jtvk73TYL4lAgQuDaRd3eMaVavtOevJfbVqenxB9GxjyarNu8Vzyh61kPQXJI6ytoYo1A88iGwhkaMhXjGbyxZQ2DhEMxhDPPBjtbPkxbzS4sM7nWst1zXG09U4SypciciO_ZgoOcmY5oQV0L6WuL_OA_Xx7ojl6A',
    isRiderFriendly: false,
    isBudgetPro: true,
  },
  {
    id: 'raikot-gazebo',
    name: 'Raikot Gazebo',
    location: 'Raikot Bridge, KKH',
    region: 'Gilgit Baltistan',
    priceLevel: 2,
    description: 'Traditional stone and wood building in Fairy Meadows with Nanga Parbat mountain towering in the background.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMdut4oA8YL0NN6ywnIYS141-spBNZlaGK3NEz6fC_WnXP3riUVwKI7CBRLC2ryEBy12ykx83PRftFjHMDTN_nXhUiL8OkZxWm9alZpKlDFe_Il1snTxuMn55LiJAApbf-gNsfsC0A4MTRVSrIXRkErfhArEXGgzb3aw6kPZXyZ6IBVekc7j3SJkegvc3id6ObHeppQY5QcyZFSGw4jh3tRJQ6WkGWbJYu6770Gp9FHnXTz_hhDu0oZdpQtsPBSP4GV8oPm6aNRjM',
    isRiderFriendly: true,
  },
  {
    id: 'fairy-meadows',
    name: 'Fairy Meadows Cottages',
    location: 'Fairy Meadows, Diamer',
    region: 'Gilgit Baltistan',
    priceLevel: 2,
    description: 'Park your bike at Raikot Bridge secure lot. Our jeep shuttle service will take you to the base of Nanga Parbat. Alpine-style cabins with panoramic glacier views.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8bccsHmadC92rABwxCS-e8ODzqJj7-tbPBnWpFjvnK5xm96aAckQv-a5HZBHoB6c7g8zGLZdI-xBfklmGhhQPkXYTUQD7kHJzdYAwiHMzHJ36nRHkQaiZXwwTrpw_xaiZlLqREA-b1UCqVjgOOllV9RVEDjmv3XJctJcH37ryee6DcuT8aXlTNiN6GNwK3vQpEn9vwBM3mvuUZ5REzaEIHaSXuEEKlsdaQ0H8u_4ZJZWvqn6ni7v-1la7zLfCT67d7jFrYIdA62c',
    isRiderFriendly: true,
  },
];

export const MOCK_ROUTE: RouteDay[] = [
  {
    day: 1,
    route: 'Islamabad - Naran',
    checkpoint: 'Balakot Fuel Station',
    checkpointNote: 'Last fuel for 80km',
    altitude: 2409,
    altitudeTrend: 'up',
    sleepLocation: 'River View Guesthouse',
  },
  {
    day: 2,
    route: 'Naran - Gilgit',
    checkpoint: 'Lulusar Lake Stop',
    altitude: 4173,
    altitudeTrend: 'warning',
    sleepLocation: 'Serena Hotel Gilgit',
  },
];
