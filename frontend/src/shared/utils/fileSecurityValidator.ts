/**
 * Client-Side File Security & Magic Bytes Validator
 * Protects against SVG/XML XSS, executable polyglots, and invalid formats.
 */

export interface FileSecurityValidationResult {
  isValid: boolean;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
  error?: string;
}

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const BLOCKED_EXTENSIONS = ['.svg', '.exe', '.sh', '.bat', '.cmd', '.pdf', '.html', '.htm', '.php', '.js', '.xml'];
const MAX_RAW_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function validateImageFileSecurity(file: File): Promise<FileSecurityValidationResult> {
  if (!file) {
    return { isValid: false, error: 'No se seleccionó ningún archivo.' };
  }

  // 1. Verificación de extensión de nombre de archivo
  const fileNameLower = file.name.toLowerCase();
  const hasBlockedExt = BLOCKED_EXTENSIONS.some((ext) => fileNameLower.endsWith(ext));
  if (hasBlockedExt) {
    return {
      isValid: false,
      error: `Formato de archivo bloqueado por seguridad (${file.name}). Solo se permiten imágenes fotográficas (JPG, PNG, WEBP). Los archivos SVG/PDF no están permitidos.`,
    };
  }

  const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) => fileNameLower.endsWith(ext));
  if (!hasAllowedExt) {
    return {
      isValid: false,
      error: `Extensión no admitida. Por favor sube un archivo con extensión .jpg, .png o .webp.`,
    };
  }

  // 2. Límite de tamaño máximo
  if (file.size > MAX_RAW_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `El archivo supera el tamaño máximo permitido de 10MB (tamaño: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  if (file.size < 16) {
    return {
      isValid: false,
      error: 'El archivo está dañado o vacío.',
    };
  }

  // 3. Inspección binaria de Magic Bytes (Cabecera real del archivo)
  try {
    const slice = file.slice(0, 16);
    const arrayBuffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return { isValid: true, mimeType: 'image/jpeg' };
    }

    // PNG: 89 50 4E 47
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return { isValid: true, mimeType: 'image/png' };
    }

    // WebP: 52 49 46 46 (RIFF) + 57 45 42 50 (WEBP en bytes 8..11)
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return { isValid: true, mimeType: 'image/webp' };
    }

    // Verificación de textos maliciosos en cabecera
    const headerStr = String.fromCharCode(...bytes).toLowerCase();
    if (headerStr.includes('<svg') || headerStr.includes('<?xm') || headerStr.includes('<!do')) {
      return {
        isValid: false,
        error: 'El archivo contiene código vectorial o script XML/SVG. Solo se admiten imágenes bitmap puras (JPG, PNG).',
      };
    }

    return {
      isValid: false,
      error: 'La firma binaria del archivo no corresponde a una imagen válida (JPG, PNG, WEBP).',
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `Error al leer la cabecera de seguridad del archivo: ${err?.message || 'Archivo inaccesible'}`,
    };
  }
}
