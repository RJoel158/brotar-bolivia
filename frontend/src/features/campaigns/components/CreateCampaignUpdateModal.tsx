import type { FC, FormEvent } from 'react';
import { useState, useRef } from 'react';
import {
  X,
  Upload,
  Globe,
  Lock,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../../shared/index.ts';
import { campaignsApi } from '../../../shared/api/campaignsApi.ts';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';
import { useToast } from '../../../shared/context/ToastContext.tsx';
import './CreateCampaignUpdateModal.css';

export interface CreateCampaignUpdateModalProps {
  campaignId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCampaignUpdateModal: FC<CreateCampaignUpdateModalProps> = ({
  campaignId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'supporters_only'>('public');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setError(null);
    try {
      const url = await campaignsApi.uploadCoverImage(file);
      setImageUrl(url);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo subir la imagen. Intenta con otra imagen JPG o PNG.'));
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 3) {
      setError('El título debe tener al menos 3 caracteres.');
      return;
    }
    if (!body.trim() || body.trim().length < 10) {
      setError('El contenido debe tener al menos 10 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await campaignsApi.createUpdate(campaignId, {
        title: title.trim(),
        body: body.trim(),
        visibility,
        imageUrl: imageUrl.trim() || null,
      });
      toast.success('El avance ha sido publicado exitosamente.', 'Avance Publicado');
      setTitle('');
      setBody('');
      setImageUrl('');
      setVisibility('public');
      onSuccess();
      onClose();
    } catch (err) {
      const msg = getApiErrorMessage(err, 'No se pudo publicar la novedad.');
      setError(msg);
      toast.error(msg, 'Error al publicar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="update-modal-backdrop" onClick={onClose}>
      <div
        className="update-modal"
        role="dialog"
        aria-labelledby="modal-update-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="update-modal__header">
          <h2 id="modal-update-title" className="update-modal__title">
            Publicar Avance del Proyecto
          </h2>
          <button
            type="button"
            className="update-modal__close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="update-modal__form">
          {error ? (
            <div className="update-modal__error" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="update-form-group">
            <label htmlFor="update-title" className="update-label">
              Título del avance *
            </label>
            <input
              id="update-title"
              type="text"
              className="update-input"
              placeholder="Ej. Iniciamos la siembra en la parcela sur"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div className="update-form-group">
            <label htmlFor="update-body" className="update-label">
              Mensaje o detalle de la novedad *
            </label>
            <textarea
              id="update-body"
              className="update-textarea"
              rows={5}
              placeholder="Cuéntale a tu comunidad qué logros se alcanzaron, fotografías, materiales adquiridos o próximos pasos..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>

          <div className="update-form-group">
            <label className="update-label">Visibilidad de la publicación</label>
            <div className="update-visibility-options">
              <label
                className={`update-visibility-card ${
                  visibility === 'public' ? 'update-visibility-card--selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === 'public'}
                  onChange={() => setVisibility('public')}
                />
                <div className="update-visibility-card__content">
                  <div className="update-visibility-card__header">
                    <Globe size={16} className="icon-green" />
                    <strong>Público</strong>
                  </div>
                  <p>Visible para toda la comunidad y visitantes de Brotar.</p>
                </div>
              </label>

              <label
                className={`update-visibility-card ${
                  visibility === 'supporters_only' ? 'update-visibility-card--selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="supporters_only"
                  checked={visibility === 'supporters_only'}
                  onChange={() => setVisibility('supporters_only')}
                />
                <div className="update-visibility-card__content">
                  <div className="update-visibility-card__header">
                    <Lock size={16} className="icon-amber" />
                    <strong>Solo Patrocinadores</strong>
                  </div>
                  <p>Exclusivo para personas que han aportado a tu campaña.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="update-form-group">
            <label className="update-label">Fotografía o evidencia gráfica (opcional)</label>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/png, image/jpeg"
              onChange={handleImageFileChange}
            />

            {imageUrl ? (
              <div className="update-image-preview">
                <img src={imageUrl} alt="Vista previa" />
                <button
                  type="button"
                  className="update-image-preview__remove"
                  onClick={() => setImageUrl('')}
                  title="Quitar imagen"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                className="update-upload-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploadingImage ? (
                  <div className="update-upload-loading">
                    <Loader2 size={24} className="spin-icon" />
                    <span>Subiendo imagen...</span>
                  </div>
                ) : (
                  <>
                    <Upload size={24} className="update-upload-icon" />
                    <p className="update-upload-text">
                      Haz clic para subir una foto de respaldo (JPG o PNG, máx. 5MB)
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="update-modal__footer">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || isUploadingImage || !title.trim() || !body.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin-icon" />
                  Publicando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} className="btn-icon" />
                  Publicar ahora
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
