import type { FC } from 'react';
import { useState } from 'react';
import {
  X,
  Building2,
  Copy,
  Check,
  Users,
  Trash2,
  LogOut,
  AlertCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import {
  organizationsApi,
  type OrganizationItem,
  type OrganizationMember,
} from '../../../shared/api/organizationsApi.ts';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';
import { useToast } from '../../../shared/context/ToastContext.tsx';
import { OrganizationSocialLinksSection } from './OrganizationSocialLinksSection.tsx';
import './ManageOrganizationModal.css';

interface ManageOrganizationModalProps {
  organization: OrganizationItem;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: OrganizationItem) => void;
  onLeaveOrDelete: (orgId: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  creator: 'Co-creador',
  member: 'Miembro',
  collaborator: 'Colaborador',
  owner: 'Fundador',
};

export const ManageOrganizationModal: FC<ManageOrganizationModalProps> = ({
  organization,
  currentUserId,
  isOpen,
  onClose,
  onUpdate,
  onLeaveOrDelete,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showDissolveModal, setShowDissolveModal] = useState(false);
  const [dissolveInput, setDissolveInput] = useState('');
  const [isDissolving, setIsDissolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  if (!isOpen) return null;

  const isOwnerOrAdmin =
    organization.myRole === 'owner' || organization.myRole === 'admin';

  const inviteLink = `${window.location.origin}/organizaciones/unirse?codigo=${organization.inviteCode}`;

  const handleCopyCode = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(organization.inviteCode);
        setCopiedCode(true);
        toast.info(`Código ${organization.inviteCode} copiado al portapapeles.`, 'Código Copiado');
        setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(inviteLink);
        setCopiedLink(true);
        toast.info('Enlace de invitación copiado al portapapeles.', 'Enlace Copiado');
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  const handleRoleChange = async (
    targetMember: OrganizationMember,
    newRole: 'admin' | 'creator' | 'member' | 'collaborator',
  ) => {
    if (updatingMemberId) return;
    setUpdatingMemberId(targetMember.userId);
    setError(null);

    try {
      const updated = await organizationsApi.updateMemberRole(
        organization.id,
        targetMember.userId,
        newRole,
      );
      toast.success(
        `Rol de ${targetMember.fullName} actualizado a ${ROLE_LABELS[newRole] || newRole}.`,
        'Rol Actualizado',
      );
      onUpdate(updated);
    } catch (err) {
      const msg = getApiErrorMessage(err, 'No se pudo actualizar el rol');
      setError(msg);
      toast.error(msg, 'Error al actualizar');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleConfirmRemove = async (targetMember: OrganizationMember) => {
    if (isRemoving) return;
    setIsRemoving(true);
    setError(null);

    const isSelf = targetMember.userId === currentUserId;

    try {
      const updated = await organizationsApi.removeMember(
        organization.id,
        targetMember.userId,
      );

      if (isSelf) {
        toast.info(
          `Has salido de la organización "${organization.legalName}".`,
          'Equipo Actualizado',
        );
        onLeaveOrDelete(organization.id);
        onClose();
      } else {
        toast.success(
          `${targetMember.fullName} ha sido removido del equipo.`,
          'Miembro Removido',
        );
        onUpdate(updated);
        setConfirmRemoveId(null);
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, 'No se pudo remover al miembro');
      setError(msg);
      toast.error(msg, 'Error al remover');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleDissolveOrganization = async () => {
    if (isDissolving) return;
    setIsDissolving(true);
    setError(null);

    try {
      await organizationsApi.deleteOrganization(organization.id);
      toast.success(
        `La organización "${organization.legalName}" ha sido disuelta exitosamente.`,
        'Organización Disuelta',
      );
      onLeaveOrDelete(organization.id);
      setShowDissolveModal(false);
      onClose();
    } catch (err) {
      const msg = getApiErrorMessage(err, 'No se pudo disolver la organización');
      setError(msg);
      toast.error(msg, 'Error al disolver');
    } finally {
      setIsDissolving(false);
    }
  };

  return (
    <div
      className="brotar-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="brotar-modal-card brotar-manage-org-modal">
        <header className="brotar-modal-header">
          <div className="brotar-modal-title-wrap">
            <div className="brotar-modal-icon-badge">
              <Building2 size={22} />
            </div>
            <div>
              <h3 className="brotar-modal-title">{organization.legalName}</h3>
              <p className="brotar-modal-subtitle">
                {organization.taxId}{' '}
                {organization.address ? `• ${organization.address}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="brotar-modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </header>

        {error && (
          <div className="brotar-modal-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="brotar-manage-org-body">
          {/* Invite Code & Link Box */}
          <div className="brotar-invite-box">
            <div className="brotar-invite-header">
              <h4 className="brotar-invite-title">Invitar miembros al equipo</h4>
              <span className="brotar-invite-badge">Código único</span>
            </div>

            <div className="brotar-invite-row">
              <div className="brotar-invite-code-pill">
                <span className="brotar-code-val">{organization.inviteCode}</span>
                <button
                  type="button"
                  className="brotar-copy-icon-btn"
                  onClick={handleCopyCode}
                  title="Copiar código"
                >
                  {copiedCode ? (
                    <Check size={16} color="#17913f" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>

              <button
                type="button"
                className="brotar-copy-link-btn"
                onClick={handleCopyLink}
              >
                {copiedLink ? (
                  <>
                    <Check size={15} /> <span>¡Enlace copiado!</span>
                  </>
                ) : (
                  <>
                    <ExternalLink size={15} />{' '}
                    <span>Copiar enlace de invitación</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Channels & WhatsApp Community */}
          <OrganizationSocialLinksSection
            organization={organization}
            isOwnerOrAdmin={isOwnerOrAdmin}
            onUpdate={onUpdate}
          />

          {/* Team Members List */}
          <div className="brotar-members-section">
            <div className="brotar-members-header">
              <div className="brotar-members-title-wrap">
                <Users size={16} className="brotar-members-icon" />
                <h4 className="brotar-members-title">
                  Miembros ({organization.members.length})
                </h4>
              </div>
            </div>

            <div className="brotar-members-list">
              {organization.members.map((member: OrganizationMember) => {
                const isMe = member.userId === currentUserId;
                const isUpdatingThisMember = updatingMemberId === member.userId;
                const isConfirmingRemoveThis = confirmRemoveId === member.userId;

                return (
                  <div key={member.userId} className="brotar-member-row">
                    <div className="brotar-member-avatar">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.fullName} />
                      ) : (
                        <span>{member.fullName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>

                    <div className="brotar-member-info">
                      <div className="brotar-member-name-row">
                        <span className="brotar-member-name">
                          {member.fullName}
                        </span>
                        {isMe && <span className="brotar-you-badge">Tú</span>}
                      </div>
                      <span className="brotar-member-email">{member.email}</span>
                    </div>

                    {/* Member Actions & Roles */}
                    <div className="brotar-member-actions">
                      {isConfirmingRemoveThis ? (
                        /* Inline Removal Confirmation */
                        <div className="brotar-member-confirm-box">
                          <span className="brotar-confirm-text">
                            {isMe ? '¿Salir del equipo?' : '¿Remover?'}
                          </span>
                          <button
                            type="button"
                            className="brotar-confirm-btn-yes"
                            onClick={() => handleConfirmRemove(member)}
                            disabled={isRemoving}
                          >
                            {isRemoving ? (
                              <Loader2 size={12} className="brotar-spin" />
                            ) : (
                              'Sí'
                            )}
                          </button>
                          <button
                            type="button"
                            className="brotar-confirm-btn-no"
                            onClick={() => setConfirmRemoveId(null)}
                            disabled={isRemoving}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Role Tag or Role Selector */}
                          {isOwnerOrAdmin && !isMe && member.roleInOrg !== 'owner' ? (
                            <div className="brotar-role-select-wrap">
                              <select
                                value={member.roleInOrg}
                                onChange={(e) =>
                                  handleRoleChange(
                                    member,
                                    e.target.value as any,
                                  )
                                }
                                disabled={isUpdatingThisMember || isRemoving}
                                className="brotar-role-select"
                              >
                                <option value="admin">Administrador</option>
                                <option value="creator">Co-creador</option>
                                <option value="collaborator">Colaborador</option>
                                <option value="member">Miembro</option>
                              </select>
                              {isUpdatingThisMember && (
                                <Loader2
                                  size={13}
                                  className="brotar-spin brotar-role-spin"
                                />
                              )}
                            </div>
                          ) : (
                            <span
                              className={`brotar-role-tag role-${member.roleInOrg}`}
                            >
                              {ROLE_LABELS[member.roleInOrg] || member.roleInOrg}
                            </span>
                          )}

                          {/* Remove / Leave Action Button */}
                          {(isOwnerOrAdmin || isMe) && (
                            <button
                              type="button"
                              className="brotar-member-remove-btn"
                              onClick={() => setConfirmRemoveId(member.userId)}
                              title={
                                isMe
                                  ? 'Salir de la organización'
                                  : 'Remover miembro del equipo'
                              }
                              disabled={Boolean(updatingMemberId) || isRemoving}
                            >
                              {isMe ? <LogOut size={16} /> : <Trash2 size={16} />}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="brotar-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {organization.myRole === 'owner' ? (
            <button
              type="button"
              className="brotar-dissolve-btn"
              onClick={() => {
                setDissolveInput('');
                setShowDissolveModal(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#dc2626',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '0.55rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Trash2 size={15} />
              <span>Disolver organización</span>
            </button>
          ) : <div />}

          <button
            type="button"
            className="brotar-btn-primary"
            onClick={onClose}
          >
            <Check size={16} />
            <span>Listo</span>
          </button>
        </footer>
      </div>

      {/* Double confirmation modal for dissolving organization */}
      {showDissolveModal && (
        <div
          className="brotar-modal-overlay"
          style={{ zIndex: 1100, background: 'rgba(0, 0, 0, 0.65)' }}
        >
          <div
            className="brotar-modal-card"
            style={{ maxWidth: '440px', padding: '1.75rem', borderRadius: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#fef2f2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertCircle size={22} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#111827', fontWeight: 700 }}>
                  ¿Disolver organización?
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7280' }}>
                  Esta acción es definitiva e irreversible
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#374151', lineHeight: 1.5, marginBottom: '1rem' }}>
              Se eliminará el equipo <strong>{organization.legalName}</strong> y todos sus miembros perderán el acceso.
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label
                style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}
              >
                Escribe <strong>{organization.legalName}</strong> para confirmar:
              </label>
              <input
                type="text"
                placeholder={organization.legalName}
                value={dissolveInput}
                onChange={(e) => setDissolveInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem',
                }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="brotar-phone-cancel-btn"
                onClick={() => setShowDissolveModal(false)}
                disabled={isDissolving}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDissolveOrganization}
                disabled={
                  dissolveInput.trim().toLowerCase() !== organization.legalName.trim().toLowerCase() ||
                  isDissolving
                }
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '8px',
                  border: 'none',
                  background:
                    dissolveInput.trim().toLowerCase() === organization.legalName.trim().toLowerCase()
                      ? '#dc2626'
                      : '#fca5a5',
                  color: '#fff',
                  fontWeight: 600,
                  cursor:
                    dissolveInput.trim().toLowerCase() === organization.legalName.trim().toLowerCase()
                      ? 'pointer'
                      : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {isDissolving ? (
                  <Loader2 size={16} className="brotar-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                <span>Disolver equipo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
