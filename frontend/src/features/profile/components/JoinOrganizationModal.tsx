import type { FC, FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { X, KeyRound, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { organizationsApi, type OrganizationItem } from '../../../shared/api/organizationsApi.ts';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';
import { useToast } from '../../../shared/context/ToastContext.tsx';
import './JoinOrganizationModal.css';

interface JoinOrganizationModalProps {
  isOpen: boolean;
  initialCode?: string;
  onClose: () => void;
  onSuccess: (org: OrganizationItem) => void;
}

export const JoinOrganizationModal: FC<JoinOrganizationModalProps> = ({
  isOpen,
  initialCode = '',
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState(initialCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!code.trim()) {
      setError('Ingresa el código de invitación');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const joined = await organizationsApi.joinByCode(code.trim());
      
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

      onSuccess(joined);
      onClose();
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Código inválido o equipo no encontrado');
      setError(msg);
      toast.error(msg, 'Error al unirse');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          // If it's a URL like /unirse?codigo=XXX, extract code
          const match = text.match(/codigo=([^&]+)/i);
          if (match) {
            setCode(match[1]);
          } else {
            setCode(text.trim().toUpperCase());
          }
        }
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="brotar-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="brotar-modal-card">
        <header className="brotar-modal-header">
          <div className="brotar-modal-title-wrap">
            <div className="brotar-modal-icon-badge">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="brotar-modal-title">Unirse a un Equipo</h3>
              <p className="brotar-modal-subtitle">
                Ingresa el código de acceso proporcionado por el fundador o administrador.
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
            <div className="brotar-form-label-row">
              <label htmlFor="joinCode" className="brotar-form-label">
                Código de Invitación *
              </label>
              <button
                type="button"
                className="brotar-paste-btn"
                onClick={handlePaste}
              >
                Pegar del portapapeles
              </button>
            </div>
            <input
              id="joinCode"
              type="text"
              placeholder="Ej: BROTAR-8X2K9"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="brotar-form-input brotar-code-input"
              required
              autoFocus
            />
            <span className="brotar-form-help">
              El código tiene formato BROTAR-XXXXXX o el enlace directo que te compartieron.
            </span>
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
                  <span>Verificando código…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Unirme al Equipo</span>
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
