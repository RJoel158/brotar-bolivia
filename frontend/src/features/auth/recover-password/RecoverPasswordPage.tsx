import type { FC, FormEvent } from "react";
import { useEffect, useState } from "react";
import { Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import "../AuthPages.css";
import { AuthArtSide } from "../components/AuthArtSide.tsx";
import { authApi } from "../../../shared/api/authApi.ts";
import {
  validateEmail,
  validatePassword,
} from "../utils/validateAuthFields.ts";
import { getApiErrorMessage } from "../utils/getApiErrorMessage.ts";
import { useAuth } from "../context/useAuth.ts";

export interface RecoverPasswordPageProps {
  onNavigate?: (route: string) => void;
  onBack?: () => void;
}

export const RecoverPasswordPage: FC<RecoverPasswordPageProps> = ({
  onNavigate,
  onBack,
}) => {
  const { logout } = useAuth();
  const [token, setToken] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get("token") || "",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const onHashChange = () => {
      setToken(
        new URLSearchParams(window.location.hash.slice(1)).get("token") || "",
      );
      setSubmitted(false);
      setCompleted(false);
      setFormError(null);
      setFieldErrors({});
      setPassword("");
      setConfirmPassword("");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const requestNewLink = () => {
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname + window.location.search,
    );
    setToken("");
    setSubmitted(false);
    setFormError(null);
    setFieldErrors({});
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setFormError(null);
    const errors: Record<string, string> = {};
    if (token) {
      const passwordError = validatePassword(password);
      if (passwordError) errors.password = passwordError;
      else if (new TextEncoder().encode(password).length > 72)
        errors.password = "La contraseña es demasiado larga (máximo 72 bytes).";
      if (confirmPassword !== password || !confirmPassword)
        errors.confirmPassword = "Las contraseñas no coinciden";
    } else {
      const emailError = validateEmail(email);
      if (emailError) errors.email = emailError;
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setIsSubmitting(true);
    try {
      if (token) {
        await authApi.resetPassword(token, password);
        logout();
        setCompleted(true);
        setPassword("");
        setConfirmPassword("");
        window.history.replaceState(
          window.history.state,
          "",
          window.location.pathname + window.location.search,
        );
      } else {
        await authApi.forgotPassword(email);
        setSubmitted(true);
      }
    } catch (error) {
      setFormError(
        getApiErrorMessage(
          error,
          "No pudimos completar la solicitud. Intenta nuevamente.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const success = completed || submitted;
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
            <h1 className="brotar-auth-title">
              {completed
                ? "Contraseña actualizada"
                : token
                  ? "Crea tu nueva contraseña"
                  : "Recuperar contraseña"}
            </h1>
            <p className="brotar-auth-subtitle">
              {completed
                ? "Tu contraseña se guardó correctamente."
                : token
                  ? "Elige una contraseña de al menos 8 caracteres para recuperar el acceso a tu cuenta."
                  : "Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña."}
            </p>
          </div>
          {formError && (
            <div className="brotar-banner-error" role="alert">
              {formError}
            </div>
          )}
          {success ? (
            <div className="brotar-recovery-success-box" role="status">
              <div className="brotar-recovery-success-icon">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="brotar-recovery-success-title">
                {completed ? "Tu cuenta está lista" : "Revisa tu correo"}
              </h3>
              <p className="brotar-recovery-success-text">
                {completed ? (
                  "Ya puedes iniciar sesión con tu nueva contraseña."
                ) : (
                  <>
                    Si existe una cuenta activa asociada a{" "}
                    <strong>{email.trim().toLowerCase()}</strong>, recibirás un
                    enlace válido por 30 minutos. Revisa también la carpeta de
                    spam.
                  </>
                )}
              </p>
              <button
                type="button"
                className="brotar-action-btn"
                onClick={() => onNavigate?.("login")}
              >
                Ir a iniciar sesión
              </button>
              {!completed && (
                <button
                  type="button"
                  className="brotar-inline-link"
                  onClick={requestNewLink}
                >
                  Usar otro correo o volver a intentar
                </button>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="brotar-auth-form"
              noValidate
              aria-busy={isSubmitting}
            >
              {token ? (
                <>
                  <div
                    className={`brotar-field ${fieldErrors.password ? "has-error" : ""}`}
                  >
                    <label htmlFor="reset-password" className="brotar-label">
                      Nueva contraseña
                    </label>
                    <div className="brotar-input-wrapper">
                      <Lock size={17} className="brotar-input-icon" />
                      <input
                        id="reset-password"
                        type={showPassword ? "text" : "password"}
                        className="brotar-input brotar-input--with-icon brotar-input--with-toggle"
                        placeholder="Mínimo 8 caracteres"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="new-password"
                        disabled={isSubmitting}
                        aria-invalid={Boolean(fieldErrors.password)}
                        aria-describedby={
                          fieldErrors.password
                            ? "reset-password-error"
                            : undefined
                        }
                      />
                      <button
                        type="button"
                        className="brotar-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Ocultar contraseña" : "Ver contraseña"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <span
                        id="reset-password-error"
                        className="brotar-error-message"
                      >
                        {fieldErrors.password}
                      </span>
                    )}
                  </div>
                  <div
                    className={`brotar-field ${fieldErrors.confirmPassword ? "has-error" : ""}`}
                  >
                    <label
                      htmlFor="reset-confirm-password"
                      className="brotar-label"
                    >
                      Confirmar nueva contraseña
                    </label>
                    <div className="brotar-input-wrapper">
                      <Lock size={17} className="brotar-input-icon" />
                      <input
                        id="reset-confirm-password"
                        type={showPassword ? "text" : "password"}
                        className="brotar-input brotar-input--with-icon"
                        placeholder="Repite la nueva contraseña"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        autoComplete="new-password"
                        disabled={isSubmitting}
                        aria-invalid={Boolean(fieldErrors.confirmPassword)}
                        aria-describedby={
                          fieldErrors.confirmPassword
                            ? "reset-confirm-error"
                            : undefined
                        }
                      />
                    </div>
                    {fieldErrors.confirmPassword && (
                      <span
                        id="reset-confirm-error"
                        className="brotar-error-message"
                      >
                        {fieldErrors.confirmPassword}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div
                  className={`brotar-field ${fieldErrors.email ? "has-error" : ""}`}
                >
                  <label htmlFor="recover-email" className="brotar-label">
                    Correo electrónico
                  </label>
                  <div className="brotar-input-wrapper">
                    <Mail size={17} className="brotar-input-icon" />
                    <input
                      id="recover-email"
                      type="email"
                      className="brotar-input brotar-input--with-icon"
                      placeholder="nombre@ejemplo.com"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setFieldErrors({});
                      }}
                      autoComplete="email"
                      disabled={isSubmitting}
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={
                        fieldErrors.email ? "recover-email-error" : undefined
                      }
                    />
                  </div>
                  {fieldErrors.email && (
                    <span
                      id="recover-email-error"
                      className="brotar-error-message"
                    >
                      {fieldErrors.email}
                    </span>
                  )}
                </div>
              )}
              <button
                type="submit"
                className="brotar-action-btn"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? token
                    ? "Guardando…"
                    : "Enviando enlace…"
                  : token
                    ? "Guardar nueva contraseña"
                    : "Enviar enlace de recuperación"}
              </button>
              {token && (
                <button
                  type="button"
                  className="brotar-inline-link"
                  onClick={requestNewLink}
                  disabled={isSubmitting}
                >
                  Solicitar un nuevo enlace
                </button>
              )}
            </form>
          )}
          <div className="brotar-auth-foot">
            ¿Recordaste tu contraseña?{" "}
            <button
              type="button"
              className="brotar-inline-link"
              onClick={() => onNavigate?.("login")}
            >
              Inicia sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
