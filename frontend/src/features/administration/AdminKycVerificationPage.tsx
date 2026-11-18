import type { FC } from 'react';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ClipboardCheck,
  Landmark,
  Scale,
  Receipt,
  AlertTriangle,
  Bell,
  Shield,
  Sprout,
  User as UserIcon,
  Menu,
} from 'lucide-react';
import './AdminKycVerificationPage.css';
import { AdminKycVerificationSection } from './components/AdminKycVerificationSection.tsx';
import { AdminUsersView } from './components/AdminUsersView.tsx';
import { AdminDashboardView } from './components/AdminDashboardView.tsx';
import { AdminCampaignReviewView } from './components/AdminCampaignReviewView.tsx';
import { AdminFinanceView } from './components/finance/AdminFinanceView.tsx';
import { AdminReconciliationView } from './components/finance/AdminReconciliationView.tsx';
import { AdminDisbursementsView } from './components/finance/AdminDisbursementsView.tsx';
import { AdminDisputesView } from './components/finance/AdminDisputesView.tsx';
import { useAuth } from '../auth/context/useAuth.ts';

/** Secciones del panel que ya tienen vista propia; el resto muestra el aviso de "en preparacion". */
const IMPLEMENTED_ADMIN_MENUS = new Set([
  'panel',
  'usuarios',
  'verificacion',
  'revision',
  'finanzas',
  'conciliacion',
  'desembolsos',
  'disputas',
]);

export interface AdminKycVerificationPageProps {
  onLogout?: () => void;
  initialMenu?: string;
}

export const AdminKycVerificationPage: FC<AdminKycVerificationPageProps> = ({
  onLogout,
  initialMenu,
}) => {
  const { user } = useAuth();

  const [activeMenu, setActiveMenu] = useState<string>(initialMenu ?? 'usuarios');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  return (
    <div className="brotar-admin-workspace">
      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="admin-sidebar-mobile-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 1. Left Navigation Sidebar */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo-icon">
            <Shield size={18} />
          </div>
          <span className="brand-title">
            Brotar <span className="brand-admin-tag">ADMIN</span>
          </span>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={`nav-item ${activeMenu === 'panel' ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu('panel');
              setIsMobileMenuOpen(false);
            }}
          >
            <LayoutDashboard size={18} className="nav-icon" />
            <span>Panel de Administracion</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeMenu === 'usuarios' ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu('usuarios');
              setIsMobileMenuOpen(false);
            }}
          >
            <Users size={18} className="nav-icon" />
            <span>Usuarios</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeMenu === 'verificacion' ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu('verificacion');
              setIsMobileMenuOpen(false);
            }}
          >
            <ShieldCheck size={18} className="nav-icon" />
            <span>Verificación</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeMenu === 'revision' ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu('revision');
              setIsMobileMenuOpen(false);
            }}
          >
            <ClipboardCheck size={18} className="nav-icon" />
            <span>Panel de Revisión</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeMenu === 'finanzas' ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu('finanzas');
              setIsMobileMenuOpen(false);
            }}
          >
            <Landmark size={18} className="nav-icon" />
            <span>Finanzas</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeMenu === 'conciliacion' ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu('conciliacion');
              setIsMobileMenuOpen(false);
            }}
          >
            <Scale size={18} className="nav-icon" />
            <span>Conciliación</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeMenu === 'desembolsos' ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu('desembolsos');
              setIsMobileMenuOpen(false);
            }}
          >
            <Receipt size={18} className="nav-icon" />
            <span>Desembolsos</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeMenu === 'disputas' ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu('disputas');
              setIsMobileMenuOpen(false);
            }}
          >
            <AlertTriangle size={18} className="nav-icon" />
            <span>Disputas</span>
          </button>
        </nav>

        <div className="sidebar-admin-profile">
          <div className="profile-avatar-circle">
            <UserIcon size={18} />
          </div>
          <div className="profile-details">
            <span className="profile-name">{user?.fullName ?? 'Admin Brotar'}</span>
            <span className="profile-role">{user?.email ?? 'Administración'}</span>
          </div>
          {onLogout ? (
            <button type="button" className="admin-logout-btn" onClick={onLogout}>
              Cerrar sesión
            </button>
          ) : null}
        </div>
      </aside>

      {/* 2. Main Administration Area */}
      <div className="admin-main-container">
        {/* Top Navbar */}
        <header className="admin-top-header">
          <div className="top-brand-cluster">
            <button
              type="button"
              className="mobile-menu-toggle-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Abrir menú de navegación"
            >
              <Menu size={22} />
            </button>

            <div className="top-brand">
              <Sprout size={22} className="leaf-icon" />
              <span className="brand-logo-text">brotar</span>
            </div>
          </div>

          <div className="top-actions">
            <button type="button" className="notification-btn" title="Notificaciones">
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* Content Body based on activeMenu */}
        <main className="admin-content-body">
          {activeMenu === 'panel' && <AdminDashboardView onNavigateToTab={setActiveMenu} />}

          {activeMenu === 'usuarios' && (
            <AdminUsersView onNavigateToKyc={() => setActiveMenu('verificacion')} />
          )}

          {activeMenu === 'revision' && <AdminCampaignReviewView />}

          {/* Modulo de finanzas */}
          {activeMenu === 'finanzas' && <AdminFinanceView />}

          {activeMenu === 'conciliacion' && <AdminReconciliationView />}

          {activeMenu === 'desembolsos' && <AdminDisbursementsView />}

          {activeMenu === 'disputas' && <AdminDisputesView />}

          {activeMenu === 'verificacion' && <AdminKycVerificationSection />}

          {!IMPLEMENTED_ADMIN_MENUS.has(activeMenu) && (
            <div className="verification-card" style={{ padding: '48px', textAlign: 'center' }}>
              <h2>Módulo en Preparación</h2>
              <p style={{ color: '#64748b', marginTop: '8px' }}>
                La sección <strong>{activeMenu}</strong> estará disponible próximamente en las siguientes fases.
              </p>
            </div>
          )}
        </main>

        {/* 3. Footer */}
        <footer className="admin-bottom-footer">
          <span className="copyright-text">
            © 2026 Brotar Bolivia. Todos los derechos reservados.
          </span>
          <div className="footer-links">
            <a href="#seguridad" className="footer-link">
              Seguridad de Datos
            </a>
            <a href="#auditoria" className="footer-link">
              Log de Auditoría
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};
