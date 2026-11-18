export interface CompressImageOptions {
  /** Lado máximo en px (ancho o alto). Default: 1600 */
  maxDimension?: number;
  /** Calidad JPEG/WebP 0–1. Default: 0.82 */
  quality?: number;
  /** Formato de salida. Default: image/jpeg (compatible con covers del backend) */
  outputMimeType?: 'image/jpeg' | 'image/webp';
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo decodificar la imagen.'));
    };
    img.src = url;
  });
}

function fitWithin(width: number, height: number, maxDimension: number) {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }
  if (width >= height) {
    return {
      width: maxDimension,
      height: Math.round((height * maxDimension) / width),
    };
  }
  return {
    width: Math.round((width * maxDimension) / height),
    height: maxDimension,
  };
}

/**
 * Redimensiona y comprime una imagen en el navegador.
 * No cambia contratos de API: el caller decide si usa Blob, File o data URL.
 */
export async function compressImageToBlob(
  file: File,
  options: CompressImageOptions = {},
): Promise<Blob> {
  const maxDimension = options.maxDimension ?? 1600;
  const quality = options.quality ?? 0.82;
  const outputMimeType = options.outputMimeType ?? 'image/jpeg';

  const img = await loadImageFromFile(file);
  const { width, height } = fitWithin(img.naturalWidth || img.width, img.naturalHeight || img.height, maxDimension);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return file;
  }

  // Fondo blanco: evita transparencia negra al pasar PNG → JPEG
  if (outputMimeType === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), outputMimeType, quality);
  });

  if (!blob) {
    return file;
  }

  // Si la compresión no ayuda, conservar el original
  if (blob.size >= file.size && file.type === outputMimeType) {
    return file;
  }

  return blob;
}

export async function compressImageToFile(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  const outputMimeType = options.outputMimeType ?? 'image/jpeg';
  const blob = await compressImageToBlob(file, options);

  if (blob === file) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
  const extension = outputMimeType === 'image/webp' ? 'webp' : 'jpg';

  return new File([blob], `${baseName}.${extension}`, {
    type: outputMimeType,
    lastModified: Date.now(),
  });
}

export async function compressImageToDataUrl(
  file: File,
  options: CompressImageOptions = {},
): Promise<string> {
  const blob = await compressImageToBlob(file, options);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Error al leer la imagen comprimida.'));
    reader.readAsDataURL(blob);
  });
}
