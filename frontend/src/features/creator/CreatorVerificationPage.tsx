import type { FC } from 'react';
import { useState } from 'react';
import { Button, DashboardLayout } from '../../shared/index.ts';
import { useAuth } from '../auth/context/useAuth.ts';
import { KycStatusBanner } from '../kyc/components/KycStatusBanner.tsx';
import { KycSubmissionWizard } from '../kyc/components/KycSubmissionWizard.tsx';
import { kycSubmittedAtWithEvidence } from '../kyc/kycEvidence.ts';
import './CreatorVerificationPage.css';

export interface CreatorVerificationPageProps {
  onNavigate?: (itemId: string) => void;
  onLogout?: () => void;
  onSearchProjects?: (query: string) => void;
  /** When the user arrived from the campaign wizard, resume that draft. */
  onReturnToWizard?: () => void;
}

const STATUS_COPY: Record<string, string> = {
  pending: 'Pendiente de envío o revisión',
  verified: 'Identidad verificada',
  rejected: 'Rechazado',
  requires_documentation: 'Requiere documentación adicional',
};

export const CreatorVerificationPage: FC<CreatorVerificationPageProps> = ({
  onNavigate,
  onLogout,
  onSearchProjects,
  onReturnToWizard,
}) => {
  const { user } = useAuth();
  const [isKycWizardOpen, setIsKycWizardOpen] = useState(false);
  const kycStatus = user?.kycStatus ?? 'pending';
  const submittedAt = kycSubmittedAtWithEvidence(user);

  return (
    <DashboardLayout
      variant="creator"
      activeItem="creator-verification"
      userName={user?.fullName ?? 'Creador'}
      onNavigate={onNavigate}
      onLogout={onLogout}
      onSearchSubmit={onSearchProjects}
    >
      <div className="creator-verify">
        <header className="creator-verify__header">
          <p className="creator-verify__eyebrow">Cumplimiento</p>
          <h1 className="creator-verify__title">Centro de Verificación</h1>
          <p className="creator-verify__subtitle">
            Completa y consulta el estado KYC de tu cuenta. Es el mismo flujo de verificación
            existente; no se inventan datos adicionales.
          </p>
          {onReturnToWizard ? (
            <div className="creator-verify__return">
              <Button variant="secondary" type="button" onClick={onReturnToWizard}>
                Volver al asistente de campaña
              </Button>
            </div>
          ) : null}
        </header>

        <section className="creator-verify__card">
          <h2 className="creator-verify__card-title">Identidad / Organización</h2>
          <dl className="creator-verify__facts">
            <div>
              <dt>Nombre</dt>
              <dd>{user?.fullName ?? '—'}</dd>
            </div>
            <div>
              <dt>Correo</dt>
              <dd>{user?.email ?? '—'}</dd>
            </div>
            <div>
              <dt>Organización</dt>
              <dd>{user?.organizationName || 'No registrada'}</dd>
            </div>
            <div>
              <dt>Documento</dt>
              <dd>
                {user?.documentType ?? '—'} {user?.documentId ?? ''}
              </dd>
            </div>
            <div>
              <dt>Estado KYC</dt>
              <dd>{STATUS_COPY[kycStatus] ?? kycStatus}</dd>
            </div>
            <div>
              <dt>Enviado</dt>
              <dd>
                {submittedAt ? new Date(submittedAt).toLocaleString('es-BO') : 'Aún no enviado'}
              </dd>
            </div>
            <div>
              <dt>Revisado</dt>
              <dd>
                {user?.kycReviewedAt
                  ? new Date(user.kycReviewedAt).toLocaleString('es-BO')
                  : '—'}
              </dd>
            </div>
          </dl>
        </section>

        <section className="creator-verify__banner">
          <KycStatusBanner onStartKyc={() => setIsKycWizardOpen(true)} />
        </section>

        <KycSubmissionWizard
          isOpen={isKycWizardOpen}
          onClose={() => setIsKycWizardOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
};
