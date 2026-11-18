import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { compressImageToFile } from '../../../../shared/utils/compressImage.ts';
import { COVER_IMAGE_ACCEPT, COVER_IMAGE_MAX_BYTES } from '../types.ts';
import './CoverImageField.css';

export interface CoverImageFieldProps {
  file: File | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
  onClearExisting?: () => void;
}

function isAcceptedImage(file: File): boolean {
  return file.type === 'image/jpeg' || file.type === 'image/png';
}

export function CoverImageField({
  file,
  existingUrl = null,
  onChange,
  onClearExisting,
}: CoverImageFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  const previewUrl = objectUrl ?? existingUrl ?? null;

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  const applyFile = async (nextFile: File | null) => {
    if (!nextFile) {
      setError(null);
      onChange(null);
      return;
    }

    if (!isAcceptedImage(nextFile)) {
      setError('Solo se aceptan imágenes JPG o PNG.');
      return;
    }

    if (nextFile.size > COVER_IMAGE_MAX_BYTES) {
      setError('La imagen no puede superar 5 MB.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      // JPEG para respetar el contrato del backend (solo jpeg/png)
      const compressed = await compressImageToFile(nextFile, {
        maxDimension: 1600,
        quality: 0.82,
        outputMimeType: 'image/jpeg',
      });

      if (compressed.size > COVER_IMAGE_MAX_BYTES) {
        setError('La imagen no puede superar 5 MB tras optimizarla.');
        return;
      }

      onChange(compressed);
    } catch {
      setError('No se pudo optimizar la imagen. Intenta con otro archivo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    if (file) {
      void applyFile(null);
      return;
    }
    if (existingUrl) {
      onClearExisting?.();
    }
  };

  const hasImage = Boolean(previewUrl);

  return (
    <div className="cover-image-field">
      <label className="cover-image-field__label" htmlFor={inputId}>
        Imagen de portada
      </label>

      <div
        className={`cover-image-field__dropzone ${isDragging ? 'is-dragging' : ''} ${hasImage ? 'has-preview' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (isProcessing) return;
          const dropped = event.dataTransfer.files[0] ?? null;
          void applyFile(dropped);
        }}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Vista previa de la portada" className="cover-image-field__preview" />
        ) : (
          <p className="cover-image-field__hint">
            {isProcessing ? 'Optimizando imagen…' : 'JPG o PNG, máximo 5 MB (se comprime al subir).'}
          </p>
        )}

        <div className="cover-image-field__actions">
          <button
            type="button"
            className="cover-image-field__browse"
            onClick={() => inputRef.current?.click()}
            disabled={isProcessing}
          >
            {isProcessing ? 'Optimizando…' : hasImage ? 'Cambiar imagen' : 'Seleccionar archivo'}
          </button>
          {hasImage ? (
            <button
              type="button"
              className="cover-image-field__remove"
              onClick={handleRemove}
              disabled={isProcessing}
            >
              Quitar
            </button>
          ) : null}
        </div>
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={COVER_IMAGE_ACCEPT}
        className="cover-image-field__input"
        disabled={isProcessing}
        onChange={(event) => {
          void applyFile(event.target.files?.[0] ?? null);
        }}
      />

      {error ? (
        <p className="cover-image-field__error" role="alert">
          {error}
        </p>
      ) : (
        <p className="cover-image-field__helper">
          {file
            ? 'La imagen se optimizó y se subirá al guardar la campaña.'
            : existingUrl
              ? 'Portada guardada. Puedes reemplazarla seleccionando otro archivo.'
              : 'JPG o PNG, máximo 5 MB. Se redimensiona y comprime automáticamente.'}
        </p>
      )}
    </div>
  );
}
