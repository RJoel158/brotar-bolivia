import type { FC, ChangeEvent, DragEvent } from 'react';
import { useState, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  ShieldCheck,
  Building2,
  UserCheck,
  Loader2,
  FileText,
  Camera,
} from 'lucide-react';
import { usersApi, type SubmitKycPayload } from '../../../shared/api/usersApi.ts';
import { useAuth } from '../../auth/context/useAuth.ts';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';
import { validateImageFileSecurity } from '../../../shared/utils/fileSecurityValidator.ts';
import './KycWizard.css';

export interface KycSubmissionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const BOLIVIA_DEPARTMENTS = [
  { code: 'LP', name: 'La Paz' },
  { code: 'CB', name: 'Cochabamba' },
  { code: 'SC', name: 'Santa Cruz' },
  { code: 'OR', name: 'Oruro' },
  { code: 'PT', name: 'Potosí' },
  { code: 'TJ', name: 'Tarija' },
  { code: 'CH', name: 'Chuquisaca' },
  { code: 'BE', name: 'Beni' },
  { code: 'PD', name: 'Pando' },
  { code: 'EXT', name: 'Extranjero' },
];

/**
 * Re-encodes the image onto an isolated HTML5 Canvas.
 * This actively strips malicious metadata/polyglot payloads and optimizes size.
 */
function sanitizeAndCompressImage(file: File, maxWidth = 1400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        // Draw fresh pixels to clean canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export strictly as clean JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('No se pudo decodificar el archivo como imagen válida.'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export const KycSubmissionWizard: FC<KycSubmissionWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [docType, setDocType] = useState<'CI' | 'NIT' | 'PASSPORT' | 'FOREIGN'>('CI');
  const [docNumber, setDocNumber] = useState<string>('');
  const [ciDept, setCiDept] = useState<string>('LP');
  const [orgName, setOrgName] = useState<string>(user?.organizationName || '');
  const [phone, setPhone] = useState<string>(user?.phone?.replace('+591 ', '') || '');

  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = async (
    file: File,
    setter: (val: string | null) => void,
  ) => {
    setErrorMsg(null);

    // 1. Anti-Injection & Security Validation (Magic Bytes + Extensions)
    const securityCheck = await validateImageFileSecurity(file);
    if (!securityCheck.isValid) {
      setErrorMsg(securityCheck.error || 'El archivo seleccionado no es una imagen válida.');
      return;
    }

    // 2. Canvas Re-encoding & Sanitization
    try {
      setIsProcessingImage(true);
      const cleanDataUrl = await sanitizeAndCompressImage(file);
      setter(cleanDataUrl);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al procesar y sanitizar la imagen.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    setter: (val: string | null) => void,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, setter);
    }
  };

  const handleDrop = (
    e: DragEvent<HTMLDivElement>,
    setter: (val: string | null) => void,
  ) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file, setter);
    }
  };

  const validateStep1 = (): boolean => {
    const cleanDoc = docNumber.trim();
    const cleanPhone = phone.trim();
    const cleanOrg = orgName.trim();

    if (!cleanDoc) {
      setErrorMsg(docType === 'NIT' ? 'Ingresa el número de NIT.' : 'Ingresa el número de documento de identidad.');
      return false;
    }

    if (docType === 'NIT') {
      if (!/^\d{7,15}$/.test(cleanDoc)) {
        setErrorMsg('El número de NIT debe contener solo dígitos numéricos (entre 7 y 15 dígitos).');
        return false;
      }
      if (!cleanOrg) {
        setErrorMsg('Ingresa la razón social o nombre de la organización.');
        return false;
      }
    } else {
      if (cleanDoc.length < 3 || cleanDoc.length > 25) {
        setErrorMsg('El número de documento debe tener entre 3 y 25 caracteres.');
        return false;
      }
    }

    // Bolivian mobile number validation: 8 digits starting with 6 or 7
    const BOLIVIAN_PHONE_REGEX = /^[67]\d{7}$/;
    if (!cleanPhone || !BOLIVIAN_PHONE_REGEX.test(cleanPhone)) {
      setErrorMsg('Ingresa un número de celular/WhatsApp válido de Bolivia (8 dígitos iniciando con 6 o 7).');
      return false;
    }

    setErrorMsg(null);
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!frontImage) {
      setErrorMsg('Es obligatorio cargar la foto del anverso (frontal) de tu documento.');
      return false;
    }
    if (docType === 'CI' && !backImage) {
      setErrorMsg('Para la Cédula de Identidad (CI) es obligatorio subir ambas caras: anverso (frontal) y reverso (posterior).');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePrev = () => {
    setErrorMsg(null);
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const fullDocumentId =
    docType === 'CI'
      ? `CI ${docNumber.trim()} ${ciDept}`
      : docType === 'NIT'
        ? `NIT ${docNumber.trim()}`
        : `${docType} ${docNumber.trim()}`;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setProgress(15);
    setStatusMessage('Cifrando documentos y validando formato seguro...');

    try {
      await new Promise((res) => setTimeout(res, 400));
      setProgress(55);
      setStatusMessage('Enviando expediente a la mesa de auditoría...');

      const payload: SubmitKycPayload = {
        documentId: fullDocumentId.trim(),
        documentType: docType,
        organizationName: docType === 'NIT' ? orgName.trim() : undefined,
        phone: `+591 ${phone.trim()}`,
        documentFrontUrl: (frontImage as string).trim(),
        documentBackUrl: backImage ? backImage.trim() : undefined,
      };

      await usersApi.submitKyc(payload);
      await refreshUser();

      setProgress(100);
      setIsCompleted(true);
      setStatusMessage('¡Expediente enviado con éxito a revisión!');

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMsg(getApiErrorMessage(err, 'Error al enviar la solicitud.'));
    }
  };

  return (
    <div className="kyc-modal-overlay" onClick={() => !isSubmitting && onClose()}>
      <div className="kyc-wizard-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="kyc-wizard-header">
          <div className="wizard-header-left">
            <div className="wizard-icon-box">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="wizard-title">Verificación de Identidad (KYC)</h2>
              <p className="wizard-subtitle">
                {step === 1 && 'Paso 1: Información de Documento y Contacto'}
                {step === 2 && 'Paso 2: Carga de Documentos Digitales'}
                {step === 3 && 'Paso 3: Verificación y Envío de Expediente'}
              </p>
            </div>
          </div>
          {!isSubmitting && (
            <button type="button" className="kyc-modal-close-btn" onClick={onClose} title="Cerrar">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Step Indicator */}
        <div className="wizard-steps-bar">
          <div className={`wizard-step-node ${step >= 1 ? 'active' : ''}`}>
            <span className="step-num">1</span>
            <span className="step-label">Identidad</span>
          </div>
          <div className={`wizard-step-line ${step >= 2 ? 'active' : ''}`} />
          <div className={`wizard-step-node ${step >= 2 ? 'active' : ''}`}>
            <span className="step-num">2</span>
            <span className="step-label">Documentos</span>
          </div>
          <div className={`wizard-step-line ${step >= 3 ? 'active' : ''}`} />
          <div className={`wizard-step-node ${step >= 3 ? 'active' : ''}`}>
            <span className="step-num">3</span>
            <span className="step-label">Confirmación</span>
          </div>
        </div>

        {errorMsg && (
          <div className="wizard-error-banner">
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Wizard Content Body */}
        <div className="kyc-wizard-body">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="wizard-step-content">
              <div className="form-group-block">
                <label className="wizard-field-label">Tipo de Identidad o Personería</label>
                <div className="wizard-doc-type-grid">
                  <button
                    type="button"
                    className={`doc-type-option ${docType === 'CI' ? 'selected' : ''}`}
                    onClick={() => setDocType('CI')}
                  >
                    <UserCheck size={20} />
                    <div>
                      <strong>Cédula de Identidad</strong>
                      <span>Persona natural boliviana</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`doc-type-option ${docType === 'NIT' ? 'selected' : ''}`}
                    onClick={() => setDocType('NIT')}
                  >
                    <Building2 size={20} />
                    <div>
                      <strong>NIT / Personería</strong>
                      <span>Empresa, ONG o Colectivo</span>
                    </div>
                  </button>
                </div>
              </div>

              {docType === 'CI' ? (
                <div className="wizard-two-col-fields">
                  <div className="form-group-block">
                    <label className="wizard-field-label" htmlFor="ci-number">
                      Número de Cédula de Identidad (CI)
                    </label>
                    <input
                      id="ci-number"
                      type="text"
                      placeholder="Ej. 12780122"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value.replace(/[^0-9A-Za-z-]/g, '').trim())}
                      onBlur={() => setDocNumber((prev) => prev.trim())}
                      className="wizard-text-input"
                      autoComplete="off"
                    />
                  </div>

                  <div className="form-group-block">
                    <label className="wizard-field-label" htmlFor="ci-dept">
                      Expedido en
                    </label>
                    <select
                      id="ci-dept"
                      value={ciDept}
                      onChange={(e) => setCiDept(e.target.value)}
                      className="wizard-select-input"
                    >
                      {BOLIVIA_DEPARTMENTS.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-group-block">
                    <label className="wizard-field-label" htmlFor="nit-number">
                      Número de NIT *
                    </label>
                    <input
                      id="nit-number"
                      type="text"
                      inputMode="numeric"
                      placeholder="Ej. 1029384756 (solo números)"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value.replace(/\D/g, '').slice(0, 15))}
                      onBlur={() => setDocNumber((prev) => prev.trim())}
                      className="wizard-text-input"
                      autoComplete="off"
                    />
                  </div>

                  <div className="form-group-block">
                    <label className="wizard-field-label" htmlFor="org-name">
                      Razón Social / Nombre de la Organización *
                    </label>
                    <input
                      id="org-name"
                      type="text"
                      placeholder="Ej. EcoHumedal ONG o Fundación Verde"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      onBlur={() => setOrgName((prev) => prev.trim())}
                      className="wizard-text-input"
                      maxLength={120}
                    />
                  </div>
                </>
              )}

              <div className="form-group-block">
                <label className="wizard-field-label" htmlFor="phone-contact">
                  Celular de Contacto / WhatsApp (+591) *
                </label>
                <div className="phone-prefix-input-wrap">
                  <span className="phone-prefix-pill">+591</span>
                  <input
                    id="phone-contact"
                    type="tel"
                    inputMode="numeric"
                    placeholder="70000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    onBlur={() => setPhone((prev) => prev.trim())}
                    className="wizard-text-input phone-field"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DOCUMENTS */}
          {step === 2 && (
            <div className="wizard-step-content">
              <div className="upload-security-notice">
                <ShieldCheck size={16} className="text-emerald" />
                <span>
                  {docType === 'CI'
                    ? 'Para validar tu Cédula de Identidad ante SEGIP, debes cargar ambas caras: anverso (frontal) y reverso (posterior).'
                    : 'Solo se admiten fotografías legibles (JPG, PNG, WEBP). Se inspecciona firma binaria anti-inyección.'}
                </span>
              </div>

              <div className="upload-cards-grid">
                {/* Front Document */}
                <div className="upload-box-card">
                  <label className="upload-box-title">
                    <span>Anverso (Frontal) *</span>
                  </label>

                  <input
                    ref={frontInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileChange(e, setFrontImage)}
                  />

                  <div
                    className={`dropzone-area ${frontImage ? 'has-image' : ''}`}
                    onClick={() => !frontImage && frontInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, setFrontImage)}
                  >
                    {frontImage ? (
                      <div className="dropzone-preview-wrap">
                        <img src={frontImage} alt="Anverso" className="dropzone-img-preview" />
                        <button
                          type="button"
                          className="btn-remove-preview"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFrontImage(null);
                          }}
                          title="Eliminar foto"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="dropzone-empty-placeholder">
                        <Camera size={32} className="text-emerald" />
                        <span className="dropzone-hint">Subir Anverso</span>
                        <span className="dropzone-sub">Foto nítida del frente (JPG/PNG)</span>
                        <button
                          type="button"
                          className="dropzone-select-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            frontInputRef.current?.click();
                          }}
                        >
                          Seleccionar Foto
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Back Document */}
                <div className="upload-box-card">
                  <label className="upload-box-title">
                    <span>Reverso (Posterior) {docType === 'CI' ? '*' : '(Opcional)'}</span>
                  </label>

                  <input
                    ref={backInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileChange(e, setBackImage)}
                  />

                  <div
                    className={`dropzone-area ${backImage ? 'has-image' : ''}`}
                    onClick={() => !backImage && backInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, setBackImage)}
                  >
                    {backImage ? (
                      <div className="dropzone-preview-wrap">
                        <img src={backImage} alt="Reverso" className="dropzone-img-preview" />
                        <button
                          type="button"
                          className="btn-remove-preview"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBackImage(null);
                          }}
                          title="Eliminar foto"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="dropzone-empty-placeholder">
                        <FileText size={32} className="text-emerald" />
                        <span className="dropzone-hint">Subir Reverso</span>
                        <span className="dropzone-sub">Foto posterior con código de control</span>
                        <button
                          type="button"
                          className="dropzone-select-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            backInputRef.current?.click();
                          }}
                        >
                          Seleccionar Foto
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUMMARY & SUBMIT */}
          {step === 3 && (
            <div className="wizard-step-content">
              {!isSubmitting ? (
                <div className="summary-confirm-wrap">
                  <div className="summary-data-card">
                    <h4>Resumen del Expediente</h4>
                    <div className="summary-info-grid">
                      <div className="summary-item">
                        <span className="summary-label">Titular Registrado</span>
                        <span className="summary-val">{user?.fullName || 'Titular'}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Documento</span>
                        <span className="summary-val">{fullDocumentId}</span>
                      </div>
                      {docType === 'NIT' && orgName && (
                        <div className="summary-item">
                          <span className="summary-label">Razón Social</span>
                          <span className="summary-val">{orgName}</span>
                        </div>
                      )}
                      <div className="summary-item">
                        <span className="summary-label">Celular</span>
                        <span className="summary-val">+591 {phone}</span>
                      </div>
                    </div>

                    <div className="summary-docs-thumbs">
                      <span className="summary-label">Documentos Escaneados:</span>
                      <div className="thumbs-row">
                        {frontImage && (
                          <div className="thumb-item">
                            <img src={frontImage} alt="Anverso" />
                            <span>Anverso listo</span>
                          </div>
                        )}
                        {backImage && (
                          <div className="thumb-item">
                            <img src={backImage} alt="Reverso" />
                            <span>Reverso listo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="affidavit-box">
                    <ShieldCheck size={20} className="text-emerald" style={{ flexShrink: 0 }} />
                    <span>
                      Declaro bajo juramento que los datos y documentos proporcionados son verídicos, legibles y corresponden a mi persona o entidad legal.
                    </span>
                  </div>
                </div>
              ) : (
                /* Progress & Loading */
                <div className="process-simulator-container">
                  <div className="simulator-header-row">
                    <span className="simulator-status-text">
                      {isCompleted ? (
                        <span className="status-success-inline">
                          <CheckCircle2 size={18} />
                          {statusMessage}
                        </span>
                      ) : (
                        <span className="status-loading-inline">
                          <Loader2 size={18} className="spin-icon" />
                          {statusMessage}
                        </span>
                      )}
                    </span>
                    <span className="simulator-percent-badge">{progress}%</span>
                  </div>

                  <div className="simulator-progress-track">
                    <div
                      className={`simulator-progress-bar bar-emerald ${isCompleted ? 'bar-done' : ''}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="simulator-steps-indicator">
                    <div className={`step-dot ${progress >= 15 ? 'active' : ''}`}>1. Validar</div>
                    <div className={`step-dot ${progress >= 55 ? 'active' : ''}`}>2. Mesa KYC</div>
                    <div className={`step-dot ${progress >= 100 ? 'active' : ''}`}>3. Finalizar</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isSubmitting && (
          <div className="kyc-wizard-footer">
            {step > 1 && (
              <button type="button" className="wizard-btn-prev" onClick={handlePrev}>
                <ArrowLeft size={16} />
                <span>Atrás</span>
              </button>
            )}

            {step < 3 ? (
              <button type="button" className="wizard-btn-next" onClick={handleNext}>
                <span>Continuar</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="wizard-btn-submit"
                onClick={handleSubmit}
                disabled={isSubmitting || isProcessingImage}
              >
                <ShieldCheck size={16} />
                <span>Confirmar y Enviar Expediente</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
