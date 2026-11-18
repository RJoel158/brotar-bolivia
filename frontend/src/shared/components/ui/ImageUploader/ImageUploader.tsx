import type { FC, ChangeEvent, DragEvent } from 'react';
import { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { compressImageToDataUrl } from '../../../utils/compressImage.ts';
import './ImageUploader.css';

export interface ImageUploaderProps {
  label?: string;
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  maxSizeMb?: number;
  /** Lado máximo en px tras comprimir. Default: 512 (avatar) */
  maxDimension?: number;
  className?: string;
}

export const ImageUploader: FC<ImageUploaderProps> = ({
  label = 'Foto de Perfil / Avatar',
  value,
  onChange,
  maxSizeMb = 5,
  maxDimension = 512,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Formato inválido. Solo se permiten imágenes (JPG, PNG, WebP).');
      return;
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`La imagen excede el límite máximo de ${maxSizeMb}MB.`);
      return;
    }

    setIsProcessing(true);
    try {
      const dataUrl = await compressImageToDataUrl(file, {
        maxDimension,
        quality: 0.82,
        outputMimeType: 'image/jpeg',
      });
      onChange(dataUrl);
    } catch {
      setError('No se pudo procesar la imagen. Intenta con otro archivo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  const handleRemove = () => {
    onChange(undefined);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`brotar-image-uploader-wrapper ${className}`}>
      {label && (
        <label className="uploader-label">
          <ImageIcon size={15} />
          <span>{label}</span>
        </label>
      )}

      {value ? (
        <div className="uploader-preview-card">
          <img src={value} alt="Preview" className="uploader-preview-img" />
          <div className="uploader-preview-info">
            <span className="preview-filename">Imagen cargada correctamente</span>
            <span className="preview-sub">Comprimida para reducir peso (JPG)</span>
          </div>
          <button
            type="button"
            className="uploader-btn-remove"
            onClick={handleRemove}
            title="Eliminar imagen"
            disabled={isProcessing}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          className={`uploader-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          aria-busy={isProcessing}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            disabled={isProcessing}
          />
          <div className="dropzone-content">
            <div className="dropzone-icon-box">
              <UploadCloud size={24} className="dropzone-icon" />
            </div>
            <div className="dropzone-text">
              <span className="dropzone-title">
                {isProcessing
                  ? 'Optimizando imagen…'
                  : 'Haz clic para subir o arrastra una imagen'}
              </span>
              <span className="dropzone-hint">
                PNG, JPG o WebP (Máx. {maxSizeMb}MB) · se comprime automáticamente
              </span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="uploader-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
