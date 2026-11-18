import type { FC } from 'react';
import { useState } from 'react';
import {
  Sprout,
  Building2,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  UserPlus,
  Check,
  ArrowRight,
  ArrowLeft,
  MailCheck,
} from 'lucide-react';
import { usersApi, type UserDto, type CreateUserPayload } from '../../../shared/api/usersApi.ts';
import { generateTemporaryPassword } from '../../../shared/utils/passwordGenerator.ts';
import { ImageUploader } from '../../../shared/components/ui/ImageUploader/ImageUploader.tsx';
import { PhoneInputWithCountry } from '../../../shared/components/ui/PhoneInput/PhoneInputWithCountry.tsx';
import { DocumentInput } from '../../../shared/components/ui/DocumentInput/DocumentInput.tsx';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';
import { normalizeFullName, validateFullName } from '../../auth/utils/validateAuthFields.ts';

export interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newUser: UserDto) => void;
}

export const CreateUserModal: FC<CreateUserModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState<'sponsor' | 'creator' | 'admin'>('sponsor');
  const [fullName, setFullName] = useState<string>('');
  const [organizationName, setOrganizationName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [temporaryPassword] = useState<string>(() => generateTemporaryPassword());
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('CI');
  const [documentId, setDocumentId] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [kycStatus, setKycStatus] = useState<'pending' | 'verified'>('pending');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setCurrentStep(1);
    setRole('sponsor');
    setFullName('');
    setOrganizationName('');
    setEmail('');
    setAvatarUrl('');
    setDocumentType('CI');
    setDocumentId('');
    setPhone('');
    setKycStatus('pending');
    setErrorMessage(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateStep1 = (): boolean => {
    const fullNameError = validateFullName(fullName);
    if (fullNameError) {
      setErrorMessage(`${fullNameError}.`);
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Ingresa un correo electrónico válido.');
      return false;
    }
    if (role === 'creator' && !organizationName.trim()) {
      setErrorMessage('Ingresa el nombre de la organización o proyecto.');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setErrorMessage(null);
      setCurrentStep(3);
    }
  };

  const handlePrev = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentStep < 3) {
        handleNext();
      }
    }
  };

  const handleCreateUser = async () => {
    if (currentStep !== 3) return;
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const payload: CreateUserPayload = {
        fullName: normalizeFullName(fullName),
        email: email.trim().toLowerCase(),
        password: temporaryPassword,
        role,
        avatarUrl: avatarUrl.trim() || undefined,
        documentType,
        documentId: documentId.trim() || undefined,
        organizationName: role === 'creator' || organizationName ? organizationName.trim() : undefined,
        phone: phone.trim() || undefined,
        kycStatus,
      };

      const newUser = await usersApi.createUser(payload);
      resetForm();
      onSuccess(newUser);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err, 'Error al registrar el usuario.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="kyc-modal-overlay" onClick={handleClose}>
      <div className="kyc-modal-card wizard-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="wizard-modal-header">
          <div className="wizard-header-title-row">
            <h2 className="modal-title-bold">Crear Usuario</h2>
            <button type="button" className="kyc-modal-close-btn" onClick={handleClose} title="Cerrar (Esc)">
              <X size={18} />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="modal-stepper-bar">
            <button
              type="button"
              className={`step-indicator-item ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
              onClick={() => setCurrentStep(1)}
            >
              <span className="step-num-bubble">
                {currentStep > 1 ? <Check size={12} strokeWidth={3} /> : '1'}
              </span>
              <span className="step-text-label">Cuenta</span>
            </button>

            <div className={`step-connector-line ${currentStep > 1 ? 'active' : ''}`} />

            <button
              type="button"
              className={`step-indicator-item ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
              onClick={() => {
                if (validateStep1()) setCurrentStep(2);
              }}
            >
              <span className="step-num-bubble">
                {currentStep > 2 ? <Check size={12} strokeWidth={3} /> : '2'}
              </span>
              <span className="step-text-label">Identidad</span>
            </button>

            <div className={`step-connector-line ${currentStep > 2 ? 'active' : ''}`} />

            <button
              type="button"
              className={`step-indicator-item ${currentStep === 3 ? 'active' : ''}`}
              onClick={() => {
                if (validateStep1()) setCurrentStep(3);
              }}
            >
              <span className="step-num-bubble">3</span>
              <span className="step-text-label">Seguridad</span>
            </button>
          </div>
        </div>

        {/* Wizard Body Form */}
        <div onKeyDown={handleKeyDown} className="wizard-modal-form">
          {errorMessage && (
            <div className="form-error-banner">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: ROL Y DATOS BÁSICOS */}
          {currentStep === 1 && (
            <div className="wizard-step-content animate-step">
              <div className="form-group">
                <label className="form-label">Rol del Usuario</label>
                <div className="role-mini-tabs">
                  <button
                    type="button"
                    className={`role-mini-tab ${role === 'sponsor' ? 'active' : ''}`}
                    onClick={() => {
                      setRole('sponsor');
                      setDocumentType('CI');
                    }}
                  >
                    <Sprout size={16} />
                    <span>Sponsor</span>
                  </button>

                  <button
                    type="button"
                    className={`role-mini-tab ${role === 'creator' ? 'active' : ''}`}
                    onClick={() => {
                      setRole('creator');
                      setDocumentType('NIT');
                    }}
                  >
                    <Building2 size={16} />
                    <span>Creador ONG</span>
                  </button>

                  <button
                    type="button"
                    className={`role-mini-tab ${role === 'admin' ? 'active' : ''}`}
                    onClick={() => setRole('admin')}
                  >
                    <Shield size={16} />
                    <span>Admin</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Ana Flores Mamani"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="usuario@brotar.bo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {role === 'creator' && (
                <div className="form-group">
                  <label className="form-label">Organización / Entidad</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Fundación EcoHumedal Bolivia"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: IDENTIDAD Y CONTACTO */}
          {currentStep === 2 && (
            <div className="wizard-step-content animate-step">
              <div className="form-group">
                <DocumentInput
                  documentType={documentType}
                  onDocumentTypeChange={setDocumentType}
                  documentId={documentId}
                  onDocumentIdChange={setDocumentId}
                  label="Documento de Identificación"
                />
              </div>

              <div className="form-group">
                <PhoneInputWithCountry
                  label="Teléfono Móvil"
                  value={phone}
                  onChange={setPhone}
                  placeholder="71234567"
                />
              </div>

              <div className="form-group">
                <ImageUploader
                  label="Foto de Perfil (Opcional)"
                  value={avatarUrl}
                  onChange={(imgUrl) => setAvatarUrl(imgUrl || '')}
                  maxSizeMb={4}
                />
              </div>
            </div>
          )}

          {/* STEP 3: SEGURIDAD Y ESTADO INICIAL */}
          {currentStep === 3 && (
            <div className="wizard-step-content animate-step">
              {/* Summary Card */}
              <div className="step-summary-pill-card">
                <div className="summary-avatar-circle">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="summary-avatar-img" />
                  ) : (
                    <span>{(fullName || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="summary-info-col">
                  <span className="summary-name">{fullName || 'Nuevo Usuario'}</span>
                  <span className="summary-sub">{email} • Rol: {role}</span>
                </div>
              </div>

              {/* Security & Access Delivery Notice */}
              <div className="security-delivery-notice">
                <div className="security-notice-icon-box">
                  <MailCheck size={20} />
                </div>
                <div className="security-notice-text">
                  <span className="security-notice-title">Acceso y Credenciales</span>
                  <p className="security-notice-desc">
                    Se generará una clave temporal segura en el sistema para ser notificada al correo del usuario en su primer inicio de sesión.
                  </p>
                </div>
              </div>

              {/* Initial KYC State */}
              <div className="form-group">
                <label className="form-label">Estado Inicial KYC</label>
                <div className="kyc-state-options clean-radio-row">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="kycStatus"
                      value="pending"
                      checked={kycStatus === 'pending'}
                      onChange={() => setKycStatus('pending')}
                    />
                    <Clock size={15} className="radio-icon text-amber" />
                    <span>Pendiente</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="kycStatus"
                      value="verified"
                      checked={kycStatus === 'verified'}
                      onChange={() => setKycStatus('verified')}
                    />
                    <CheckCircle2 size={15} className="radio-icon text-emerald" />
                    <span>Verificado Directo</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Navigation Footer */}
          <div className="wizard-modal-footer">
            {currentStep > 1 ? (
              <button
                type="button"
                className="action-btn secondary btn-prev-step"
                onClick={handlePrev}
                disabled={isSubmitting}
              >
                <ArrowLeft size={16} />
                <span>Atrás</span>
              </button>
            ) : (
              <button
                type="button"
                className="action-btn secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                className="action-btn primary btn-next-step"
                onClick={handleNext}
              >
                <span>Continuar</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="action-btn primary btn-submit-create"
                onClick={handleCreateUser}
                disabled={isSubmitting}
              >
                <UserPlus size={16} />
                <span>{isSubmitting ? 'Creando...' : 'Crear Usuario'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
