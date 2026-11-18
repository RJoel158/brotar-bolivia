import type { FC, FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import '../AuthPages.css';
import { AuthArtSide } from '../components/AuthArtSide.tsx';
import { useAuth } from '../context/useAuth.ts';
import { usersApi } from '../../../shared/api/usersApi.ts';
import { getApiErrorMessage } from '../utils/getApiErrorMessage.ts';
import { validatePassword } from '../utils/validateAuthFields.ts';
import { homeRouteForRole } from '../utils/roleHome.ts';
import type { UserRole } from '../../../shared/types/index.ts';

export interface ForceChangePasswordPageProps {
  onSuccess?: (route: string, role: UserRole) => void;
  onLogout?: () => void;
}

interface FieldErrors {
  newPassword?: string;
  confirmPassword?: string;
}

export const ForceChangePasswordPage: FC<ForceChangePasswordPageProps> = ({
  onSuccess,
  onLogout,
}) => {
  const { user, refreshUser, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const me = await refreshUser();
      if (cancelled || !me) return;
      if (!me.mustChangePassword) {
        onSuccess?.(homeRouteForRole(me.role as UserRole), me.role as UserRole);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser, onSuccess]);

  const validateConfirm = (confirm: string, next: string): string | undefined => {
    if (!confirm) return 'Confirma tu nueva contraseña';
    if (confirm !== next) return 'Las contraseñas no coinciden';
    return undefined;
  };

  const validateAll = (): boolean => {
    const newError = validatePassword(newPassword) ?? undefined;
    const confirmError = validateConfirm(confirmPassword, newPassword);
    const next: FieldErrors = {
      ...(newError ? { newPassword: newError } : {}),
      ...(confirmError ? { confirmPassword: confirmError } : {}),
    };
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validateAll()) return;

    try {
      setIsSubmitting(true);
      await usersApi.updateProfile({ newPassword });
      const refreshed = await refreshUser();
      const role = (refreshed?.role ?? user?.role ?? 'sponsor') as UserRole;
      onSuccess?.(homeRouteForRole(role), role);
    } catch (err: unknown) {
      setFormError(
        getApiErrorMessage(err, 'No se pudo actualizar la contraseña. Intenta de nuevo.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    onLogout?.();
  };

  return (
    <div className="brotar-auth-split-layout">
      <AuthArtSide />

      <div className="brotar-auth-form-pane">
        <div className="brotar-auth-form-card">
          <div className="brotar-auth-head">
            <div className="brotar-force-password-badge" aria-hidden>
              <ShieldAlert size={20} />
            </div>
            <h1 className="brotar-auth-title">Cambia tu contraseña</h1>
            <p className="brotar-auth-subtitle">
              Ingresaste con una contraseña temporal. Por seguridad debes crear una nueva antes de
              continuar.
            </p>
          </div>

          {formError && (
            <div className="brotar-banner-error" role="alert" style={{ marginBottom: '1.25rem' }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="brotar-auth-form" noValidate>
            <div className={`brotar-field ${fieldErrors.newPassword ? 'has-error' : ''}`}>
              <label htmlFor="force-new-password" className="brotar-label">
                Nueva contraseña
              </label>
              <div className="brotar-input-wrapper">
                <Lock size={17} className="brotar-input-icon" />
                <input
                  id="force-new-password"
                  type={showNew ? 'text' : 'password'}
                  className="brotar-input brotar-input--with-icon brotar-input--with-toggle"
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.newPassword)}
                />
                <button
                  type="button"
                  className="brotar-password-toggle"
                  onClick={() => setShowNew((v) => !v)}
                  tabIndex={-1}
                  aria-label={showNew ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.newPassword && (
                <span className="brotar-error-message">{fieldErrors.newPassword}</span>
              )}
            </div>

            <div className={`brotar-field ${fieldErrors.confirmPassword ? 'has-error' : ''}`}>
              <label htmlFor="force-confirm-password" className="brotar-label">
                Confirmar nueva contraseña
              </label>
              <div className="brotar-input-wrapper">
                <Lock size={17} className="brotar-input-icon" />
                <input
                  id="force-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  className="brotar-input brotar-input--with-icon brotar-input--with-toggle"
                  placeholder="Repite la nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                />
                <button
                  type="button"
                  className="brotar-password-toggle"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <span className="brotar-error-message">{fieldErrors.confirmPassword}</span>
              )}
            </div>

            <button type="submit" className="brotar-action-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : 'Guardar nueva contraseña'}
            </button>
          </form>

          <div className="brotar-auth-foot">
            <button type="button" className="brotar-inline-link" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
