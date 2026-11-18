import type { UserRole } from '../../../shared/types/index.ts';

export function homeRouteForRole(role: UserRole | string): string {
  switch (role) {
    case 'admin':
      return 'administration';
    case 'creator':
      return 'creator';
    case 'sponsor':
      return 'sponsor';
    default:
      return 'home';
  }
}

export const PROTECTED_ROUTE_ROLES: Record<string, UserRole[]> = {
  profile: ['creator', 'sponsor', 'admin'],
  organizations: ['creator', 'sponsor', 'admin'],
  creator: ['creator'],
  'creator-projects': ['creator'],
  'creator-verification': ['creator'],
  'creator-campaign-create': ['creator'],
  sponsor: ['sponsor'],
  administration: ['admin'],
  // Cualquier usuario con sesion puede aportar a una campana ajena; quien no
  // haya iniciado sesion es enviado al login y vuelve al checkout despues.
  'contribution-checkout': ['sponsor', 'creator', 'admin'],
  // Seguimiento de un aporte propio desde "Mis aportes".
  'contribution-tracking': ['sponsor', 'creator', 'admin'],
  'force-change-password': ['creator', 'sponsor', 'admin'],
};

export function isProtectedRoute(route: string): boolean {
  return Object.prototype.hasOwnProperty.call(PROTECTED_ROUTE_ROLES, route);
}

export function canAccessRoute(route: string, role: UserRole | null | undefined): boolean {
  const allowed = PROTECTED_ROUTE_ROLES[route];
  if (!allowed) {
    return true;
  }
  if (!role) {
    return false;
  }
  return allowed.includes(role);
}
