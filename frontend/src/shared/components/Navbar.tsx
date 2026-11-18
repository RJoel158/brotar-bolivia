import type { FC } from 'react';
import { Header } from './layout/Header/index.ts';

export interface NavbarProps {
  currentRoute: string;
  onRouteChange: (route: string) => void;
  isAuthenticated?: boolean;
  userName?: string;
  userRoleLabel?: string;
  userRole?: string;
  onLogout?: () => void;
  /** Busqueda del header: abre el catalogo filtrado por el texto. */
  onSearchSubmit?: (query: string) => void;
}

export const Navbar: FC<NavbarProps> = ({
  currentRoute,
  onRouteChange,
  isAuthenticated = false,
  userName,
  userRoleLabel,
  userRole,
  onLogout,
  onSearchSubmit,
}) => {
  return (
    <Header
      variant="public"
      activeItem={currentRoute}
      onNavigate={onRouteChange}
      isAuthenticated={isAuthenticated}
      userName={userName}
      userRoleLabel={userRoleLabel}
      userRole={userRole}
      onLogout={isAuthenticated ? onLogout : undefined}
      onSearchSubmit={onSearchSubmit}
    />
  );
};
