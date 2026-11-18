import type { FC } from 'react';
import { AlertTriangle } from 'lucide-react';

const TECHNICAL_HINT =
  /\btabla\b|\btable\b|\bSQL\b|base de datos|database|\brelation\b|prisma|DB Master|internal server error|permisos sobre/i;

/** Server messages about tables, SQL or grants are meant for whoever runs the database, not the reviewer. */
function isTechnicalErrorMessage(message: string): boolean {
  return TECHNICAL_HINT.test(message);
}

export interface LoadErrorNoticeProps {
  /** Plain-language description of what failed to load. */
  summary: string;
  /** Message returned by the API. */
  error: string;
  onRetry?: () => void;
}

export const LoadErrorNotice: FC<LoadErrorNoticeProps> = ({ summary, error, onRetry }) => {
  const technical = isTechnicalErrorMessage(error);
  const showsOwnMessage = !technical && error.trim() !== summary.trim();

  return (
    <div className="load-error-notice" role="alert">
      <div className="load-error-notice-head">
        <AlertTriangle size={16} aria-hidden />
        <strong>{summary}</strong>
      </div>
      {showsOwnMessage ? <p>{error}</p> : null}
      {technical ? (
        <p>El servidor no pudo entregar esta información. Avisa al equipo técnico si el problema continúa.</p>
      ) : null}
      {technical ? (
        <details className="load-error-notice-details">
          <summary>Detalles para diagnóstico</summary>
          <code>{error}</code>
        </details>
      ) : null}
      {onRetry ? (
        <button type="button" className="load-error-notice-retry" onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  );
};
