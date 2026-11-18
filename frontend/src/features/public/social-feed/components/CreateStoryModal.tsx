import type { FC, FormEvent, ChangeEvent } from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Image as ImageIcon,
  Globe,
  Lock,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sprout,
  FolderPlus,
  ArrowRight,
  Sparkles,
  Smile,
  Trash2,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { campaignsApi, type CampaignResponse } from '../../../../shared/api/campaignsApi.ts';
import { getApiErrorMessage } from '../../../auth/utils/getApiErrorMessage.ts';
import { useToast } from '../../../../shared/context/ToastContext.tsx';
import { useAuth } from '../../../auth/context/useAuth.ts';
import { compressImageToFile } from '../../../../shared/utils/compressImage.ts';
import './CreateStoryModal.css';

export interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onNavigate?: (route: string) => void;
}

const QUICK_EMOJIS = ['🌱', '🌿', '🌳', '💧', '☀️', '🌎', '💚', '✨'];

export const CreateStoryModal: FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onNavigate,
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [campaigns, setCampaigns] = useState<CampaignResponse[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'supporters_only'>('public');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Fetch creator campaigns when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingCampaigns(true);
    setError(null);

    campaignsApi
      .getMine()
      .then((data) => {
        if (!isMounted) return;
        setCampaigns(data);
        const publishedOrActive = data.filter((c) => c.status === 'published');
        if (publishedOrActive.length > 0) {
          setSelectedCampaignId(publishedOrActive[0].id);
        } else if (data.length > 0) {
          setSelectedCampaignId(data[0].id);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(getApiErrorMessage(err, 'No se pudieron cargar tus campañas'));
      })
      .finally(() => {
        if (isMounted) setIsLoadingCampaigns(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const publishedCampaigns = campaigns.filter((c) => c.status === 'published');
  const hasPublishedCampaigns = publishedCampaigns.length > 0;
  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida (JPG o PNG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5 MB.');
      return;
    }

    setIsUploadingImage(true);
    setError(null);

    try {
      const compressed = await compressImageToFile(file, {
        maxDimension: 1600,
        quality: 0.82,
        outputMimeType: 'image/jpeg',
      });

      const serverUrl = await campaignsApi.uploadCoverImage(compressed);
      setImageUrl(serverUrl);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo procesar y subir la imagen. Intenta con otra imagen JPG o PNG.'));
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const addEmoji = (emoji: string) => {
    setBody((prev) => prev + emoji);
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!selectedCampaignId) {
      setError('Por favor selecciona una campaña para la historia.');
      return;
    }
    if (!title.trim()) {
      setError('Ingresa un título breve para el avance.');
      return;
    }
    if (!body.trim() && !imageUrl) {
      setError('Agrega una descripción o una fotografía de tu avance.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await campaignsApi.createUpdate(selectedCampaignId, {
        title: title.trim(),
        body: body.trim() || 'Nuevo avance ecológico publicado.',
        visibility,
        imageUrl: imageUrl.trim() || null,
      });

      toast.success(
        '¡Tu historia ha sido compartida exitosamente!',
        'Historia Publicada',
      );

      // Reset form
      setTitle('');
      setBody('');
      setImageUrl('');
      setVisibility('public');

      onSuccess();
      onClose();
    } catch (err) {
      const msg = getApiErrorMessage(err, 'No se pudo publicar la historia');
      setError(msg);
      toast.error(msg, 'Error al publicar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="ig-story-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleImageFileChange}
        style={{ display: 'none' }}
        disabled={isUploadingImage}
      />

      <div className="ig-story-modal-card">
        {/* Instagram Header Bar */}
        <header className="ig-story-header">
          <div className="ig-story-header-left">
            <button
              type="button"
              className="ig-header-icon-btn"
              onClick={onClose}
              aria-label="Cerrar modal"
            >
              <X size={22} />
            </button>
          </div>

          <div className="ig-story-header-center">
            <h2 className="ig-header-title">Crear nueva historia</h2>
          </div>

          <div className="ig-story-header-right" />
        </header>

        {/* Loading State */}
        {isLoadingCampaigns ? (
          <div className="ig-story-loading-view">
            <Loader2 size={36} className="brotar-spin" color="#17913f" />
            <p>Cargando tus proyectos ecológicos…</p>
          </div>
        ) : !hasPublishedCampaigns ? (
          /* Empty State: Creator has no published campaigns yet */
          <div className="ig-story-empty-view">
            <div className="ig-empty-icon-wrap">
              <Sprout size={42} color="#17913f" />
            </div>
            <h3>Para publicar historias necesitas una campaña activa</h3>
            <p>
              Las historias conectan directamente con un proyecto publicado para mostrar su avance
              y atraer patrocinadores verdes.
            </p>

            <div className="ig-empty-actions">
              <button
                type="button"
                className="ig-btn-primary"
                onClick={() => {
                  onClose();
                  onNavigate?.('creator-campaign-create');
                }}
              >
                <FolderPlus size={16} />
                <span>Crear Nueva Campaña</span>
              </button>

              <button
                type="button"
                className="ig-btn-secondary"
                onClick={() => {
                  onClose();
                  onNavigate?.('creator-projects');
                }}
              >
                <span>Ver Mis Proyectos</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        ) : (
          /* Instagram 2-Column Split Body (Media Left, Form Right) */
          <div className="ig-story-body">
            {/* Left Column: Media Canvas & Upload */}
            <div
              className={`ig-media-column ${isDragging ? 'is-dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {imageUrl ? (
                <div className="ig-media-preview-container">
                  <img
                    src={imageUrl}
                    alt="Vista previa de historia"
                    className="ig-media-preview-image"
                  />

                  {/* Top floating media tools */}
                  <div className="ig-media-floating-bar">
                    <button
                      type="button"
                      className="ig-floating-btn"
                      onClick={() => fileInputRef.current?.click()}
                      title="Cambiar foto"
                    >
                      <Camera size={15} />
                      <span>Cambiar</span>
                    </button>

                    <button
                      type="button"
                      className="ig-floating-btn is-danger"
                      onClick={() => setImageUrl('')}
                      title="Eliminar foto"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Story badge simulation */}
                  <div className="ig-story-watermark">
                    <span className="ig-watermark-pill">
                      <Sprout size={13} color="#8cc63f" />
                      <span>{selectedCampaign?.title || 'Brotar Verde'}</span>
                    </span>
                  </div>
                </div>
              ) : (
                /* Drag & Drop Placeholder */
                <div
                  className="ig-media-dropzone"
                  onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  {isUploadingImage ? (
                    <div className="ig-upload-spinner-box">
                      <Loader2 size={36} className="brotar-spin" color="#17913f" />
                      <p>Optimizando imagen para historias…</p>
                    </div>
                  ) : (
                    <>
                      <div className="ig-dropzone-icon-circle">
                        <ImageIcon size={40} strokeWidth={1.5} />
                      </div>
                      <h3 className="ig-dropzone-heading">Arrastra las fotos aquí</h3>
                      <p className="ig-dropzone-subheading">
                        Comparte evidencia fotográfica del avance de tu proyecto
                      </p>
                      <button
                        type="button"
                        className="ig-select-computer-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                      >
                        <Camera size={16} />
                        <span>Seleccionar foto o cámara</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Metadata, User, Title, Description, Visibility */}
            <div className="ig-form-column">
              {error && (
                <div className="ig-error-banner">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Author Row */}
              <div className="ig-author-row">
                <div className="ig-author-avatar">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.fullName || 'Usuario'} />
                  ) : (
                    <span>{(user?.fullName || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="ig-author-meta">
                  <span className="ig-author-name">{user?.fullName || 'Creador Verde'}</span>
                  <span className="ig-author-tag">
                    {user?.role === 'creator' ? 'Creador de Proyecto' : 'Organización'}
                  </span>
                </div>
              </div>

              {/* Campaign Selector Row */}
              <div className="ig-field-section">
                <label htmlFor="igCampaignSelect" className="ig-field-label">
                  <Layers size={14} />
                  <span>Proyecto Asociado</span>
                </label>
                <div className="ig-select-wrap">
                  <select
                    id="igCampaignSelect"
                    className="ig-select-input"
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                  >
                    {publishedCampaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} • ({c.category})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="ig-select-arrow" />
                </div>
              </div>

              {/* Story Title */}
              <div className="ig-field-section">
                <label htmlFor="igStoryTitle" className="ig-field-label">
                  <Sparkles size={14} />
                  <span>Título del avance o historia</span>
                </label>
                <input
                  id="igStoryTitle"
                  type="text"
                  className="ig-title-input"
                  placeholder="Ej. ¡Llegamos al 50% de reforestación!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={160}
                  required
                />
              </div>

              {/* Caption / Description Textarea */}
              <div className="ig-caption-section">
                <textarea
                  className="ig-caption-textarea"
                  placeholder="Escribe una descripción o pie de historia..."
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={2200}
                />

                {/* Emoji toolbar & char counter */}
                <div className="ig-caption-toolbar">
                  <div className="ig-emoji-bar">
                    <button
                      type="button"
                      className="ig-emoji-toggle-btn"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      title="Agregar emojis"
                    >
                      <Smile size={18} />
                    </button>
                    {showEmojiPicker && (
                      <div className="ig-emoji-popover">
                        {QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="ig-emoji-btn"
                            onClick={() => addEmoji(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="ig-char-counter">{body.length}/2200</span>
                </div>
              </div>

              {/* Visibility / Compartir en */}
              <div className="ig-visibility-section">
                <span className="ig-visibility-title">Compartir en</span>

                <div className="ig-visibility-options-stack">
                  <label
                    className={`ig-visibility-item ${visibility === 'public' ? 'is-active' : ''}`}
                    onClick={() => setVisibility('public')}
                  >
                    <div className="ig-vis-icon-box">
                      <Globe size={18} color="#17913f" />
                    </div>
                    <div className="ig-vis-info">
                      <span className="ig-vis-name">Tu historia pública</span>
                      <span className="ig-vis-desc">Visible en carrusel de Historias y Feed</span>
                    </div>
                    <div className={`ig-radio-indicator ${visibility === 'public' ? 'is-checked' : ''}`} />
                  </label>

                  <label
                    className={`ig-visibility-item ${visibility === 'supporters_only' ? 'is-active' : ''}`}
                    onClick={() => setVisibility('supporters_only')}
                  >
                    <div className="ig-vis-icon-box is-amber">
                      <Lock size={18} color="#f59e0b" />
                    </div>
                    <div className="ig-vis-info">
                      <span className="ig-vis-name">Solo Patrocinadores</span>
                      <span className="ig-vis-desc">Exclusivo para aportantes del proyecto</span>
                    </div>
                    <div className={`ig-radio-indicator ${visibility === 'supporters_only' ? 'is-checked' : ''}`} />
                  </label>
                </div>
              </div>

              {/* Mobile Bottom Direct Share Bar */}
              <div className="ig-mobile-bottom-bar">
                <button
                  type="button"
                  className="ig-mobile-share-btn"
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting || isUploadingImage || !selectedCampaignId || !title.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="brotar-spin" />
                      <span>Publicando…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Compartir en Tu Historia</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
