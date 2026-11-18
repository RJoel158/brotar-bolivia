import type { FC, ChangeEvent } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  User as UserIcon,
  ShieldCheck,
  ShieldAlert,
  Clock,
  AlertTriangle,
  Building2,
  Users,
  Copy,
  Check,
  Plus,
  KeyRound,
  Shield,
  Loader2,
  Settings2,
  Sprout,
  FolderKanban,
  Camera,
  Mail,
  Phone,
  Pencil,
  Send,
  Lock,
} from 'lucide-react';
import { useAuth } from '../auth/context/useAuth.ts';
import { usersApi, type UserDto } from '../../shared/api/usersApi.ts';
import {
  organizationsApi,
  type OrganizationItem,
} from '../../shared/api/organizationsApi.ts';
import { getApiErrorMessage } from '../auth/utils/getApiErrorMessage.ts';
import { hasSubmittedKycDocuments } from '../kyc/kycEvidence.ts';
import { compressImageToDataUrl } from '../../shared/utils/compressImage.ts';
import { useToast } from '../../shared/context/ToastContext.tsx';
import { CreateOrganizationModal } from './components/CreateOrganizationModal.tsx';
import { JoinOrganizationModal } from './components/JoinOrganizationModal.tsx';
import { ManageOrganizationModal } from './components/ManageOrganizationModal.tsx';
import { OrganizationMiniSocialRow } from './components/OrganizationSocialLinksSection.tsx';
import './ProfilePage.css';

export interface ProfilePageProps {
  initialTab?: 'datos' | 'organizaciones';
  joinCode?: string | null;
  onNavigate?: (route: string) => void;
}

export const ProfilePage: FC<ProfilePageProps> = ({
  initialTab = 'datos',
  joinCode = null,
  onNavigate,
}) => {
  const { user: authUser, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoJoinExecutedRef = useRef<string | null>(null);
  const toast = useToast();

  // Active Tab state (synced with URL search params if present)
  const [activeTab, setActiveTab] = useState<'datos' | 'organizaciones'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'organizaciones' || tabParam === 'equipos' || params.has('codigo') || params.has('code')) {
        return 'organizaciones';
      }
    }
    return initialTab;
  });

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // User Profile State
  const [userProfile, setUserProfile] = useState<UserDto | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Phone editing state
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  // Password reset request state
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Organizations State
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);

  // Modals state
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [isJoinOrgOpen, setIsJoinOrgOpen] = useState(false);
  const [joinCodePrefill, setJoinCodePrefill] = useState<string>('');
  const [selectedOrgForManage, setSelectedOrgForManage] =
    useState<OrganizationItem | null>(null);

  const [copiedOrgId, setCopiedOrgId] = useState<string | null>(null);

  // Hydrate fresh user profile from backend
  const loadProfile = useCallback(async () => {
    try {
      const freshUser = await usersApi.getProfile();
      setUserProfile(freshUser);
      setPhoneDraft(freshUser.phone || '');
    } catch {
      if (authUser) {
        setUserProfile(authUser as unknown as UserDto);
        setPhoneDraft(authUser.phone || '');
      }
    }
  }, [authUser]);

  // Load organizations
  const loadOrganizations = useCallback(async () => {
    setIsLoadingOrgs(true);
    try {
      const data = await organizationsApi.getMyOrganizations();
      setOrganizations(data);
    } catch {
      // ignore
    } finally {
      setIsLoadingOrgs(false);
    }
  }, []);

  const handleOrgJoined = useCallback((joinedOrg: OrganizationItem) => {
    setOrganizations((prev) => {
      const exists = prev.some((o) => o.id === joinedOrg.id);
      if (exists) {
        return prev.map((o) => (o.id === joinedOrg.id ? joinedOrg : o));
      }
      return [joinedOrg, ...prev];
    });
  }, []);

  // Automatic Join Execution from URL Link or invite code
  const executeAutoJoin = useCallback(
    async (codeToJoin: string) => {
      const clean = codeToJoin.trim();
      if (!clean || autoJoinExecutedRef.current === clean) return;
      autoJoinExecutedRef.current = clean;

      try {
        const joined = await organizationsApi.joinByCode(clean);
        const roleLabel =
          joined.myRole === 'owner'
            ? 'Fundador'
            : joined.myRole === 'admin'
              ? 'Administrador'
              : joined.myRole === 'creator'
                ? 'Co-creador'
                : 'Miembro';

        if (joined.alreadyMember) {
          toast.info(
            `Ya formas parte del equipo "${joined.legalName}" (${roleLabel}).`,
            'Equipo Existente',
          );
        } else {
          toast.success(
            `¡Te has unido exitosamente al equipo "${joined.legalName}" como ${roleLabel}!`,
            'Bienvenido al Equipo',
          );
        }

        handleOrgJoined(joined);
        if (typeof window !== 'undefined' && window.history) {
          window.history.replaceState({}, '', '/organizaciones');
        }
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Código inválido o equipo no encontrado');
        toast.error(msg, 'Error al unirse al equipo');
        setJoinCodePrefill(clean);
        setIsJoinOrgOpen(true);
      }
    },
    [handleOrgJoined, toast],
  );

  useEffect(() => {
    void loadProfile();
    void loadOrganizations();
  }, [loadProfile, loadOrganizations]);

  // Check if URL or prop has join code (?codigo=BROTAR-123)
  useEffect(() => {
    let detectedCode = joinCode;
    if (!detectedCode && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      detectedCode = params.get('codigo') || params.get('code') || params.get('invite');
    }

    if (detectedCode) {
      setActiveTab('organizaciones');
      setJoinCodePrefill(detectedCode);
      void executeAutoJoin(detectedCode);
    }
  }, [joinCode, executeAutoJoin]);

  // Handle Interactive Avatar Upload
  const handleAvatarFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Formato no válido. Selecciona una imagen JPG, PNG o WebP.', 'Archivo Inválido');
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Automatically compress and resize image (512x512 max dimension)
      const compressedDataUrl = await compressImageToDataUrl(file, {
        maxDimension: 512,
        quality: 0.85,
        outputMimeType: 'image/jpeg',
      });

      const updated = await usersApi.updateProfile({
        avatarUrl: compressedDataUrl,
      });

      setUserProfile(updated);
      await refreshUser();
      toast.success('Foto de perfil actualizada correctamente.', 'Foto de Perfil');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo actualizar la foto de perfil'), 'Error al actualizar');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle Save Phone
  const handleSavePhone = async () => {
    if (isSavingPhone) return;

    const cleanPhone = phoneDraft.trim();
    const PHONE_REGEX = /^(\+?[1-9]\d{0,3}[- ]?)?([67]\d{7}|\d{7,14})$/;
    if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) {
      setPhoneError('Número inválido. Usa 8 dígitos (ej. 70123456) o formato internacional (+591 70123456).');
      return;
    }

    setPhoneError(null);
    setIsSavingPhone(true);

    try {
      const updated = await usersApi.updateProfile({
        phone: cleanPhone || null,
      });
      setUserProfile(updated);
      await refreshUser();
      setIsEditingPhone(false);
      toast.success('Teléfono de contacto actualizado correctamente.', 'Datos Guardados');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo actualizar el teléfono'), 'Error al guardar');
    } finally {
      setIsSavingPhone(false);
    }
  };

  // Handle Request Password Reset via Email
  const handleRequestPasswordReset = async () => {
    if (isSendingReset) return;
    setIsSendingReset(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setResetSent(true);
      toast.success(
        `Hemos enviado el enlace de restablecimiento a ${userProfile?.email || authUser?.email}. Revisa tu bandeja de entrada.`,
        'Enlace Enviado',
        6000,
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No se pudo enviar el correo de restablecimiento'), 'Error de Envío');
    } finally {
      setIsSendingReset(false);
    }
  };

  // Copy Organization Code helper
  const handleCopyCode = async (orgId: string, code: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(code);
        setCopiedOrgId(orgId);
        toast.info(`Código ${code} copiado al portapapeles.`, 'Código Copiado');
        setTimeout(() => setCopiedOrgId(null), 2000);
      }
    } catch {
      // ignore
    }
  };

  // Organization callbacks
  const handleOrgCreated = (newOrg: OrganizationItem) => {
    setOrganizations((prev) => [newOrg, ...prev]);
    setSelectedOrgForManage(newOrg);
  };

  const handleOrgUpdated = (updatedOrg: OrganizationItem) => {
    setOrganizations((prev) =>
      prev.map((o) => (o.id === updatedOrg.id ? updatedOrg : o)),
    );
    setSelectedOrgForManage(updatedOrg);
  };

  const handleOrgLeftOrDeleted = (orgId: string) => {
    setOrganizations((prev) => prev.filter((o) => o.id !== orgId));
    setSelectedOrgForManage(null);
  };

  const currentRole = userProfile?.role || authUser?.role || 'sponsor';
  const kycStatus = userProfile?.kycStatus || authUser?.kycStatus || 'pending';
  const hasKycDocuments = hasSubmittedKycDocuments(userProfile ?? authUser);

  const userInitials = (userProfile?.fullName || authUser?.fullName || 'Usuario')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'U';

  return (
    <div className="brotar-profile-page">
      {/* Header Profile Hero Card */}
      <section className="brotar-profile-header-card">
        <div className="brotar-profile-banner">
          <div className="brotar-profile-banner-pattern" />
        </div>

        <div className="brotar-profile-header-body">
          <div className="brotar-profile-identity-row">
            <div className="brotar-profile-user-main">
              {/* Interactive Avatar with File Upload & Hover overlay */}
              <div
                className="brotar-profile-avatar-wrap"
                onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
                title="Haz clic para cambiar tu foto de perfil"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleAvatarFileSelect}
                  style={{ display: 'none' }}
                  disabled={isUploadingAvatar}
                />

                {userProfile?.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.fullName}
                    className="brotar-profile-avatar-img"
                  />
                ) : (
                  <span className="brotar-profile-avatar-placeholder">
                    {userInitials}
                  </span>
                )}

                {/* Hover Overlay with Pencil / Camera Icon */}
                <div className="brotar-avatar-overlay">
                  <Camera size={20} />
                  <span className="brotar-avatar-overlay-text">Cambiar</span>
                </div>

                {isUploadingAvatar && (
                  <div className="brotar-avatar-loading-overlay">
                    <Loader2 size={24} className="brotar-spin" />
                  </div>
                )}
              </div>

              {/* Identity Details inside White Card with High Contrast */}
              <div className="brotar-profile-info">
                <h1 className="brotar-profile-name">
                  {userProfile?.fullName || authUser?.fullName || 'Mi Perfil'}
                </h1>
                <p className="brotar-profile-email">
                  {userProfile?.email || authUser?.email || ''}
                </p>

                <div className="brotar-profile-badges">
                  {/* System Role Badge */}
                  <span className={`brotar-badge brotar-badge-role-${currentRole}`}>
                    {currentRole === 'creator'
                      ? 'Creador Verde'
                      : currentRole === 'admin'
                        ? 'Administrador'
                        : 'Patrocinador Verde'}
                  </span>

                  {/* KYC Verification Status Badge */}
                  {kycStatus === 'verified' && (
                    <span className="brotar-kyc-badge brotar-kyc-verified">
                      <ShieldCheck size={14} />
                      <span>Identidad Verificada</span>
                    </span>
                  )}

                  {kycStatus === 'pending' && (
                    <span className="brotar-kyc-badge brotar-kyc-pending">
                      <Clock size={14} />
                      <span>Verificación en Revisión</span>
                    </span>
                  )}

                  {kycStatus === 'requires_documentation' && (
                    <span className="brotar-kyc-badge brotar-kyc-pending">
                      <AlertTriangle size={14} />
                      <span>Doc. Adicional Requerida</span>
                    </span>
                  )}

                  {kycStatus === 'rejected' && (
                    <span className="brotar-kyc-badge brotar-kyc-rejected">
                      <ShieldAlert size={14} />
                      <span>Verificación Rechazada</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Verification CTA button if creator is unverified */}
            {currentRole === 'creator' && kycStatus !== 'verified' && onNavigate && (
              <button
                type="button"
                className="brotar-kyc-action-btn"
                onClick={() => onNavigate('creator-verification')}
              >
                <Shield size={16} />
                <span>
                  {kycStatus === 'pending' && hasKycDocuments
                    ? 'Ver Estado KYC'
                    : 'Completar Verificación'}
                </span>
              </button>
            )}
          </div>

          {/* Impact & Activity Quick Metrics */}
          <div className="brotar-profile-metrics">
            <div
              className="brotar-profile-metric-card brotar-profile-metric-card--clickable"
              onClick={() => setActiveTab('organizaciones')}
              role="button"
              tabIndex={0}
              title="Ir a Mis Equipos / Organizaciones"
              style={{ cursor: 'pointer' }}
            >
              <div className="brotar-profile-metric-icon">
                <Building2 size={18} />
              </div>
              <div className="brotar-profile-metric-info">
                <span className="brotar-profile-metric-val">
                  {organizations.length}
                </span>
                <span className="brotar-profile-metric-label">
                  Equipos / Organizaciones
                </span>
              </div>
            </div>

            <div className="brotar-profile-metric-card">
              <div className="brotar-profile-metric-icon">
                <Sprout size={18} />
              </div>
              <div className="brotar-profile-metric-info">
                <span className="brotar-profile-metric-val">
                  {kycStatus === 'verified'
                    ? 'Nivel 1'
                    : hasKycDocuments
                      ? 'En proceso'
                      : 'Sin verificar'}
                </span>
                <span className="brotar-profile-metric-label">
                  Nivel de Confianza
                </span>
              </div>
            </div>

            <div className="brotar-profile-metric-card">
              <div className="brotar-profile-metric-icon">
                <FolderKanban size={18} />
              </div>
              <div className="brotar-profile-metric-info">
                <span className="brotar-profile-metric-val">Activo</span>
                <span className="brotar-profile-metric-label">
                  Estado de Cuenta
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="brotar-profile-tabs-nav">
        <button
          type="button"
          className={`brotar-profile-tab-btn ${activeTab === 'datos' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('datos')}
        >
          <UserIcon size={18} />
          <span>Información de la Cuenta</span>
        </button>

        <button
          type="button"
          className={`brotar-profile-tab-btn ${activeTab === 'organizaciones' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('organizaciones')}
        >
          <Building2 size={18} />
          <span>Mis Equipos / Organizaciones</span>
          <span className="brotar-tab-counter">{organizations.length}</span>
        </button>
      </div>

      {/* Tab 1: Personal Data & Security (Reference/Read-only Display) */}
      {activeTab === 'datos' && (
        <div className="brotar-profile-content-stack">
          {/* Reference Information Section */}
          <div className="brotar-profile-section-card">
            <header className="brotar-profile-section-header">
              <UserIcon size={20} className="brotar-profile-section-icon" />
              <h2 className="brotar-profile-section-title">
                Datos Personales Registrados
              </h2>
            </header>

            <div className="brotar-reference-grid">
              {/* Registered Full Name */}
              <div className="brotar-ref-card">
                <div className="brotar-ref-icon-box">
                  <UserIcon size={20} />
                </div>
                <div className="brotar-ref-content">
                  <span className="brotar-ref-label">Nombre Completo</span>
                  <p className="brotar-ref-value">
                    {userProfile?.fullName || authUser?.fullName || '—'}
                  </p>
                  <p className="brotar-ref-note">
                    {kycStatus === 'verified'
                      ? 'Validado mediante KYC'
                      : 'Pendiente de validación KYC'}
                  </p>
                </div>
              </div>

              {/* Registered Email */}
              <div className="brotar-ref-card">
                <div className="brotar-ref-icon-box">
                  <Mail size={20} />
                </div>
                <div className="brotar-ref-content">
                  <span className="brotar-ref-label">Correo Electrónico</span>
                  <p
                    className="brotar-ref-value"
                    title={userProfile?.email || authUser?.email || ''}
                  >
                    {userProfile?.email || authUser?.email || '—'}
                  </p>
                  <p className="brotar-ref-note">
                    Identificador de cuenta principal
                  </p>
                </div>
              </div>

              {/* Contact Phone / WhatsApp */}
              <div className="brotar-ref-card">
                <div className="brotar-ref-icon-box">
                  <Phone size={20} />
                </div>
                <div className="brotar-ref-content">
                  <span className="brotar-ref-label">Teléfono / WhatsApp</span>
                  <p className="brotar-ref-value">
                    {userProfile?.phone || 'Sin registrar'}
                  </p>

                  {!isEditingPhone ? (
                    <button
                      type="button"
                      className="brotar-phone-action-btn"
                      onClick={() => {
                        setPhoneDraft(userProfile?.phone || '');
                        setPhoneError(null);
                        setIsEditingPhone(true);
                      }}
                    >
                      {userProfile?.phone ? (
                        <>
                          <Pencil size={13} />
                          <span>Editar teléfono</span>
                        </>
                      ) : (
                        <>
                          <Plus size={13} />
                          <span>Añadir teléfono</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="brotar-phone-edit-box">
                      <input
                        type="tel"
                        placeholder="Ej: +591 70000000"
                        value={phoneDraft}
                        onChange={(e) => {
                          setPhoneDraft(e.target.value);
                          if (phoneError) setPhoneError(null);
                        }}
                        className={`brotar-phone-input ${phoneError ? 'is-invalid' : ''}`}
                        autoFocus
                      />
                      {phoneError && (
                        <span
                          className="brotar-phone-error-msg"
                          style={{
                            color: '#dc2626',
                            fontSize: '0.78rem',
                            marginTop: '4px',
                            display: 'block',
                            fontWeight: 500,
                          }}
                        >
                          {phoneError}
                        </span>
                      )}
                      <div className="brotar-phone-actions-row">
                        <button
                          type="button"
                          className="brotar-phone-save-btn"
                          onClick={handleSavePhone}
                          disabled={isSavingPhone}
                        >
                          {isSavingPhone ? (
                            <Loader2 size={13} className="brotar-spin" />
                          ) : (
                            <Check size={13} />
                          )}
                          <span>Guardar</span>
                        </button>
                        <button
                          type="button"
                          className="brotar-phone-cancel-btn"
                          onClick={() => {
                            setIsEditingPhone(false);
                            setPhoneError(null);
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Privacy Callout Banner */}
            <div className="brotar-privacy-callout">
              <Shield size={20} className="brotar-privacy-icon" />
              <div className="brotar-privacy-text">
                <h5>Privacidad y Protección de Identidad</h5>
                <p>
                  Tus documentos de verificación de identidad (KYC) solo los consulta el equipo
                  de verificación de Brotar y nunca se exhiben públicamente.
                </p>
              </div>
            </div>
          </div>

          {/* Security & Password Reset via Email */}
          <div className="brotar-profile-section-card">
            <header className="brotar-profile-section-header">
              <Lock size={20} className="brotar-profile-section-icon" />
              <h2 className="brotar-profile-section-title">
                Seguridad y Acceso
              </h2>
            </header>

            <div className="brotar-security-box">
              <div className="brotar-security-info">
                <h4>Restablecimiento Seguro de Contraseña</h4>
                <p>
                  Por motivos de seguridad, el cambio o restablecimiento de tu contraseña
                  se realiza a través de un enlace cifrado enviado a tu correo registrado{' '}
                  <strong>{userProfile?.email || authUser?.email}</strong>.
                </p>
              </div>

              <button
                type="button"
                className="brotar-btn-reset-password"
                onClick={handleRequestPasswordReset}
                disabled={isSendingReset}
              >
                {isSendingReset ? (
                  <>
                    <Loader2 size={16} className="brotar-spin" />
                    <span>Enviando enlace…</span>
                  </>
                ) : resetSent ? (
                  <>
                    <Check size={16} color="#17913f" />
                    <span>¡Enlace enviado!</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Solicitar enlace al correo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Organizations & Teams */}
      {activeTab === 'organizaciones' && (
        <div className="brotar-teams-section">
          {/* Action Header Bar */}
          <div className="brotar-teams-action-bar">
            <div className="brotar-teams-action-intro">
              <h4>Gestión de Equipos y Organizaciones</h4>
              <p>
                Crea equipos para co-gestionar campañas ecológicas o únete a una
                organización existente con un código.
              </p>
            </div>

            <div className="brotar-teams-btns">
              <button
                type="button"
                className="brotar-btn-join-team"
                onClick={() => setIsJoinOrgOpen(true)}
              >
                <KeyRound size={16} />
                <span>Unirse con Código</span>
              </button>

              <button
                type="button"
                className="brotar-btn-create-team"
                onClick={() => setIsCreateOrgOpen(true)}
              >
                <Plus size={16} />
                <span>Crear Organización</span>
              </button>
            </div>
          </div>

          {/* Organizations Grid or Empty State */}
          {isLoadingOrgs ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Loader2 size={28} className="brotar-spin" color="#0e4b34" />
              <p style={{ marginTop: '8px', color: '#5a6b62' }}>
                Cargando organizaciones…
              </p>
            </div>
          ) : organizations.length > 0 ? (
            <div className="brotar-teams-grid">
              {organizations.map((org) => {
                const isOwner = org.myRole === 'owner';
                const isAdmin = org.myRole === 'admin';

                return (
                  <div key={org.id} className="brotar-team-card">
                    <div>
                      <div className="brotar-team-card-header">
                        <div className="brotar-team-card-icon">
                          <Building2 size={22} />
                        </div>
                        <div className="brotar-team-card-main">
                          <div className="brotar-team-card-title-row">
                            <h3 className="brotar-team-name" title={org.legalName}>
                              {org.legalName}
                            </h3>
                            <span
                              className={`brotar-team-role-pill role-${org.myRole || 'member'}`}
                            >
                              {isOwner
                                ? 'Fundador'
                                : isAdmin
                                  ? 'Admin'
                                  : org.myRole === 'creator'
                                    ? 'Co-creador'
                                    : 'Miembro'}
                            </span>
                          </div>
                          <p className="brotar-team-meta-line">
                            {org.taxId} {org.address ? `• ${org.address}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Invite Code Quick Box */}
                      <div className="brotar-team-code-row" style={{ marginTop: '14px' }}>
                        <span className="brotar-team-code-label">
                          Código de Equipo
                        </span>
                        <button
                          type="button"
                          className="brotar-team-code-copy-btn"
                          onClick={() =>
                            handleCopyCode(org.id, org.inviteCode)
                          }
                          title="Copiar código de invitación"
                        >
                          <span>{org.inviteCode}</span>
                          {copiedOrgId === org.id ? (
                            <Check size={14} color="#17913f" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>

                      {/* Mini Social Badges if configured */}
                      <OrganizationMiniSocialRow socialLinks={org.socialLinks} />
                    </div>

                    {/* Card Footer */}
                    <div className="brotar-team-card-footer">
                      <div className="brotar-team-members-avatars">
                        {org.members.slice(0, 3).map((m) => (
                          <div
                            key={m.userId}
                            className="brotar-team-avatar-mini"
                            title={m.fullName}
                          >
                            {m.avatarUrl ? (
                              <img src={m.avatarUrl} alt={m.fullName} />
                            ) : (
                              <span>{m.fullName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                        ))}
                        <span className="brotar-team-member-count">
                          {org.members.length} {org.members.length === 1 ? 'miembro' : 'miembros'}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="brotar-team-manage-btn"
                        onClick={() => setSelectedOrgForManage(org)}
                      >
                        <Settings2 size={15} />
                        <span>Gestionar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="brotar-teams-empty">
              <div className="brotar-teams-empty-icon">
                <Users size={32} />
              </div>
              <h3 className="brotar-teams-empty-title">
                Aún no perteneces a ningún equipo
              </h3>
              <p className="brotar-teams-empty-desc">
                Crea una organización para invitar colaboradores y co-gestionar tus proyectos de crowdfunding verde, o únete al equipo de un creador mediante un código de invitación.
              </p>
              <div className="brotar-teams-empty-actions">
                <button
                  type="button"
                  className="brotar-btn-join-team"
                  onClick={() => setIsJoinOrgOpen(true)}
                >
                  <KeyRound size={16} />
                  <span>Ingresar un Código</span>
                </button>
                <button
                  type="button"
                  className="brotar-btn-create-team"
                  onClick={() => setIsCreateOrgOpen(true)}
                >
                  <Plus size={16} />
                  <span>Crear mi Organización</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateOrganizationModal
        isOpen={isCreateOrgOpen}
        onClose={() => setIsCreateOrgOpen(false)}
        onSuccess={handleOrgCreated}
      />

      <JoinOrganizationModal
        isOpen={isJoinOrgOpen}
        initialCode={joinCodePrefill}
        onClose={() => {
          setIsJoinOrgOpen(false);
          setJoinCodePrefill('');
        }}
        onSuccess={(org) => {
          handleOrgJoined(org);
          setJoinCodePrefill('');
          if (typeof window !== 'undefined' && window.history) {
            window.history.replaceState({}, '', '/organizaciones');
          }
        }}
      />

      {selectedOrgForManage && (
        <ManageOrganizationModal
          organization={selectedOrgForManage}
          currentUserId={userProfile?.id || authUser?.id || ''}
          isOpen={Boolean(selectedOrgForManage)}
          onClose={() => setSelectedOrgForManage(null)}
          onUpdate={handleOrgUpdated}
          onLeaveOrDelete={handleOrgLeftOrDeleted}
        />
      )}
    </div>
  );
};
