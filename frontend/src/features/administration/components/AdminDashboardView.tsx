import type { FC } from 'react';
import { useEffect, useState } from 'react';
import {
  Users,
  ShieldCheck,
  Clock,
  Sprout,
  ArrowRight,
  UserCheck,
  ClipboardCheck,
} from 'lucide-react';
import { usersApi, type UserFilterParams } from '../../../shared/api/usersApi.ts';

export interface AdminDashboardViewProps {
  onNavigateToTab: (tab: string) => void;
}

interface UserMetrics {
  total: number | null;
  verified: number | null;
  pending: number | null;
}

async function countUsers(filters: UserFilterParams): Promise<number | null> {
  try {
    return (await usersApi.getUsers({ ...filters, page: 1, limit: 1 })).meta.total;
  } catch {
    return null;
  }
}

function formatMetric(value: number | null | undefined): string {
  if (value === undefined) return '…';
  return value === null ? '—' : String(value);
}

export const AdminDashboardView: FC<AdminDashboardViewProps> = ({ onNavigateToTab }) => {
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [total, verified, pending] = await Promise.all([
        countUsers({}),
        countUsers({ kycStatus: 'verified' }),
        countUsers({ kycStatus: 'pending' }),
      ]);
      if (!cancelled) {
        setMetrics({ total, verified, pending });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasMetricsError =
    metrics !== null && [metrics.total, metrics.verified, metrics.pending].includes(null);

  return (
    <div className="admin-dashboard-view">
      {/* Intro Header Card */}
      <div className="verification-card">
        <div className="card-header-intro">
          <h1 className="card-title">Panel de Administración</h1>
          <p className="card-subtitle">
            Supervisión global de la plataforma Brotar Bolivia, auditoría de usuarios y control de validaciones.
          </p>
        </div>

        {/* Dashboard Metric Cards Grid */}
        <div className="dashboard-stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper users">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-number">{formatMetric(metrics?.total)}</span>
              <span className="stat-label">Usuarios Activos</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper verified">
              <ShieldCheck size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-number">{formatMetric(metrics?.verified)}</span>
              <span className="stat-label">Identidades Verificadas</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper pending">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-number">{formatMetric(metrics?.pending)}</span>
              <span className="stat-label">KYC en estado pendiente</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper campaigns">
              <Sprout size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-number">—</span>
              <span className="stat-label">Campañas Activas (métrica no disponible)</span>
            </div>
          </div>
        </div>

        {hasMetricsError && (
          <p className="card-subtitle" role="alert">
            No se pudieron cargar algunas métricas de usuarios. Se muestran como “—”.
          </p>
        )}

        {/* Action Shortcuts */}
        <div className="dashboard-shortcuts-section">
          <h3>Accesos Rápidos de Gestión</h3>
          <div className="shortcuts-grid">
            <div className="shortcut-card" onClick={() => onNavigateToTab('usuarios')}>
              <div className="shortcut-title-row">
                <div className="stat-icon-wrapper users" style={{ width: '36px', height: '36px' }}>
                  <UserCheck size={18} />
                </div>
                <h4>Gestión de Usuarios</h4>
              </div>
              <p>Revisa el padrón completo de usuarios, donantes y entidades registradas en la plataforma.</p>
              <span className="shortcut-link-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>Ver todos los usuarios</span>
                <ArrowRight size={14} />
              </span>
            </div>

            <div className="shortcut-card" onClick={() => onNavigateToTab('verificacion')}>
              <div className="shortcut-title-row">
                <div className="stat-icon-wrapper verified" style={{ width: '36px', height: '36px' }}>
                  <ShieldCheck size={18} />
                </div>
                <h4>Cola de Verificación KYC</h4>
              </div>
              <p>Audita carnets de identidad (CI), NITs y autorizaciones antes de activar proyectos verdes.</p>
              <span className="shortcut-link-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>Ir a cola de verificación</span>
                <ArrowRight size={14} />
              </span>
            </div>

            <div className="shortcut-card" onClick={() => onNavigateToTab('revision')}>
              <div className="shortcut-title-row">
                <div className="stat-icon-wrapper campaigns" style={{ width: '36px', height: '36px' }}>
                  <ClipboardCheck size={18} />
                </div>
                <h4>Revisión de Campañas</h4>
              </div>
              <p>Revisa campañas en pending_review, aprueba, solicita cambios o publica las aprobadas.</p>
              <span className="shortcut-link-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>Ir a revisión de campañas</span>
                <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </div>

        <div className="table-card-accent-footer"></div>
      </div>
    </div>
  );
};
