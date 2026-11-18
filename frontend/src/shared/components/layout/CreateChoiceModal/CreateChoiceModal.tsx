import type { FC } from 'react';
import { Camera, FolderPlus, X, Sparkles, ArrowRight } from 'lucide-react';
import './CreateChoiceModal.css';

export interface CreateChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStory: () => void;
  onSelectCampaign: () => void;
}

export const CreateChoiceModal: FC<CreateChoiceModalProps> = ({
  isOpen,
  onClose,
  onSelectStory,
  onSelectCampaign,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="brotar-create-choice-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Seleccionar tipo de publicación"
    >
      <div className="brotar-create-choice-card">
        {/* Header */}
        <div className="brotar-create-choice-header">
          <div className="brotar-create-choice-title-wrap">
            <Sparkles size={18} className="brotar-create-choice-sparkle" />
            <h3>Crear en Brotar</h3>
          </div>
          <button
            type="button"
            className="brotar-create-choice-close-btn"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Options Stack */}
        <div className="brotar-create-choice-options">
          {/* Option 1: Subir Historia / Avance */}
          <button
            type="button"
            className="brotar-create-option-card is-story"
            onClick={() => {
              onClose();
              onSelectStory();
            }}
          >
            <div className="brotar-create-option-icon-box is-green">
              <Camera size={24} />
            </div>
            <div className="brotar-create-option-content">
              <h4>Subir Historia / Avance</h4>
              <p>Comparte fotos y actualizaciones rápidas de impacto en tu comunidad</p>
            </div>
            <ArrowRight size={18} className="brotar-create-option-arrow" />
          </button>

          {/* Option 2: Publicar Proyecto / Campaña */}
          <button
            type="button"
            className="brotar-create-option-card is-campaign"
            onClick={() => {
              onClose();
              onSelectCampaign();
            }}
          >
            <div className="brotar-create-option-icon-box is-institutional">
              <FolderPlus size={24} />
            </div>
            <div className="brotar-create-option-content">
              <h4>Crear Nueva Campaña</h4>
              <p>Inicia un proyecto verde o social para recaudar financiamiento</p>
            </div>
            <ArrowRight size={18} className="brotar-create-option-arrow" />
          </button>
        </div>
      </div>
    </div>
  );
};
