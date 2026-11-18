import type { FC } from 'react';
import { useState, useEffect } from 'react';
import {
  X,
  FileText,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Eye,
  Building2,
  Calendar,
  Mail,
  Phone,
  UserCheck,
  FileCheck2,
  Clock,
  ExternalLink,
  ZoomIn,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Button } from '../../../shared/components/Button.tsx';
import type { KycRowItem } from '../types/admin.types.ts';
import type { KycStatusType } from '../../../shared/api/usersApi.ts';
import { KycStatusBadge } from './KycStatusBadge.tsx';

type UpdateKycStatusHandler = (
  id: string,
  status: KycStatusType,
  notes?: string,
  reason?: string,
) => Promise<boolean>;

export interface KycDetailModalProps {
  isOpen: boolean;
  item: KycRowItem | null;
  onClose: () => void;
  onUpdateStatus: UpdateKycStatusHandler;
  isLoadingDocuments?: boolean;
  documentsError?: string | null;
  onRetryDocuments?: () => void;
  updateError?: string | null;
}

interface ConfirmDialogState {
  type: 'approve' | 'requires_docs' | 'reject';
  title: string;
  message: string;
  confirmLabel: string;
}

type KycDetailModalContentProps = Omit<KycDetailModalProps, 'isOpen' | 'item'> & {
  item: KycRowItem;
};

const KycDetailModalContent: FC<KycDetailModalContentProps> = ({
  item,
  onClose,
  onUpdateStatus,
  isLoadingDocuments = false,
  documentsError = null,
  onRetryDocuments,
  updateError = null,
}) => {
  const [activeTab, setActiveTab] = useState<'docs' | 'expediente' | 'dictamen'>('docs');
  const [actionMode, setActionMode] = useState<'none' | 'requires_docs' | 'reject'>('none');
  const [isUpdating, setIsUpdating] = useState(false);
  const [docsRequestInput, setDocsRequestInput] = useState<string>('');
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmDialog) {
          setConfirmDialog(null);
        } else if (zoomImage) {
          setZoomImage(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, zoomImage, confirmDialog]);

  const rawUser = item.rawUser;
  const frontUrl = rawUser?.documentFrontUrl;
  const backUrl = rawUser?.documentBackUrl;
  const hasFront = Boolean(rawUser?.hasDocumentFront || frontUrl);
  const hasBack = Boolean(rawUser?.hasDocumentBack || backUrl);
  const documentLabel = item.ciDocument ?? 'Sin número registrado';

  const initials = (rawUser?.organizationName || item.name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join('');

  const handleRequestApprove = () => {
    setConfirmDialog({
      type: 'approve',
      title: '¿Confirmar Aprobación de Identidad?',
      message: `¿Estás seguro de verificar y habilitar la cuenta de "${item.name}"? Se le enviará un correo institucional de confirmación.`,
      confirmLabel: 'Sí, Aprobar y Verificar',
    });
  };

  const handleRequestRequiresDocs = () => {
    if (!docsRequestInput.trim()) return;
    setConfirmDialog({
      type: 'requires_docs',
      title: '¿Solicitar Corrección de Documentos?',
      message: `¿Estás seguro de solicitar documentación complementaria a "${item.name}"? Se le notificará con las observaciones registradas.`,
      confirmLabel: 'Sí, Enviar Observaciones',
    });
  };

  const handleRequestRejection = () => {
    if (!rejectionReasonInput.trim()) return;
    setConfirmDialog({
      type: 'reject',
      title: '¿Confirmar Rechazo de Solicitud?',
      message: `¿Estás seguro de rechazar la solicitud de "${item.name}"? Se le enviará un correo con el motivo oficial de rechazo.`,
      confirmLabel: 'Sí, Confirmar Rechazo',
    });
  };

  const handleExecuteConfirmedAction = async () => {
    if (!confirmDialog || isUpdating) return;

    setIsUpdating(true);
    let accepted = false;
    if (confirmDialog.type === 'approve') {
      accepted = await onUpdateStatus(item.id, 'verified');
    } else if (confirmDialog.type === 'requires_docs') {
      accepted = await onUpdateStatus(
        item.id,
        'requires_documentation',
        undefined,
        docsRequestInput.trim(),
      );
    } else if (confirmDialog.type === 'reject') {
      accepted = await onUpdateStatus(item.id, 'rejected', undefined, rejectionReasonInput.trim());
    }
    setIsUpdating(false);
    setConfirmDialog(null);

    if (accepted) {
      setActionMode('none');
      onClose();
    } else {
      setActiveTab('dictamen');
    }
  };

  return (
    <>
      <div className="slide-over-backdrop" onClick={onClose}>
        <aside
          className="slide-over-panel kyc-audit-panel"
          onClick={(e) => e.stopPropagation()}
          aria-label="Mesa de Auditoría KYC"
        >
          {/* Header */}
          <div className="slide-over-header">
            <div className="user-header-profile">
              {rawUser?.avatarUrl ? (
                <img
                  src={rawUser.avatarUrl}
                  alt={item.name}
                  className="user-avatar-image"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="user-avatar-large audit-avatar-brand">
                  <span>{initials || 'ID'}</span>
                </div>
              )}
              <div className="user-header-info">
                <div className="audit-header-title-row">
                  <h2 className="user-header-name">{rawUser?.organizationName || item.name}</h2>
                </div>
                <div className="user-header-tags">
                  <span className={`role-badge ${rawUser?.role || 'sponsor'}`}>
                    {rawUser?.role === 'creator'
                      ? 'Creador / ONG'
                      : rawUser?.role === 'admin'
                      ? 'Admin'
                      : 'Sponsor / Donante'}
                  </span>
                  <KycStatusBadge status={item.status} />
                  <span className="kyc-doc-ci-tag">{documentLabel}</span>
                </div>
                <span className="user-header-email">{item.email}</span>
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

          {/* Navigation Tabs Bar */}
          <div className="drawer-tabs-bar">
            <button
              type="button"
              className={`drawer-tab-btn ${activeTab === 'docs' ? 'active' : ''}`}
              onClick={() => setActiveTab('docs')}
            >
              <FileCheck2 size={16} />
              <span>Documentos & Cotejo</span>
              <span className="tab-pill-badge">{Number(hasFront) + Number(hasBack)}</span>
            </button>
            <button
              type="button"
              className={`drawer-tab-btn ${activeTab === 'expediente' ? 'active' : ''}`}
              onClick={() => setActiveTab('expediente')}
            >
              <UserCheck size={16} />
              <span>Expediente del Titular</span>
            </button>
            <button
              type="button"
              className={`drawer-tab-btn ${activeTab === 'dictamen' ? 'active' : ''}`}
              onClick={() => setActiveTab('dictamen')}
            >
              <ShieldCheck size={16} />
              <span>Dictamen & Acciones</span>
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="slide-over-body">
            {/* TAB 1: Document Scans / Previews */}
            {activeTab === 'docs' && (
              <div className="drawer-tab-content">
                <div className="audit-section-hero">
                  <div className="hero-text">
                    <span className="detail-section-title">Cotejo de Documentos Oficiales</span>
                    <p className="hero-desc">
                      Haz clic en cualquier imagen para abrir el visualizador de alta resolución y cotejar sellos, firmas y fotografía del titular.
                    </p>
                  </div>
                </div>

                {!hasFront && !hasBack ? (
                  <div className="audit-empty-docs-card">
                    <FileText size={36} className="text-muted" />
                    <h4>Sin documentos enviados</h4>
                    <p>El usuario todavía no ha cargado imágenes de su documento de identidad.</p>
                  </div>
                ) : isLoadingDocuments ? (
                  <div className="audit-empty-docs-card">
                    <Clock size={36} className="text-muted" />
                    <h4>Cargando documentos…</h4>
                  </div>
                ) : documentsError ? (
                  <div className="audit-empty-docs-card">
                    <AlertTriangle size={36} className="text-muted" />
                    <h4>No se pudieron cargar los documentos</h4>
                    <p>{documentsError}</p>
                    {onRetryDocuments && (
                      <Button variant="ghost" size="sm" onClick={onRetryDocuments}>
                        Reintentar
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="audit-scans-grid">
                    {/* Anverso */}
                    {frontUrl ? (
                      <div
                        className="audit-scan-card"
                        onClick={() => setZoomImage({ url: frontUrl, title: `Anverso - ${item.name} (${documentLabel})` })}
                      >
                        <div className="scan-card-header">
                          <span className="scan-side-tag">Anverso (Frontal)</span>
                          <span className="scan-zoom-pill">
                            <ZoomIn size={13} />
                            <span>Ampliar</span>
                          </span>
                        </div>
                        <div className="scan-image-viewport">
                          <img src={frontUrl} alt="Anverso del Documento de Identidad" />
                          <div className="scan-hover-overlay">
                            <Eye size={20} />
                            <span>Ver en pantalla completa</span>
                          </div>
                        </div>
                        <div className="scan-card-footer">
                          <span className="scan-meta-txt">Documento: {documentLabel}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="audit-scan-card empty">
                        <div className="scan-placeholder-box">
                          <FileText size={32} className="text-muted" />
                          <span>Sin foto de anverso</span>
                        </div>
                      </div>
                    )}

                    {/* Reverso */}
                    {backUrl ? (
                      <div
                        className="audit-scan-card"
                        onClick={() => setZoomImage({ url: backUrl, title: `Reverso - ${item.name} (${documentLabel})` })}
                      >
                        <div className="scan-card-header">
                          <span className="scan-side-tag">Reverso (Posterior)</span>
                          <span className="scan-zoom-pill">
                            <ZoomIn size={13} />
                            <span>Ampliar</span>
                          </span>
                        </div>
                        <div className="scan-image-viewport">
                          <img src={backUrl} alt="Reverso del Documento de Identidad" />
                          <div className="scan-hover-overlay">
                            <Eye size={20} />
                            <span>Ver en pantalla completa</span>
                          </div>
                        </div>
                        <div className="scan-card-footer">
                          <span className="scan-meta-txt">Firma y código de control</span>
                        </div>
                      </div>
                    ) : (
                      <div className="audit-scan-card empty">
                        <div className="scan-placeholder-box">
                          <FileText size={32} className="text-muted" />
                          <span>Sin foto de reverso</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Verification Checkpoint Advice */}
                <div className="audit-verification-checklist">
                  <div className="checklist-title">
                    <Info size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Puntos Clave de Control e Información
                  </div>
                  <div className="checklist-items">
                    <div className="checklist-row">
                      <Info size={16} className="text-info-blue" />
                      <span>El nombre completo debe coincidir exactamente con el titular del carnet.</span>
                    </div>
                    <div className="checklist-row">
                      <Info size={16} className="text-info-blue" />
                      <span>El número de CI/NIT ({documentLabel}) debe ser nítido y sin adulteraciones.</span>
                    </div>
                    <div className="checklist-row">
                      <Info size={16} className="text-info-blue" />
                      <span>El documento debe encontrarse vigente y legible en ambas caras.</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Trigger to Jump to Dictamen */}
                <div className="audit-tab-footer-action">
                  <button
                    type="button"
                    className="btn-emitir-resolucion"
                    onClick={() => setActiveTab('dictamen')}
                  >
                    <span>Emitir Resolución de Auditoría</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Expediente y Datos */}
            {activeTab === 'expediente' && (
              <div className="drawer-tab-content">
                <div className="detail-section-title">Datos del Titular y Registro</div>

                <div className="detail-field-list">
                  <div className="detail-field-item">
                    <span className="field-label">
                      <UserCheck size={14} />
                      <span>Nombre Completo / Titular</span>
                    </span>
                    <span className="field-value highlight">{item.name}</span>
                  </div>

                  {rawUser?.organizationName && (
                    <div className="detail-field-item">
                      <span className="field-label">
                        <Building2 size={14} />
                        <span>Razón Social / Organización (KYB)</span>
                      </span>
                      <span className="field-value">{rawUser.organizationName}</span>
                    </div>
                  )}

                  <div className="detail-field-item">
                    <span className="field-label">
                      <FileCheck2 size={14} />
                      <span>Cédula de Identidad / NIT / Registro</span>
                    </span>
                    <span className="field-value highlight text-emerald-dark">
                      {rawUser?.documentType || 'CI'}: {documentLabel}
                    </span>
                  </div>

                  <div className="detail-field-item">
                    <span className="field-label">
                      <Mail size={14} />
                      <span>Correo Electrónico Registrado</span>
                    </span>
                    <span className="field-value">{item.email}</span>
                  </div>

                  <div className="detail-field-item">
                    <span className="field-label">
                      <Phone size={14} />
                      <span>Teléfono de Contacto</span>
                    </span>
                    <span className="field-value">{item.phone || rawUser?.phone || 'No registrado'}</span>
                  </div>

                  <div className="detail-field-item">
                    <span className="field-label">
                      <Clock size={14} />
                      <span>Fecha de Envío de Documentación</span>
                    </span>
                    <span className="field-value">{item.submissionDate ?? 'Sin envío registrado'}</span>
                  </div>

                  {rawUser?.createdAt && (
                    <div className="detail-field-item">
                      <span className="field-label">
                        <Calendar size={14} />
                        <span>Fecha de Registro en Plataforma</span>
                      </span>
                      <span className="field-value">
                        {new Date(rawUser.createdAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Previous Review Feedback */}
                {rawUser?.kycNotes && (
                  <div className="audit-feedback-card warning">
                    <div className="feedback-header">
                      <AlertTriangle size={16} />
                      <span>Notas internas de revisión (no visibles para el usuario)</span>
                    </div>
                    <p>{rawUser.kycNotes}</p>
                  </div>
                )}

                {rawUser?.kycRejectionReason && (
                  <div className="audit-feedback-card danger">
                    <div className="feedback-header">
                      <XCircle size={16} />
                      <span>Último mensaje enviado al usuario</span>
                    </div>
                    <p>{rawUser.kycRejectionReason}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Dictamen & Acciones de Auditoría */}
            {activeTab === 'dictamen' && (
              <div className="drawer-tab-content">
                <div className="detail-section-title">Resolución de Verificación</div>
                <p className="actions-card-desc">
                  Selecciona la resolución correspondiente para esta solicitud de identidad. El usuario recibirá la notificación de inmediato en su panel.
                </p>

                {updateError && (
                  <div className="audit-feedback-card danger" role="alert">
                    <div className="feedback-header">
                      <XCircle size={16} />
                      <span>No se pudo guardar la resolución</span>
                    </div>
                    <p>{updateError}</p>
                  </div>
                )}

                {/* Option 1: Approval Card */}
                <div className={`audit-decision-card approve ${item.status === 'verified' ? 'is-current' : ''}`}>
                  <div className="decision-header">
                    <div className="decision-icon-badge approve">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="decision-title-block">
                      <h4>Aprobar y Verificar Identidad</h4>
                      <p>Habilita al usuario para publicar proyectos ambientales o realizar donaciones institucionales.</p>
                    </div>
                  </div>
                  <div className="decision-action-wrap">
                    <button
                      type="button"
                      className="audit-btn btn-approve-solid"
                      disabled={item.status === 'verified'}
                      onClick={handleRequestApprove}
                    >
                      <ShieldCheck size={16} />
                      <span>{item.status === 'verified' ? 'Identidad ya Verificada' : 'Aprobar Documentación'}</span>
                    </button>
                  </div>
                </div>

                {/* Option 2: Request More Docs Card */}
                <div className={`audit-decision-card request-docs ${actionMode === 'requires_docs' ? 'is-active' : ''}`}>
                  <div className="decision-header">
                    <div className="decision-icon-badge request-docs">
                      <AlertTriangle size={20} />
                    </div>
                    <div className="decision-title-block">
                      <h4>Solicitar Corrección de Documentos</h4>
                      <p>Envía observaciones específicas (ej. documento borroso, ilegible o incompleto).</p>
                    </div>
                  </div>

                  {actionMode === 'requires_docs' ? (
                    <div className="decision-interactive-form">
                      <label className="form-input-label">Mensaje visible para el usuario:</label>
                      <textarea
                        rows={3}
                        className="audit-textarea warning"
                        placeholder="Ej. La fotografía del anverso no es legible. Por favor adjunta una foto nítida de tu cédula de identidad."
                        value={docsRequestInput}
                        onChange={(e) => setDocsRequestInput(e.target.value)}
                        autoFocus
                      />
                      <div className="form-actions-row">
                        <Button variant="ghost" size="sm" onClick={() => setActionMode('none')}>
                          Cancelar
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleRequestRequiresDocs}
                          disabled={!docsRequestInput.trim()}
                        >
                          Continuar &rarr;
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="decision-action-wrap">
                      <button
                        type="button"
                        className="audit-btn btn-request-outline"
                        onClick={() => setActionMode('requires_docs')}
                      >
                        <AlertTriangle size={16} />
                        <span>Solicitar Documentación Complementaria</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Option 3: Reject Card */}
                <div className={`audit-decision-card reject ${actionMode === 'reject' ? 'is-active' : ''}`}>
                  <div className="decision-header">
                    <div className="decision-icon-badge reject">
                      <XCircle size={20} />
                    </div>
                    <div className="decision-title-block">
                      <h4>Rechazar Solicitud</h4>
                      <p>Deniega la verificación en caso de documentación adulterada o suplantación.</p>
                    </div>
                  </div>

                  {actionMode === 'reject' ? (
                    <div className="decision-interactive-form">
                      <label className="form-input-label">Motivo oficial de rechazo:</label>
                      <textarea
                        rows={3}
                        className="audit-textarea danger"
                        placeholder="Ej. El documento no coincide con el titular registrado o se encuentra vencido."
                        value={rejectionReasonInput}
                        onChange={(e) => setRejectionReasonInput(e.target.value)}
                        autoFocus
                      />
                      <div className="form-actions-row">
                        <Button variant="ghost" size="sm" onClick={() => setActionMode('none')}>
                          Cancelar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="btn-reject-confirm"
                          onClick={handleRequestRejection}
                          disabled={!rejectionReasonInput.trim()}
                        >
                          Continuar &rarr;
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="decision-action-wrap">
                      <button
                        type="button"
                        className="audit-btn btn-reject-outline"
                        onClick={() => setActionMode('reject')}
                      >
                        <XCircle size={16} />
                        <span>Rechazar Verificación</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="slide-over-footer" style={{ justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="action-btn secondary btn-close-drawer"
              onClick={onClose}
            >
              Cerrar Panel
            </button>
          </div>
        </aside>
      </div>

      {/* Confirmation Dialog Modal */}
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
                disabled={isUpdating}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={`confirm-btn submit ${confirmDialog.type}`}
                onClick={handleExecuteConfirmedAction}
                disabled={isUpdating}
              >
                {isUpdating ? 'Guardando…' : confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / High-Res Zoom Modal */}
      {zoomImage && (
        <div
          className="kyc-lightbox-backdrop"
          onClick={() => setZoomImage(null)}
        >
          <div className="kyc-lightbox-container" onClick={(e) => e.stopPropagation()}>
            <div className="kyc-lightbox-header">
              <div className="lightbox-title-wrap">
                <FileCheck2 size={18} className="text-emerald" />
                <span className="lightbox-title">{zoomImage.title}</span>
              </div>
              <button
                type="button"
                className="kyc-lightbox-close"
                onClick={() => setZoomImage(null)}
                title="Cerrar visor (Esc)"
              >
                <X size={22} />
              </button>
            </div>
            <div className="kyc-lightbox-body">
              <img src={zoomImage.url} alt={zoomImage.title} className="lightbox-image" />
            </div>
            <div className="kyc-lightbox-footer">
              <span>Usa el scroll o gestos táctiles para inspeccionar detalles del carnet</span>
              <a
                href={zoomImage.url}
                target="_blank"
                rel="noreferrer"
                className="lightbox-open-external"
              >
                <span>Abrir archivo original</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const KycDetailModal: FC<KycDetailModalProps> = ({ isOpen, item, ...contentProps }) => {
  if (!isOpen || !item) return null;
  return <KycDetailModalContent key={item.id} item={item} {...contentProps} />;
};
