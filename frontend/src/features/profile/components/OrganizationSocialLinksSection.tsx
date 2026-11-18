import type { FC } from 'react';
import { useState, useEffect } from 'react';
import {
  ExternalLink,
  Edit3,
  Check,
  X,
  Loader2,
  Share2,
  Plus,
} from 'lucide-react';
import {
  organizationsApi,
  type OrganizationItem,
  type OrganizationSocialLinks,
} from '../../../shared/api/organizationsApi.ts';
import { useToast } from '../../../shared/context/ToastContext.tsx';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';
import './OrganizationSocialLinksSection.css';

interface OrganizationSocialLinksSectionProps {
  organization: OrganizationItem;
  isOwnerOrAdmin: boolean;
  onUpdate: (updated: OrganizationItem) => void;
}

// Brand SVG Icons
const WhatsAppIcon: FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M17.5 14.39c-.28-.14-1.65-.81-1.9-.9-.26-.1-.44-.14-.63.14-.19.28-.73.9-.9 1.09-.16.19-.33.21-.61.07-.28-.14-1.2-.44-2.28-1.41-.84-.75-1.41-1.68-1.58-1.96-.16-.28-.02-.44.12-.58.13-.13.28-.33.42-.5.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.5-.07-.14-.63-1.51-.86-2.07-.23-.55-.46-.47-.63-.48-.16-.01-.35-.01-.54-.01-.19 0-.5.07-.76.35-.26.28-1 .98-1 2.38 0 1.41 1.03 2.76 1.17 2.96.14.19 2.02 3.09 4.9 4.33.68.29 1.22.47 1.63.6.69.22 1.32.19 1.81.12.55-.08 1.65-.67 1.88-1.33.24-.65.24-1.21.16-1.33-.07-.12-.25-.19-.53-.33z"
      fill="#25D366"
    />
    <path
      d="M12 2C6.48 2 2 6.48 2 12c0 1.95.56 3.77 1.53 5.32L2 22l4.82-1.49C8.31 21.46 10.1 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18.25c-1.68 0-3.24-.49-4.57-1.33l-.33-.21-3.24 1 1.03-3.15-.22-.35A8.17 8.17 0 0 1 3.75 12c0-4.55 3.7-8.25 8.25-8.25 4.55 0 8.25 3.7 8.25 8.25 0 4.55-3.7 8.25-8.25 8.25z"
      fill="#25D366"
    />
  </svg>
);

const InstagramIcon: FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="5" stroke="#E4405F" strokeWidth="2" />
    <path
      d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"
      stroke="#E4405F"
      strokeWidth="2"
    />
    <circle cx="17.5" cy="6.5" r="1.5" fill="#E4405F" />
  </svg>
);

const FacebookIcon: FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      fill="#1877F2"
    />
  </svg>
);

const YoutubeIcon: FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
      fill="#FF0000"
    />
  </svg>
);

const TikTokIcon: FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.11V9.4a6.33 6.33 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 9.77 5.34c1.89-1.24 3.02-3.37 3.02-5.64V8.51c1.24.89 2.74 1.41 4.3 1.46V6.69h-.64z"
      fill="#111827"
    />
  </svg>
);

export const OrganizationSocialLinksSection: FC<OrganizationSocialLinksSectionProps> = ({
  organization,
  isOwnerOrAdmin,
  onUpdate,
}) => {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [drafts, setDrafts] = useState<OrganizationSocialLinks>(() => organization.socialLinks || {});

  useEffect(() => {
    setDrafts(organization.socialLinks || {});
  }, [organization.socialLinks]);

  const social = organization.socialLinks || {};
  const hasAnyLink = Boolean(
    social.whatsapp || social.instagram || social.facebook || social.youtube || social.tiktok,
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await organizationsApi.updateOrganization(organization.id, {
        socialLinks: drafts,
      });
      onUpdate(updated);
      setIsEditing(false);
      toast.success('Enlaces de redes y canales guardados correctamente.', 'Redes Actualizadas');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudieron actualizar los enlaces'), 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDrafts(organization.socialLinks || {});
    setIsEditing(false);
  };

  return (
    <div className="brotar-org-social-card">
      <div className="brotar-org-social-header">
        <div className="brotar-org-social-title-wrap">
          <Share2 size={16} className="brotar-org-social-icon" />
          <h4 className="brotar-org-social-title">Canales de Comunicación y Redes</h4>
        </div>

        {isOwnerOrAdmin && !isEditing && (
          <button
            type="button"
            className="brotar-org-social-edit-btn"
            onClick={() => setIsEditing(true)}
            title="Configurar enlaces de redes"
          >
            <Edit3 size={14} />
            <span>{hasAnyLink ? 'Editar enlaces' : 'Configurar'}</span>
          </button>
        )}
      </div>

      {isEditing ? (
        /* Edit Mode Form */
        <div className="brotar-org-social-edit-form">
          <p className="brotar-org-social-hint">
            Agrega los enlaces a tus canales oficiales para que voluntarios y donantes puedan unirse y seguir tus avances.
          </p>

          <div className="brotar-org-social-fields">
            {/* WhatsApp */}
            <div className="brotar-org-social-field">
              <label className="brotar-org-social-field-label">
                <WhatsAppIcon size={16} />
                <span>WhatsApp (Grupo de comunidad o chat)</span>
              </label>
              <input
                type="text"
                className="brotar-org-social-input"
                placeholder="https://chat.whatsapp.com/... o +591 7..."
                value={drafts.whatsapp || ''}
                onChange={(e) => setDrafts((prev) => ({ ...prev, whatsapp: e.target.value }))}
              />
            </div>

            {/* Instagram */}
            <div className="brotar-org-social-field">
              <label className="brotar-org-social-field-label">
                <InstagramIcon size={16} />
                <span>Instagram</span>
              </label>
              <input
                type="text"
                className="brotar-org-social-input"
                placeholder="https://instagram.com/tu_ong o @tu_ong"
                value={drafts.instagram || ''}
                onChange={(e) => setDrafts((prev) => ({ ...prev, instagram: e.target.value }))}
              />
            </div>

            {/* Facebook */}
            <div className="brotar-org-social-field">
              <label className="brotar-org-social-field-label">
                <FacebookIcon size={16} />
                <span>Facebook</span>
              </label>
              <input
                type="text"
                className="brotar-org-social-input"
                placeholder="https://facebook.com/tu_pagina"
                value={drafts.facebook || ''}
                onChange={(e) => setDrafts((prev) => ({ ...prev, facebook: e.target.value }))}
              />
            </div>

            {/* YouTube */}
            <div className="brotar-org-social-field">
              <label className="brotar-org-social-field-label">
                <YoutubeIcon size={16} />
                <span>YouTube</span>
              </label>
              <input
                type="text"
                className="brotar-org-social-input"
                placeholder="https://youtube.com/@tu_canal"
                value={drafts.youtube || ''}
                onChange={(e) => setDrafts((prev) => ({ ...prev, youtube: e.target.value }))}
              />
            </div>

            {/* TikTok */}
            <div className="brotar-org-social-field">
              <label className="brotar-org-social-field-label">
                <TikTokIcon size={16} />
                <span>TikTok</span>
              </label>
              <input
                type="text"
                className="brotar-org-social-input"
                placeholder="https://tiktok.com/@tu_cuenta o @tu_cuenta"
                value={drafts.tiktok || ''}
                onChange={(e) => setDrafts((prev) => ({ ...prev, tiktok: e.target.value }))}
              />
            </div>
          </div>

          <div className="brotar-org-social-actions">
            <button
              type="button"
              className="brotar-org-social-save-btn"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="brotar-spin" />
                  <span>Guardando…</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Guardar enlaces</span>
                </>
              )}
            </button>
            <button
              type="button"
              className="brotar-org-social-cancel-btn"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X size={14} />
              <span>Cancelar</span>
            </button>
          </div>
        </div>
      ) : (
        /* Read Mode Buttons */
        <div className="brotar-org-social-pills-wrap">
          {hasAnyLink ? (
            <div className="brotar-org-social-pills">
              {social.whatsapp && (
                <a
                  href={social.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brotar-org-social-pill brotar-org-social-pill--whatsapp"
                  title="Unirse al grupo o chat de WhatsApp"
                >
                  <WhatsAppIcon size={18} />
                  <span className="brotar-org-social-pill-name">Comunidad WhatsApp</span>
                  <ExternalLink size={13} className="brotar-org-social-pill-ext" />
                </a>
              )}

              {social.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brotar-org-social-pill brotar-org-social-pill--instagram"
                  title="Ver perfil de Instagram"
                >
                  <InstagramIcon size={17} />
                  <span className="brotar-org-social-pill-name">Instagram</span>
                  <ExternalLink size={13} className="brotar-org-social-pill-ext" />
                </a>
              )}

              {social.facebook && (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brotar-org-social-pill brotar-org-social-pill--facebook"
                  title="Visitar página de Facebook"
                >
                  <FacebookIcon size={17} />
                  <span className="brotar-org-social-pill-name">Facebook</span>
                  <ExternalLink size={13} className="brotar-org-social-pill-ext" />
                </a>
              )}

              {social.youtube && (
                <a
                  href={social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brotar-org-social-pill brotar-org-social-pill--youtube"
                  title="Ver canal de YouTube"
                >
                  <YoutubeIcon size={17} />
                  <span className="brotar-org-social-pill-name">YouTube</span>
                  <ExternalLink size={13} className="brotar-org-social-pill-ext" />
                </a>
              )}

              {social.tiktok && (
                <a
                  href={social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brotar-org-social-pill brotar-org-social-pill--tiktok"
                  title="Ver perfil de TikTok"
                >
                  <TikTokIcon size={17} />
                  <span className="brotar-org-social-pill-name">TikTok</span>
                  <ExternalLink size={13} className="brotar-org-social-pill-ext" />
                </a>
              )}
            </div>
          ) : (
            <div className="brotar-org-social-empty">
              <p>Aún no se han configurado canales o redes sociales para esta organización.</p>
              {isOwnerOrAdmin && (
                <button
                  type="button"
                  className="brotar-org-social-add-link-btn"
                  onClick={() => setIsEditing(true)}
                >
                  <Plus size={14} />
                  <span>Vincular canales ahora</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const OrganizationMiniSocialRow: FC<{
  socialLinks?: OrganizationSocialLinks;
  className?: string;
}> = ({ socialLinks, className = '' }) => {
  if (!socialLinks) return null;
  const { whatsapp, instagram, facebook, youtube, tiktok } = socialLinks;
  if (!whatsapp && !instagram && !facebook && !youtube && !tiktok) return null;

  return (
    <div className={`brotar-org-mini-social-row ${className}`}>
      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="brotar-org-mini-social-btn brotar-org-mini-social-btn--whatsapp"
          title="WhatsApp"
          onClick={(e) => e.stopPropagation()}
        >
          <WhatsAppIcon size={14} />
        </a>
      )}
      {instagram && (
        <a
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="brotar-org-mini-social-btn brotar-org-mini-social-btn--instagram"
          title="Instagram"
          onClick={(e) => e.stopPropagation()}
        >
          <InstagramIcon size={14} />
        </a>
      )}
      {facebook && (
        <a
          href={facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="brotar-org-mini-social-btn brotar-org-mini-social-btn--facebook"
          title="Facebook"
          onClick={(e) => e.stopPropagation()}
        >
          <FacebookIcon size={14} />
        </a>
      )}
      {youtube && (
        <a
          href={youtube}
          target="_blank"
          rel="noopener noreferrer"
          className="brotar-org-mini-social-btn brotar-org-mini-social-btn--youtube"
          title="YouTube"
          onClick={(e) => e.stopPropagation()}
        >
          <YoutubeIcon size={14} />
        </a>
      )}
      {tiktok && (
        <a
          href={tiktok}
          target="_blank"
          rel="noopener noreferrer"
          className="brotar-org-mini-social-btn brotar-org-mini-social-btn--tiktok"
          title="TikTok"
          onClick={(e) => e.stopPropagation()}
        >
          <TikTokIcon size={14} />
        </a>
      )}
    </div>
  );
};
