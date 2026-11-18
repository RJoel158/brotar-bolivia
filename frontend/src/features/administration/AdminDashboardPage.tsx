import type { FC } from 'react';
import { Card, Button } from '../../shared/index.ts';

export const AdminDashboardPage: FC = () => {
  return (
    <div className="feature-page dashboard-page admin-page">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Panel de Administración</h1>
          <p className="page-subtitle">Revisión de proyectos ecológicos, validación de KYC y auditoría de fondos.</p>
        </div>
        <Button size="md" variant="secondary">Auditoría de Impacto</Button>
      </div>

      <div className="dashboard-metrics">
        <Card padding="md" variant="flat">
          <span className="metric-label">Proyectos Pendientes</span>
          <span className="metric-value">6</span>
        </Card>
        <Card padding="md" variant="flat">
          <span className="metric-label">Campañas Activas</span>
          <span className="metric-value">28</span>
        </Card>
        <Card padding="md" variant="flat">
          <span className="metric-label">Alertas del Sistema</span>
          <span className="metric-value">0</span>
        </Card>
      </div>

      <div className="dashboard-section">
        <h3>Proyectos en Espera de Aprobación</h3>
        <Card padding="lg">
          <div className="project-row">
            <div>
              <h4>Recuperación de Humedales del Ebro</h4>
              <p className="meta-text">Creador: EcoHumedal ONG · Documentación Técnica: Completa</p>
            </div>
            <div className="row-actions">
              <Button size="sm" variant="primary">Aprobar</Button>
              <Button size="sm" variant="outline">Revisar</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
