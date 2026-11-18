import type { ReactNode } from 'react';
import { Header, type HeaderVariant } from '../Header/index.ts';
import { Footer } from '../Footer/index.ts';
import { Sidebar } from '../Sidebar/index.ts';
import './PageLayout.css';

export interface PublicLayoutProps {
  children: ReactNode;
  activeItem?: string;
  onNavigate?: (itemId: string) => void;
  className?: string;
}

export function PublicLayout({
  children,
  activeItem,
  onNavigate,
  className = '',
}: PublicLayoutProps) {
  return (
    <div className={`brotar-public-layout ${className}`.trim()}>
      <Header variant="public" activeItem={activeItem} onNavigate={onNavigate} />
      <main className="brotar-public-layout__main">{children}</main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}

export interface DashboardLayoutProps {
  children: ReactNode;
  variant?: Exclude<HeaderVariant, 'public'>;
  activeItem?: string;
  userName?: string;
  onNavigate?: (itemId: string) => void;
  onLogout?: () => void;
  onSearchSubmit?: (query: string) => void;
  showAdminSidebar?: boolean;
  className?: string;
}

export function DashboardLayout({
  children,
  variant = 'creator',
  activeItem,
  userName,
  onNavigate,
  onLogout,
  onSearchSubmit,
  showAdminSidebar = variant === 'admin',
  className = '',
}: DashboardLayoutProps) {
  return (
    <div className={`brotar-dashboard-layout ${className}`.trim()}>
      <Header
        variant={variant}
        activeItem={activeItem}
        userName={userName}
        onNavigate={onNavigate}
        isAuthenticated
        onLogout={onLogout}
        onSearchSubmit={onSearchSubmit}
      />
      <div className="brotar-dashboard-layout__body">
        {showAdminSidebar ? (
          <Sidebar activeItem={activeItem} onItemClick={onNavigate} />
        ) : null}
        <main className="brotar-dashboard-layout__main">{children}</main>
      </div>
    </div>
  );
}
