import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import '../AuthPages.css';
import { AuthArtSide } from '../components/AuthArtSide.tsx';
import { useAuth } from '../context/useAuth.ts';
import { homeRouteForRole } from '../utils/roleHome.ts';
import type { UserRole } from '../../../shared/types/index.ts';
import { getApiErrorMessage } from '../utils/getApiErrorMessage.ts';
import { validateEmail, validateLoginPassword } from '../utils/validateAuthFields.ts';

export interface LoginPageProps {
  onNavigate?: (route: string) => void;
  onBack?: () => void;
  onSuccess?: (route: string, role: UserRole) => void;
}

interface LoginFieldErrors {
  email?: string;
  password?: string;
}

export const LoginPage: FC<LoginPageProps> = ({ onNavigate, onBack, onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (field: keyof LoginFieldErrors, value: string) => {
    const message =
      field === 'email' ? validateEmail(value) : validateLoginPassword(value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) {
        next[field] = message;
      } else {
        delete next[field];
      }
      return next;
    });
    return message;
  };

  const validateAll = (): boolean => {
    const emailError = validateEmail(email);
    const passwordError = validateLoginPassword(password);
    setFieldErrors({
      ...(emailError ? { email: emailError } : {}),
      ...(passwordError ? { password: passwordError } : {}),
    });
    return !emailError && !passwordError;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateAll()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const user = await login({ email, password });
      const targetRoute = user.mustChangePassword
        ? 'force-change-password'
        : homeRouteForRole(user.role);
      if (onSuccess) {
        onSuccess(targetRoute, user.role);
      } else if (onNavigate) {
        onNavigate(targetRoute);
      }
    } catch (err: unknown) {
      setFormError(
        getApiErrorMessage(
          err,
          'No se pudo iniciar sesión. Por favor verifica tus credenciales.',
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
            <h1 className="brotar-auth-title">Iniciar sesión</h1>
            <p className="brotar-auth-subtitle">
              Ingresa tu correo y contraseña para acceder a Brotar.
            </p>
          </div>

          {formError && (
            <div className="brotar-banner-error" role="alert" style={{ marginBottom: '1.25rem' }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="brotar-auth-form" noValidate>
            <div className={`brotar-field ${fieldErrors.email ? 'has-error' : ''}`}>
              <label htmlFor="login-email" className="brotar-label">
                Correo electrónico
              </label>
              <div className="brotar-input-wrapper">
                <Mail size={17} className="brotar-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="brotar-input brotar-input--with-icon"
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      validateField('email', e.target.value);
                    }
                  }}
                  onBlur={() => validateField('email', email)}
                  autoComplete="email"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.email)}
                />
              </div>
              {fieldErrors.email && (
                <span className="brotar-error-message">{fieldErrors.email}</span>
              )}
            </div>

            <div className={`brotar-field ${fieldErrors.password ? 'has-error' : ''}`}>
              <div className="brotar-label-row">
                <label htmlFor="login-password" className="brotar-label">
                  Contraseña
                </label>
                <button
                  type="button"
                  className="brotar-forgot-link"
                  onClick={() => onNavigate?.('recover-password')}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="brotar-input-wrapper">
                <Lock size={17} className="brotar-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="brotar-input brotar-input--with-icon brotar-input--with-toggle"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      validateField('password', e.target.value);
                    }
                  }}
                  onBlur={() => validateField('password', password)}
                  autoComplete="current-password"
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

            <button
              type="submit"
              className="brotar-action-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="brotar-auth-foot">
            ¿No tienes una cuenta?{' '}
            <button
              type="button"
              className="brotar-inline-link"
              onClick={() => onNavigate?.('register')}
            >
              Regístrate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
