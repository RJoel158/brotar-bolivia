export const APP_CONFIG = {
  name: 'Brotar',
  tagline: 'Crowdfunding Verde para el Futuro del Planeta',
  version: '1.0.0',
  defaultCurrency: 'BOB',
} as const;

export const PROJECT_CATEGORIES = [
  { id: 'reforestacion', label: 'Reforestación', iconKey: 'TreePine' },
  { id: 'energia-renovable', label: 'Energía Renovable', iconKey: 'Sun' },
  { id: 'conservacion', label: 'Conservación', iconKey: 'ShieldCheck' },
  { id: 'reciclaje', label: 'Economía Circular', iconKey: 'Recycle' },
  { id: 'agricultura-sostenible', label: 'Agricultura Sostenible', iconKey: 'Sprout' },
] as const;

export const APP_ROUTES = {
  HOME: '/',
  EXPLORE: '/explore',
  PROJECT_DETAIL: (id: string = ':id') => `/projects/${id}`,
  HOW_IT_WORKS: '/how-it-works',
  FOR_CREATORS: '/for-creators',
  LOGIN: '/login',
  REGISTER: '/register',
  RECOVER_PASSWORD: '/recover-password',
  CAMPAIGNS: '/campaigns',
  CREATOR_DASHBOARD: '/creator/dashboard',
  SPONSOR_DASHBOARD: '/sponsor/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',
} as const;
