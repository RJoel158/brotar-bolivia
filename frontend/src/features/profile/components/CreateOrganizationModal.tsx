import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import { X, Building2, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { organizationsApi, type OrganizationItem } from '../../../shared/api/organizationsApi.ts';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';
import { useToast } from '../../../shared/context/ToastContext.tsx';
import './CreateOrganizationModal.css';

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (org: OrganizationItem) => void;
}

const SENSITIVE_WORDS = [
  'pene', 'vagina', 'verga', 'puta', 'puto', 'mierda', 'carajo', 'coño', 'polla',
  'chota', 'culo', 'culiao', 'pendejo', 'pendeja', 'tetas', 'teta', 'chingar',
  'concha', 'maricon', 'zorra', 'bastardo', 'dick', 'cock', 'pussy', 'bitch', 'asshole',
];

function hasSensitiveWords(text: string): boolean {
  if (!text) return false;
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(Boolean);
  return words.some((w) => SENSITIVE_WORDS.includes(w));
}

export const CreateOrganizationModal: FC<CreateOrganizationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [legalName, setLegalName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [address, setAddress] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    legalName?: string;
    taxId?: string;
    address?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: { legalName?: string; taxId?: string; address?: string } = {};

    const cleanName = legalName.trim();
    if (!cleanName) {
      errors.legalName = 'El nombre de la organización o equipo es obligatorio.';
    } else if (cleanName.length < 3) {
      errors.legalName = 'El nombre debe tener al menos 3 caracteres.';
    } else if (cleanName.length > 150) {
      errors.legalName = 'El nombre no puede superar los 150 caracteres.';
    } else if (hasSensitiveWords(cleanName)) {
      errors.legalName = 'El nombre de la organización contiene lenguaje sensible o no apropiado.';
    }

    const cleanTaxId = taxId.trim();
    if (cleanTaxId) {
      if (cleanTaxId.length < 5 || cleanTaxId.length > 30) {
        errors.taxId = 'El NIT / identificador fiscal debe tener entre 5 y 30 caracteres.';
      } else if (!/^[A-Za-z0-9\-._]+$/.test(cleanTaxId)) {
        errors.taxId = 'Solo se admiten números, letras y guiones (ej. NIT-102938475).';
      }
    }

    const cleanAddress = address.trim();
    if (cleanAddress && cleanAddress.length > 200) {
      errors.address = 'La ubicación no puede exceder los 200 caracteres.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await organizationsApi.createOrganization({
        legalName: legalName.trim(),
        taxId: taxId.trim() || undefined,
        address: address.trim() || undefined,
      });

      toast.success(
        `Organización "${created.legalName}" creada exitosamente.`,
        'Equipo Creado',
      );

      onSuccess(created);
      onClose();
    } catch (err) {
      const msg = getApiErrorMessage(err, 'No se pudo crear la organización');
      setError(msg);
      toast.error(msg, 'Error al crear');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="brotar-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="brotar-modal-card">
        <header className="brotar-modal-header">
          <div className="brotar-modal-title-wrap">
            <div className="brotar-modal-icon-badge">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="brotar-modal-title">Crear Organización / Equipo</h3>
              <p className="brotar-modal-subtitle">
                Agrupa a creadores y colaboradores para gestionar proyectos e impacto verde.
              </p>
            </div>
          </div>
          <button type="button" className="brotar-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        {error && (
          <div className="brotar-modal-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="brotar-modal-form">
          <div className="brotar-form-group">
            <label htmlFor="orgLegalName" className="brotar-form-label">
              Nombre de la Organización o Equipo *
            </label>
            <input
              id="orgLegalName"
              type="text"
              placeholder="Ej: Fundación EcoAndes, Cooperativa Solar..."
              value={legalName}
              onChange={(e) => {
                setLegalName(e.target.value);
                if (fieldErrors.legalName) setFieldErrors((prev) => ({ ...prev, legalName: undefined }));
              }}
              className={`brotar-form-input ${fieldErrors.legalName ? 'is-invalid' : ''}`}
            />
            {fieldErrors.legalName && (
              <span className="brotar-field-error-msg" style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                {fieldErrors.legalName}
              </span>
            )}
          </div>

          <div className="brotar-form-group">
            <label htmlFor="orgTaxId" className="brotar-form-label">
              NIT / RUT / Identificador Fiscal (Opcional)
            </label>
            <input
              id="orgTaxId"
              type="text"
              placeholder="Ej: NIT-102938475"
              value={taxId}
              onChange={(e) => {
                setTaxId(e.target.value);
                if (fieldErrors.taxId) setFieldErrors((prev) => ({ ...prev, taxId: undefined }));
              }}
              className={`brotar-form-input ${fieldErrors.taxId ? 'is-invalid' : ''}`}
            />
            {fieldErrors.taxId ? (
              <span className="brotar-field-error-msg" style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                {fieldErrors.taxId}
              </span>
            ) : (
              <span className="brotar-form-help">Si no tienes uno, generaremos un código único automáticamente.</span>
            )}
          </div>

          <div className="brotar-form-group">
            <label htmlFor="orgAddress" className="brotar-form-label">
              Ubicación o Sede (Opcional)
            </label>
            <input
              id="orgAddress"
              type="text"
              placeholder="Ej: Cochabamba, Bolivia"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: undefined }));
              }}
              className={`brotar-form-input ${fieldErrors.address ? 'is-invalid' : ''}`}
            />
            {fieldErrors.address && (
              <span className="brotar-field-error-msg" style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                {fieldErrors.address}
              </span>
            )}
          </div>

          <footer className="brotar-modal-footer">
            <button
              type="button"
              className="brotar-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="brotar-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="brotar-spin" />
                  <span>Creando equipo…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Crear Organización</span>
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
