import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Heart, Leaf, ArrowLeft } from 'lucide-react';
import '../AuthPages.css';
import { AuthArtSide } from '../components/AuthArtSide.tsx';
import { useAuth } from '../context/useAuth.ts';
import { homeRouteForRole } from '../utils/roleHome.ts';
import type { UserRole } from '../../../shared/types/index.ts';
import { getApiErrorMessage } from '../utils/getApiErrorMessage.ts';
import {
  normalizeFullName,
  validateEmail,
  validateFullName,
  validatePassword,
  validateRegisterRole,
} from '../utils/validateAuthFields.ts';

export interface RegisterPageProps {
  onNavigate?: (route: string) => void;
  onBack?: () => void;
  onSuccess?: (route: string, role: UserRole) => void;
}

interface RegisterFieldErrors {
  fullName?: string;
  email?: string;
  role?: string;
  password?: string;
  confirmPassword?: string;
}

export const RegisterPage: FC<RegisterPageProps> = ({ onNavigate, onBack, onSuccess }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'creator' | 'sponsor'>('sponsor');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFieldError = (field: keyof RegisterFieldErrors, message: string | null) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) {
        next[field] = message;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const validateConfirmPassword = (val: string, pass: string): string | null => {
    if (!val) return 'Por favor confirma tu contraseña';
    if (val !== pass) return 'Las contraseñas no coinciden';
    return null;
  };

  const validateAll = (): boolean => {
    const nextErrors: RegisterFieldErrors = {};
    const fullNameError = validateFullName(fullName);
    const emailError = validateEmail(email);
    const roleError = validateRegisterRole(role);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(confirmPassword, password);

    if (fullNameError) nextErrors.fullName = fullNameError;
    if (emailError) nextErrors.email = emailError;
    if (roleError) nextErrors.role = roleError;
    if (passwordError) nextErrors.password = passwordError;
    if (confirmPasswordError) nextErrors.confirmPassword = confirmPasswordError;

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateAll()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanName = normalizeFullName(fullName);
      const user = await register({
        fullName: cleanName,
        email,
        role,
        password,
      });

      const targetRoute = homeRouteForRole(user.role);
      if (onSuccess) {
        onSuccess(targetRoute, user.role);
      } else if (onNavigate) {
        onNavigate(targetRoute);
      }
    } catch (err: unknown) {
      setFormError(
        getApiErrorMessage(
          err,
          'No se pudo completar el registro. Por favor verifica tus datos.',
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="brotar-auth-split-layout">
      <AuthArtSide />

      <div className="brotar-auth-form-pane">
        <div className="brotar-auth-form-card">
          {onBack && (
            <button
              type="button"
              className="brotar-auth-back-btn"
              onClick={onBack}
              aria-label="Volver a la pantalla anterior"
            >
              <ArrowLeft size={16} />
              <span>Volver</span>
            </button>
          )}

          <div className="brotar-auth-head">
            <h1 className="brotar-auth-title">Crear una cuenta</h1>
            <p className="brotar-auth-subtitle">
              Únete a la plataforma para apoyar o publicar proyectos sostenibles.
            </p>
          </div>

          {formError && (
            <div className="brotar-banner-error" role="alert" style={{ marginBottom: '1.25rem' }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="brotar-auth-form" noValidate>
            {/* Segmented Control for Role with Recognizable Icons */}
            <div className="brotar-field">
              <label className="brotar-label">¿Cómo deseas participar?</label>
              <div className="brotar-segmented-control" role="radiogroup" aria-label="Tipo de cuenta">
                <button
                  type="button"
                  role="radio"
                  aria-checked={role === 'sponsor'}
                  className={`brotar-segment-btn ${role === 'sponsor' ? 'is-active' : ''}`}
                  onClick={() => {
                    setRole('sponsor');
                    if (fieldErrors.role) setFieldError('role', null);
                  }}
                >
                  <Heart size={14} className="brotar-segment-icon" />
                  <span>Patrocinador</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={role === 'creator'}
                  className={`brotar-segment-btn ${role === 'creator' ? 'is-active' : ''}`}
                  onClick={() => {
                    setRole('creator');
                    if (fieldErrors.role) setFieldError('role', null);
                  }}
                >
                  <Leaf size={14} className="brotar-segment-icon" />
                  <span>Creador de proyectos</span>
                </button>
              </div>
              {fieldErrors.role && (
                <span className="brotar-error-message">{fieldErrors.role}</span>
              )}
            </div>

            {/* Nombre Completo */}
            <div className={`brotar-field ${fieldErrors.fullName ? 'has-error' : ''}`}>
              <label htmlFor="reg-name" className="brotar-label">
                Nombre completo
              </label>
              <div className="brotar-input-wrapper">
                <User size={17} className="brotar-input-icon" />
                <input
                  id="reg-name"
                  type="text"
                  className="brotar-input brotar-input--with-icon"
                  placeholder="María González"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) {
                      setFieldError('fullName', validateFullName(e.target.value));
                    }
                  }}
                  onBlur={() => setFieldError('fullName', validateFullName(fullName))}
                  autoComplete="name"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.fullName)}
                />
              </div>
              {fieldErrors.fullName && (
                <span className="brotar-error-message">{fieldErrors.fullName}</span>
              )}
            </div>

            {/* Correo Electrónico */}
            <div className={`brotar-field ${fieldErrors.email ? 'has-error' : ''}`}>
              <label htmlFor="reg-email" className="brotar-label">
                Correo electrónico
              </label>
              <div className="brotar-input-wrapper">
                <Mail size={17} className="brotar-input-icon" />
                <input
                  id="reg-email"
                  type="email"
                  className="brotar-input brotar-input--with-icon"
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldError('email', validateEmail(e.target.value));
                    }
                  }}
                  onBlur={() => setFieldError('email', validateEmail(email))}
                  autoComplete="email"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.email)}
                />
              </div>
              {fieldErrors.email && (
                <span className="brotar-error-message">{fieldErrors.email}</span>
              )}
            </div>

            {/* Contraseña */}
            <div className={`brotar-field ${fieldErrors.password ? 'has-error' : ''}`}>
              <label htmlFor="reg-password" className="brotar-label">
                Contraseña
              </label>
              <div className="brotar-input-wrapper">
                <Lock size={17} className="brotar-input-icon" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="brotar-input brotar-input--with-icon brotar-input--with-toggle"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldError('password', validatePassword(e.target.value));
                    }
                    if (confirmPassword && fieldErrors.confirmPassword) {
                      setFieldError(
                        'confirmPassword',
                        validateConfirmPassword(confirmPassword, e.target.value),
                      );
                    }
                  }}
                  onBlur={() => setFieldError('password', validatePassword(password))}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.password)}
                />
                <button
                  type="button"
                  className="brotar-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <span className="brotar-error-message">{fieldErrors.password}</span>
              )}
            </div>

            {/* Repetir Contraseña */}
            <div className={`brotar-field ${fieldErrors.confirmPassword ? 'has-error' : ''}`}>
              <label htmlFor="reg-confirm-password" className="brotar-label">
                Repetir contraseña
              </label>
              <div className="brotar-input-wrapper">
                <Lock size={17} className="brotar-input-icon" />
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="brotar-input brotar-input--with-icon brotar-input--with-toggle"
                  placeholder="Vuelve a escribir tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) {
                      setFieldError(
                        'confirmPassword',
                        validateConfirmPassword(e.target.value, password),
                      );
                    }
                  }}
                  onBlur={() =>
                    setFieldError(
                      'confirmPassword',
                      validateConfirmPassword(confirmPassword, password),
                    )
                  }
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                />
                <button
                  type="button"
                  className="brotar-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <span className="brotar-error-message">{fieldErrors.confirmPassword}</span>
              )}
            </div>

            <button
              type="submit"
              className="brotar-action-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>

          <div className="brotar-auth-foot">
            ¿Ya tienes una cuenta?{' '}
            <button
              type="button"
              className="brotar-inline-link"
              onClick={() => onNavigate?.('login')}
            >
              Inicia sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
