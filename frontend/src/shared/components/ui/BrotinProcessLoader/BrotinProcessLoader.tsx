import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { BrotinIllustration, type BrotinVariant } from '../../../../features/public/errors/components/BrotinIllustration.tsx';
import { Sparkles } from 'lucide-react';
import './BrotinProcessLoader.css';

export interface BrotinProcessLoaderProps {
  title?: string;
  message?: string;
  subMessage?: string;
  variant?: 'inline' | 'fullscreen' | 'modal' | 'card' | 'compact';
  mascotSize?: number;
  mascotVariant?: BrotinVariant;
  steps?: string[];
  stepIntervalMs?: number;
  showProgress?: boolean;
  progressPercentage?: number;
  autoSimulateProgress?: boolean;
  className?: string;
}

const DEFAULT_STEPS = [
  'Preparando el terreno fértil…',
  'Conectando con proyectos verdes e iniciativas…',
  'Cargando historias y novedades comunitarias…',
  'Nutriendo los brotes… ¡casi listo! 🌱',
];

export const BrotinProcessLoader: FC<BrotinProcessLoaderProps> = ({
  title,
  message,
  subMessage,
  variant = 'inline',
  mascotSize,
  mascotVariant = 'loading',
  steps = DEFAULT_STEPS,
  stepIntervalMs = 2400,
  showProgress = true,
  progressPercentage,
  autoSimulateProgress = true,
  className = '',
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [simulatedProgress, setSimulatedProgress] = useState(12);

  // Rotating steps timer
  useEffect(() => {
    if (!steps || steps.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % steps.length);
    }, stepIntervalMs);

    return () => clearInterval(interval);
  }, [steps, stepIntervalMs]);

  // Simulated progress (smooth incremental curve towards 96%)
  useEffect(() => {
    if (!autoSimulateProgress || progressPercentage !== undefined) return;

    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev < 40) return prev + Math.floor(Math.random() * 8) + 5;
        if (prev < 75) return prev + Math.floor(Math.random() * 5) + 3;
        if (prev < 94) return prev + Math.floor(Math.random() * 2) + 1;
        return prev;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [autoSimulateProgress, progressPercentage]);

  const activeMessage = message || (steps && steps.length > 0 ? steps[currentStepIndex] : 'Cargando...');
  const activeProgress = progressPercentage !== undefined ? progressPercentage : simulatedProgress;

  const defaultSize =
    mascotSize ||
    (variant === 'compact' ? 70 : variant === 'fullscreen' ? 180 : variant === 'modal' ? 140 : 130);

  return (
    <div
      className={`brotar-process-loader is-${variant} ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Cargando contenido"
    >
      <div className="brotar-process-loader-card">
        {/* Animated Mascot */}
        <div className="brotar-process-mascot-box">
          <BrotinIllustration
            variant={mascotVariant}
            size={defaultSize}
            className="brotar-process-mascot"
          />
        </div>

        {/* Process Feedback Texts */}
        <div className="brotar-process-info">
          {title && (
            <h3 className="brotar-process-title">
              <Sparkles size={16} className="brotar-process-sparkle" />
              <span>{title}</span>
            </h3>
          )}

          <p className="brotar-process-step-message" key={currentStepIndex}>
            {activeMessage}
          </p>

          {subMessage && <span className="brotar-process-submessage">{subMessage}</span>}
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="brotar-process-progress-container">
            <div className="brotar-process-bar-track">
              <div
                className="brotar-process-bar-fill"
                style={{ width: `${Math.min(100, Math.max(0, activeProgress))}%` }}
              />
            </div>
            <span className="brotar-process-percentage">
              {Math.min(100, Math.round(activeProgress))}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
