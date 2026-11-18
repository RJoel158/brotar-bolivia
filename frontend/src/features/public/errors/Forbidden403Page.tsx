import type { FC } from 'react';
import { Home, LogIn, ArrowLeft } from 'lucide-react';
import { BrotinIllustration } from './components/BrotinIllustration.tsx';
import './Forbidden403Page.css';

interface Forbidden403PageProps {
  onNavigate?: (route: string) => void;
  requiredRole?: string;
}

export const Forbidden403Page: FC<Forbidden403PageProps> = ({
  onNavigate,
  requiredRole,
}) => {
  const handleGoHome = () => {
    if (onNavigate) {
      onNavigate('home');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const handleLogin = () => {
    if (onNavigate) {
      onNavigate('login');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      handleGoHome();
    }
  };

  return (
    <div className="brotar-forbidden-page">
      <div className="brotar-forbidden-card">
        {/* Animated Mascot */}
        <div className="brotar-forbidden-mascot-wrapper">
          <BrotinIllustration variant="403" size={200} />
          <div className="brotar-forbidden-badge">403</div>
        </div>

        {/* Text Content */}
        <div className="brotar-forbidden-content">
          <span className="brotar-forbidden-eyebrow">Acceso restringido</span>
          <h1 className="brotar-forbidden-title">Zona protegida del huerto</h1>
          <p className="brotar-forbidden-description">
            No cuentas con los permisos necesarios para ingresar a esta sección
            {requiredRole ? ` (requiere rol de ${requiredRole})` : ''}.
            Brotín está custodiando este espacio para mantener todo en orden.
          </p>

          {/* Action CTAs */}
          <div className="brotar-forbidden-actions">
            <button
              type="button"
              className="brotar-forbidden-btn brotar-forbidden-btn-primary"
              onClick={handleLogin}
            >
              <LogIn size={18} />
              <span>Iniciar sesión</span>
            </button>

            <button
              type="button"
              className="brotar-forbidden-btn brotar-forbidden-btn-secondary"
              onClick={handleGoHome}
            >
              <Home size={18} />
              <span>Volver al inicio</span>
            </button>

            <button
              type="button"
              className="brotar-forbidden-btn brotar-forbidden-btn-ghost"
              onClick={handleBack}
            >
              <ArrowLeft size={18} />
              <span>Regresar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
