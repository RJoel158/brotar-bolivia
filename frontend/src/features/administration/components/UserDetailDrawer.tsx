import type { FC } from 'react';
import { useState, useEffect } from 'react';
import {
  User as UserIcon,
  FileText,
  SlidersHorizontal,
  CheckCircle2,
  FileQuestion,
  XCircle,
  ArrowRight,
  X,
  Mail,
  Phone,
  Calendar,
  Building2,
  Shield,
  FileCheck2,
  Clock,
  Trash2,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import type { UserDto } from '../../../shared/api/usersApi.ts';
import { usersApi, type KycStatusType } from '../../../shared/api/usersApi.ts';
import { kycSubmittedAtWithEvidence } from '../../kyc/kycEvidence.ts';
import { KycStatusBadge } from './KycStatusBadge.tsx';

export interface UserDetailDrawerProps {
  isOpen: boolean;
  user: UserDto | null;
  onClose: () => void;
  onNavigateToKyc?: (user: UserDto) => void;
  onUserUpdated?: (updatedUser: UserDto) => void;
  onDeactivateUser?: (user: UserDto) => void;
}

interface DrawerConfirmActionState {
  status: KycStatusType;
  /** Internal note for administrators. */
  notes?: string;
  /** Message shown to the user (kyc_rejection_reason). */
  reason?: string;
  type: 'approve' | 'requires_docs' | 'reject';
  title: string;
  message: string;
  confirmLabel: string;
}

interface UserDetailDrawerContentProps {
  user: UserDto;
  onClose: () => void;
  onNavigateToKyc?: (user: UserDto) => void;
  onUserUpdated?: (updatedUser: UserDto) => void;
  onDeactivateUser?: (user: UserDto) => void;
}

const UserDetailDrawerContent: FC<UserDetailDrawerContentProps> = ({
  user,
  onClose,
  onNavigateToKyc,
  onUserUpdated,
  onDeactivateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'kyc' | 'auditoria'>('info');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<DrawerConfirmActionState | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmDialog) {
          setConfirmDialog(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, confirmDialog]);

  const handleRequestStatusChange = (
    status: KycStatusType,
    type: 'approve' | 'requires_docs' | 'reject',
    title: string,
    message: string,
    confirmLabel: string,
    payload: { notes?: string; reason?: string } = {},
  ) => {
    setConfirmDialog({
      status,
      notes: payload.notes,
      reason: payload.reason,
      type,
      title,
      message,
      confirmLabel,
    });
  };

  const handleExecuteConfirmedStatusChange = async () => {
    if (!confirmDialog) return;
    const { status, notes, reason } = confirmDialog;
    setConfirmDialog(null);

    setIsUpdatingStatus(true);
    setActionSuccessMessage(null);
    try {
      const updated = await usersApi.updateKycStatus(user.id, status, notes, reason);
      setActionSuccessMessage(`Estado KYC actualizado a "${status}" con éxito.`);
      if (onUserUpdated) {
        onUserUpdated(updated);
      }
    } catch {
      setActionSuccessMessage('Error al actualizar el estado.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const hasFront = Boolean(user.hasDocumentFront || user.documentFrontUrl);
  const hasBack = Boolean(user.hasDocumentBack || user.documentBackUrl);
  const submittedAt = kycSubmittedAtWithEvidence(user);

  const initials = (user.organizationName || user.fullName)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join('');

  return (
    <>
      <div className="slide-over-backdrop" onClick={onClose}>
        <aside
          className="slide-over-panel"
          onClick={(e) => e.stopPropagation()}
          aria-label="Detalle de usuario"
        >
          {/* Drawer Header */}
          <div className="slide-over-header">
            <div className="user-header-profile">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="user-avatar-image"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="user-avatar-large">
                  <span>{initials || 'U'}</span>
                </div>
              )}
              <div className="user-header-info">
                <h2 className="user-header-name">{user.organizationName || user.fullName}</h2>
                <div className="user-header-tags">
                  <span className={`role-badge ${user.role}`}>
                    {user.role === 'admin' ? 'Admin' : user.role === 'creator' ? 'Creador' : 'Sponsor'}
                  </span>
                  <KycStatusBadge status={user.kycStatus} />
                </div>
                <span className="user-header-email">{user.email}</span>
              </div>
            </div>

            <button
              type="button"
              className="drawer-close-btn"
              onClick={onClose}
              title="Cerrar panel (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          {/* Action success alert */}
          {actionSuccessMessage && (
            <div className="drawer-alert-banner">
              <CheckCircle2 size={16} />
              <span>{actionSuccessMessage}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="drawer-tabs-bar">
            <button
              type="button"
              className={`drawer-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              <UserIcon size={16} />
              <span>Datos de Cuenta</span>
            </button>
            <button
              type="button"
              className={`drawer-tab-btn ${activeTab === 'kyc' ? 'active' : ''}`}
              onClick={() => setActiveTab('kyc')}
            >
              <FileText size={16} />
              <span>KYC / Documentos</span>
            </button>
            <button
              type="button"
              className={`drawer-tab-btn ${activeTab === 'auditoria' ? 'active' : ''}`}
              onClick={() => setActiveTab('auditoria')}
            >
              <SlidersHorizontal size={16} />
              <span>Acciones</span>
            </button>
          </div>

          {/* Drawer Scrollable Content Body */}
          <div className="slide-over-body">
            {/* TAB 1: General Info */}
            {activeTab === 'info' && (
              <div className="drawer-tab-content">
                <div className="detail-section-title">Información de Cuenta</div>
                <div className="detail-field-list">
                  <div className="detail-field-item">
                    <span className="field-label">
                      <UserIcon size={14} />
                      <span>Nombre Completo</span>
                    </span>
                    <span className="field-value highlight">{user.fullName}</span>
                  </div>

                  {user.organizationName && (
                    <div className="detail-field-item">
                      <span className="field-label">
                        <Building2 size={14} />
                        <span>Nombre de Organización / Razón Social</span>
                      </span>
                      <span className="field-value">{user.organizationName}</span>
                    </div>
                  )}

                  <div className="detail-field-item">
                    <span className="field-label">
                      <Mail size={14} />
                      <span>Correo Electrónico</span>
                    </span>
                    <span className="field-value">{user.email}</span>
                  </div>

                  <div className="detail-field-item">
                    <span className="field-label">
                      <Phone size={14} />
                      <span>Teléfono de Contacto</span>
                    </span>
                    <span className="field-value">{user.phone || 'No registrado'}</span>
                  </div>

                  <div className="detail-field-item">
                    <span className="field-label">
                      <FileCheck2 size={14} />
                      <span>Documento / CI / NIT</span>
                    </span>
                    <span className="field-value">
                      {user.documentId ? `${user.documentType || 'CI'}: ${user.documentId}` : 'No registrado'}
                    </span>
                  </div>

                  <div className="detail-field-item">
                    <span className="field-label">
                      <Shield size={14} />
                      <span>Estado de la Cuenta</span>
                    </span>
                    <span className="field-value status-indicator">
                      <span className="status-dot-active"></span>
                      <span>Activa en plataforma</span>
                    </span>
                  </div>

                  <div className="detail-field-item">
                    <span className="field-label">
                      <Calendar size={14} />
                      <span>Fecha de Registro</span>
                    </span>
                    <span className="field-value">
                      {new Date(user.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: KYC Documents */}
            {activeTab === 'kyc' && (
              <div className="drawer-tab-content">
                <div className="detail-section-title">Expediente de Identidad (KYC/KYB)</div>

                <div className="kyc-summary-card">
                  <div className="kyc-summary-row">
                    <span className="label">Estado Actual:</span>
                    <KycStatusBadge status={user.kycStatus} />
                  </div>
                  {submittedAt && (
                    <div className="kyc-summary-row">
                      <span className="label">Fecha de Envío:</span>
                      <span className="value">
                        <Clock size={13} style={{ display: 'inline', marginRight: '4px' }} />
                        {new Date(submittedAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  {user.kycReviewedAt && (
                    <div className="kyc-summary-row">
                      <span className="label">Última Revisión:</span>
                      <span className="value">
                        <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
                        {new Date(user.kycReviewedAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Document Previews */}
                <div className="document-preview-grid">
                  <div className="document-card">
                    <span className="doc-type-tag">Frente del Documento ({user.documentType || 'CI'})</span>
                    <div className="doc-placeholder-box">
                      <FileText size={32} className={hasFront ? 'text-emerald' : 'text-muted'} />
                      <span>{hasFront ? 'Imagen cargada (ver en Mesa KYC)' : 'Sin imagen enviada'}</span>
                    </div>
                  </div>

                  <div className="document-card">
                    <span className="doc-type-tag">Reverso del Documento</span>
                    <div className="doc-placeholder-box">
                      <FileCheck2 size={32} className={hasBack ? 'text-emerald' : 'text-muted'} />
                      <span>{hasBack ? 'Imagen cargada (ver en Mesa KYC)' : 'Sin imagen enviada'}</span>
                    </div>
                  </div>
                </div>

                {user.kycRejectionReason && (
                  <div className="kyc-audit-notes-box">
                    <span className="notes-title">Último mensaje enviado al usuario</span>
                    <p>{user.kycRejectionReason}</p>
                  </div>
                )}

                {user.kycNotes && (
                  <div className="kyc-audit-notes-box">
                    <span className="notes-title">Notas internas (no visibles para el usuario)</span>
                    <p>{user.kycNotes}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Audit & Quick Actions */}
            {activeTab === 'auditoria' && (
              <div className="drawer-tab-content">
                <div className="detail-section-title">Acciones de Verificación y Moderación</div>

                <div className="quick-actions-card">
                  <p className="actions-card-desc">
                    Puedes actualizar el estado del usuario directamente o saltar a la mesa de verificación con visualizador de documentos completo.
                  </p>

                  <div className="actions-button-stack">
                    <button
                      type="button"
                      className="drawer-action-btn btn-approve"
                      disabled={isUpdatingStatus || user.kycStatus === 'verified'}
                      onClick={() =>
                        handleRequestStatusChange(
                          'verified',
                          'approve',
                          '¿Aprobar Verificación de Identidad?',
                          `¿Confirmas que deseas marcar como Verificado a ${user.fullName}? Se le notificará por correo.`,
                          'Sí, Aprobar',
                          { notes: 'Verificación aprobada por administrador.' },
                        )
                      }
                    >
                      <CheckCircle2 size={18} />
                      <span>Aprobar Verificación (Marcar Verificado)</span>
                    </button>

                    <button
                      type="button"
                      className="drawer-action-btn btn-request-docs"
                      disabled={isUpdatingStatus || user.kycStatus === 'requires_documentation'}
                      onClick={() =>
                        handleRequestStatusChange(
                          'requires_documentation',
                          'requires_docs',
                          '¿Solicitar Más Documentación?',
                          `Se solicitará a ${user.fullName} que adjunte documentación legible o actualizada.`,
                          'Sí, Solicitar',
                          { reason: 'Se solicita documento legible o actualizado.' },
                        )
                      }
                    >
                      <FileQuestion size={18} />
                      <span>Solicitar Más Documentación</span>
                    </button>

                    <button
                      type="button"
                      className="drawer-action-btn btn-reject"
                      disabled={isUpdatingStatus || user.kycStatus === 'rejected'}
                      onClick={() =>
                        handleRequestStatusChange(
                          'rejected',
                          'reject',
                          '¿Rechazar Verificación?',
                          `¿Confirmas el rechazo de la verificación de ${user.fullName}?`,
                          'Sí, Rechazar',
                          { reason: 'Documentación inválida o rechazada.' },
                        )
                      }
                    >
                      <XCircle size={18} />
                      <span>Rechazar Verificación</span>
                    </button>
                  </div>
                </div>

                {onNavigateToKyc && (
                  <div className="drawer-full-kyc-link-box">
                    <button
                      type="button"
                      className="btn-full-kyc-audit"
                      onClick={() => {
                        onClose();
                        onNavigateToKyc(user);
                      }}
                    >
                      <span>Ir a Mesa de Auditoría KYC</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}

                {/* Delete Action */}
                {onDeactivateUser && (
                  <div style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      className="drawer-action-btn btn-deactivate-drawer"
                      onClick={() => {
                        onDeactivateUser(user);
                      }}
                    >
                      <Trash2 size={18} />
                      <span>Borrar Usuario</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="slide-over-footer" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="action-btn secondary btn-close-drawer" onClick={onClose}>
              Cerrar Panel
            </button>
          </div>
        </aside>
      </div>

      {/* Confirmation Dialog inside Drawer */}
      {confirmDialog && (
        <div
          className="kyc-confirm-dialog-backdrop"
          onClick={() => setConfirmDialog(null)}
        >
          <div
            className="kyc-confirm-dialog-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-header-row">
              <div className={`confirm-icon-box ${confirmDialog.type}`}>
                {confirmDialog.type === 'approve' && <ShieldCheck size={24} />}
                {confirmDialog.type === 'requires_docs' && <AlertTriangle size={24} />}
                {confirmDialog.type === 'reject' && <XCircle size={24} />}
              </div>
              <div className="confirm-title-wrap">
                <h3 className="confirm-title">{confirmDialog.title}</h3>
                <p className="confirm-message">{confirmDialog.message}</p>
              </div>
            </div>

            <div className="confirm-actions-row">
              <button
                type="button"
                className="confirm-btn cancel"
                onClick={() => setConfirmDialog(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={`confirm-btn submit ${confirmDialog.type}`}
                onClick={handleExecuteConfirmedStatusChange}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const UserDetailDrawer: FC<UserDetailDrawerProps> = ({
  isOpen,
  user,
  onClose,
  onNavigateToKyc,
  onUserUpdated,
  onDeactivateUser,
}) => {
  if (!isOpen || !user) return null;
  return (
    <UserDetailDrawerContent
      key={user.id}
      user={user}
      onClose={onClose}
      onNavigateToKyc={onNavigateToKyc}
      onUserUpdated={onUserUpdated}
      onDeactivateUser={onDeactivateUser}
    />
  );
};
