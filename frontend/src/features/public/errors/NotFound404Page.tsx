import type { FC } from 'react';
import { Home, Compass, ArrowLeft } from 'lucide-react';
import { BrotinIllustration } from './components/BrotinIllustration.tsx';
import './NotFound404Page.css';

interface NotFound404PageProps {
  onNavigate?: (route: string) => void;
}

export const NotFound404Page: FC<NotFound404PageProps> = ({ onNavigate }) => {
  const handleGoHome = () => {
    if (onNavigate) {
      onNavigate('home');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const handleExplore = () => {
    if (onNavigate) {
      onNavigate('explore-projects');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/explorar';
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
    <div className="brotar-error-page">
      <div className="brotar-error-card">
        {/* Animated Mascot */}
        <div className="brotar-error-mascot-wrapper">
          <BrotinIllustration variant="404" size={200} />
          <div className="brotar-error-badge">404</div>
        </div>

        {/* Text Content */}
        <div className="brotar-error-content">
          <span className="brotar-error-eyebrow">Página no encontrada</span>
          <h1 className="brotar-error-title">Esta semilla aún no ha brotado</h1>
          <p className="brotar-error-description">
            La página que buscas no existe, ha sido movida o la dirección ingresada es incorrecta.
            Brotín buscó por todo el huerto pero no encontró nada por aquí.
          </p>

          {/* Action CTAs */}
          <div className="brotar-error-actions">
            <button
              type="button"
              className="brotar-error-btn brotar-error-btn-primary"
              onClick={handleGoHome}
            >
              <Home size={18} />
              <span>Volver al inicio</span>
            </button>

            <button
              type="button"
              className="brotar-error-btn brotar-error-btn-secondary"
              onClick={handleExplore}
            >
              <Compass size={18} />
              <span>Explorar proyectos</span>
            </button>

            <button
              type="button"
              className="brotar-error-btn brotar-error-btn-ghost"
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
