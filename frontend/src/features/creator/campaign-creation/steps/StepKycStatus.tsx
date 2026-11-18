import { Button } from '../../../../shared/index.ts';
import { CampaignCreationNav } from '../components/CampaignCreationNav.tsx';
import { CampaignStepProgress } from '../components/CampaignStepProgress.tsx';
import './StepGeneralInfo.css';

const KYC_STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente de envío o revisión',
  verified: 'Identidad verificada',
  rejected: 'Rechazado',
  requires_documentation: 'Requiere documentación adicional',
};

export interface StepKycStatusProps {
  kycStatus?: string | null;
  isOpeningVerification?: boolean;
  verificationError?: string | null;
  onGoToVerification: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function StepKycStatus({
  kycStatus,
  isOpeningVerification = false,
  verificationError = null,
  onGoToVerification,
  onPrevious,
  onNext,
}: StepKycStatusProps) {
  const statusKey = kycStatus ?? null;
  const statusLabel = statusKey
    ? (KYC_STATUS_LABEL[statusKey] ?? statusKey)
    : 'Pendiente / desconocido';
  const isVerified = statusKey === 'verified';

  return (
    <section className="step-general-info">
      <CampaignStepProgress step={7} />

      <div className="step-general-info__layout">
        <CampaignCreationNav currentStep={7} />

        <div className="step-general-info__content">
          <header className="step-general-info__header">
            <h1>Verificación</h1>
            <p>Se usa el estado KYC real de tu cuenta. No se inventan datos de campaña.</p>
          </header>

          <p className="meta-text">Estado KYC: {statusLabel}</p>
          <p className="meta-text">
            {isVerified
              ? 'Tu identidad ya está verificada. Puedes continuar con la revisión final.'
              : 'Debes completar la verificación desde el centro de verificación de tu cuenta. El envío a revisión solo se acepta con KYC aprobado y cuenta activa.'}
          </p>

          {verificationError ? <p className="meta-text">{verificationError}</p> : null}

          <div className="step-general-info__actions">
            <Button variant="tertiary" onClick={onPrevious} disabled={isOpeningVerification}>
              Atrás
            </Button>
            <div className="step-general-info__actions-right">
              <Button
                variant="secondary"
                onClick={onGoToVerification}
                loading={isOpeningVerification}
                disabled={isOpeningVerification}
              >
                Ir a verificación
              </Button>
              <Button variant="primary" onClick={onNext} disabled={isOpeningVerification}>
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
