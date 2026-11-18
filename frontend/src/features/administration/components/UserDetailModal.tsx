import type { FC } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User as UserIcon,
  Mail,
  Building2,
  Shield,
  FileCheck2,
  Calendar,
  Clock,
} from 'lucide-react';
import type { UserDto } from '../../../shared/api/usersApi.ts';
import { kycSubmittedAtWithEvidence } from '../../kyc/kycEvidence.ts';
import { KycStatusBadge } from './KycStatusBadge.tsx';

export interface UserDetailModalProps {
  isOpen: boolean;
  user: UserDto | null;
  onClose: () => void;
  onNavigateToKyc?: (user: UserDto) => void;
}

export const UserDetailModal: FC<UserDetailModalProps> = ({
  isOpen,
  user,
  onClose,
  onNavigateToKyc,
}) => {
  if (!isOpen || !user) return null;

  const submittedAt = kycSubmittedAtWithEvidence(user);

  return (
    <div className="kyc-modal-overlay" onClick={onClose}>
      <div className="kyc-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="kyc-modal-header">
          <div>
            <h2>Detalles del Usuario</h2>
            <p className="kyc-modal-sub">Información general de cuenta y estado en la plataforma</p>
          </div>
          <button type="button" className="kyc-modal-close-btn" onClick={onClose} title="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        <div className="kyc-modal-body">
          <div className="kyc-info-grid">
            <div className="kyc-info-block">
              <span className="info-label">
                <UserIcon size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Nombre Completo
              </span>
              <span className="info-value">{user.fullName}</span>
            </div>

            <div className="kyc-info-block">
              <span className="info-label">
                <Mail size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Correo Electrónico
              </span>
              <span className="info-value">{user.email}</span>
            </div>

            <div className="kyc-info-block">
              <span className="info-label">
                <Shield size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Rol del Usuario
              </span>
              <span className="info-value role-tag">
                {user.role === 'admin' ? 'Administrador' : user.role === 'creator' ? 'Creador' : 'Sponsor / Donante'}
              </span>
            </div>

            <div className="kyc-info-block">
              <span className="info-label">Estado de Cuenta</span>
              <span className="info-value">
                {user.status === 'active' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a' }}>
                    <CheckCircle2 size={15} /> Activo
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#dc2626' }}>
                    <AlertCircle size={15} /> Suspendido
                  </span>
                )}
              </span>
            </div>

            <div className="kyc-info-block">
              <span className="info-label">
                <FileCheck2 size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Documento de Identidad / NIT
              </span>
              <span className="info-value">{user.documentId || 'No registrado'}</span>
            </div>

            <div className="kyc-info-block">
              <span className="info-label">Estado KYC</span>
              <div style={{ marginTop: '4px' }}>
                <KycStatusBadge status={user.kycStatus} />
              </div>
            </div>

            {user.organizationName && (
              <div className="kyc-info-block" style={{ gridColumn: 'span 2' }}>
                <span className="info-label">
                  <Building2 size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Organización / Entidad (KYB)
                </span>
                <span className="info-value">{user.organizationName}</span>
              </div>
            )}

            <div className="kyc-info-block">
              <span className="info-label">
                <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Fecha de Registro
              </span>
              <span className="info-value">
                {new Date(user.createdAt).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>

            {submittedAt && (
              <div className="kyc-info-block">
                <span className="info-label">
                  <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Último Envío KYC
                </span>
                <span className="info-value">
                  {new Date(submittedAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>

          {user.kycNotes && (
            <div className="kyc-notes-box">
              <span className="info-label">Notas internas (no visibles para el usuario):</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#475569' }}>{user.kycNotes}</p>
            </div>
          )}
        </div>

        <div className="kyc-modal-actions">
          <button type="button" className="action-btn secondary" onClick={onClose}>
            Cerrar
          </button>
          {onNavigateToKyc && (
            <button
              type="button"
              className="action-btn primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => {
                onClose();
                onNavigateToKyc(user);
              }}
            >
              <span>Auditar Verificación KYC</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
