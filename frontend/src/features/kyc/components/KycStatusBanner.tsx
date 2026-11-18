import type { FC } from 'react';
import { ShieldCheck, Clock, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../auth/context/useAuth.ts';
import { hasSubmittedKycDocuments } from '../kycEvidence.ts';
import './KycWizard.css';

export interface KycStatusBannerProps {
  onStartKyc: () => void;
}

export const KycStatusBanner: FC<KycStatusBannerProps> = ({ onStartKyc }) => {
  const { user } = useAuth();
  if (!user) return null;

  const kycStatus = user.kycStatus || 'pending';
  const hasSubmitted = hasSubmittedKycDocuments(user);

  if (kycStatus === 'verified') {
    return (
      <div className="kyc-dashboard-banner banner-verified">
        <div className="banner-left-col">
          <div className="banner-icon-box" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="banner-title">Identidad Verificada</h4>
            <p className="banner-desc">
              Tu cuenta{user.documentId ? ` (${user.documentId})` : ''} está plenamente habilitada
              para operar en la plataforma Brotar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (kycStatus === 'requires_documentation') {
    return (
      <div className="kyc-dashboard-banner banner-requires-docs">
        <div className="banner-left-col">
          <div className="banner-icon-box" style={{ backgroundColor: '#ffedd5', color: '#ea580c' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4 className="banner-title">Se Requiere Documentación Adicional</h4>
            <p className="banner-desc">
              {user.kycRejectionReason
                ? `Observación del Administrador: "${user.kycRejectionReason}"`
                : 'Por favor actualiza o adjunta fotos más nítidas de tu documento para completar la verificación. Si recibiste un correo de Brotar, allí encontrarás el detalle.'}
            </p>
          </div>
        </div>
        <button type="button" className="banner-btn-cta btn-amber" onClick={onStartKyc}>
          <span>Subir Documentos Solicitados</span>
          <ArrowRight size={14} style={{ display: 'inline', marginLeft: '6px' }} />
        </button>
      </div>
    );
  }

  if (kycStatus === 'rejected') {
    return (
      <div className="kyc-dashboard-banner banner-rejected">
        <div className="banner-left-col">
          <div className="banner-icon-box" style={{ backgroundColor: '#ffe4e6', color: '#e11d48' }}>
            <XCircle size={24} />
          </div>
          <div>
            <h4 className="banner-title">Expediente de Identidad Rechazado</h4>
            <p className="banner-desc">
              {user.kycRejectionReason
                ? `Motivo: "${user.kycRejectionReason}"`
                : 'El expediente no cumplió con las políticas de validación. Puedes volver a enviar tus datos.'}
            </p>
          </div>
        </div>
        <button type="button" className="banner-btn-cta btn-emerald" onClick={onStartKyc}>
          <span>Reiniciar Verificación</span>
        </button>
      </div>
    );
  }

  // Pending State (Active request in review)
  if (hasSubmitted) {
    return (
      <div className="kyc-dashboard-banner banner-pending">
        <div className="banner-left-col">
          <div className="banner-icon-box" style={{ backgroundColor: '#fef9c3', color: '#ca8a04' }}>
            <Clock size={24} />
          </div>
          <div>
            <h4 className="banner-title">Tus documentos están en proceso de verificación</h4>
            <p className="banner-desc">
              Hemos recibido tu expediente y nuestro equipo lo está revisando minuciosamente. Te notificaremos en cuanto finalice la auditoría.
            </p>
          </div>
        </div>
        <div className="banner-status-tag pending">
          <Clock size={14} />
          <span>Revisión en curso</span>
        </div>
      </div>
    );
  }

  // Not submitted yet
  return (
    <div className="kyc-dashboard-banner banner-pending" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
      <div className="banner-left-col">
        <div className="banner-icon-box" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
          <ShieldCheck size={24} />
        </div>
        <div>
          <h4 className="banner-title">Verifica tu Identidad para Operar</h4>
          <p className="banner-desc">
            Completa la verificación KYC ({user.role === 'creator' ? 'requerido para publicar proyectos' : 'recomendado para aportes seguros'}).
          </p>
        </div>
      </div>
      <button type="button" className="banner-btn-cta btn-emerald" onClick={onStartKyc}>
        <span>Verificar Identidad Ahora</span>
        <ArrowRight size={14} style={{ display: 'inline', marginLeft: '6px' }} />
      </button>
    </div>
  );
};
