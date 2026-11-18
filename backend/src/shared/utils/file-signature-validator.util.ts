import { BadRequestException } from '@nestjs/common';

export interface FileValidationResult {
  isValid: boolean;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;
}

export class FileSignatureValidator {
  private static readonly DATA_URL_REGEX = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/;
  private static readonly MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  public static validateImageDataUrl(
    dataUrl: string,
    fieldName = 'documento',
  ): FileValidationResult {
    if (!dataUrl || typeof dataUrl !== 'string') {
      throw new BadRequestException(`El campo "${fieldName}" es obligatorio y debe ser una cadena válida.`);
    }

    // 1. Validar formato Data URL
    const match = dataUrl.match(this.DATA_URL_REGEX);
    if (!match) {
      // Si ya es una URL externa segura (https://)
      if (dataUrl.startsWith('https://') || dataUrl.startsWith('http://localhost')) {
        return {
          isValid: true,
          mimeType: 'image/jpeg',
          sizeBytes: 0,
        };
      }

      throw new BadRequestException(
        `El formato del archivo en "${fieldName}" es inválido. Solo se admiten imágenes codificadas en Data URL (JPEG, PNG, WEBP).`,
      );
    }

    const declaredMime = match[1].toLowerCase() === 'jpg' ? 'jpeg' : match[1].toLowerCase();
    const base64Data = match[2];

    // 2. Decodificar buffer binario
    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64Data, 'base64');
    } catch {
      throw new BadRequestException(`La imagen en "${fieldName}" contiene una codificación Base64 corrupta.`);
    }

    // 3. Validar límite de tamaño
    if (buffer.length > this.MAX_SIZE_BYTES) {
      throw new BadRequestException(
        `El archivo en "${fieldName}" excede el tamaño máximo permitido de 5MB (tamaño: ${(buffer.length / (1024 * 1024)).toFixed(2)}MB).`,
      );
    }

    if (buffer.length < 12) {
      throw new BadRequestException(`El archivo en "${fieldName}" es demasiado pequeño o está incompleto.`);
    }

    // 4. Detección y rechazo de firmas maliciosas conocidas (Anti-Inyección)
    // - SVG / XML XSS (<svg, <?xml, <!DOCTYPE)
    // - Windows PE executable (MZ)
    // - Linux ELF executable (\x7fELF)
    // - PDF (%PDF-)
    // - HTML (<html, <!DOC, <script)
    const headerString = buffer.subarray(0, 30).toString('utf-8').toLowerCase();
    if (
      headerString.includes('<svg') ||
      headerString.includes('<?xml') ||
      headerString.includes('<script') ||
      headerString.includes('<html') ||
      headerString.includes('<!doctype')
    ) {
      throw new BadRequestException(
        `Inyección de archivo bloqueada en "${fieldName}": no se permiten archivos SVG/XML/HTML con potencial ejecución de scripts.`,
      );
    }

    if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
      throw new BadRequestException(`Inyección de archivo bloqueada en "${fieldName}": archivo ejecutable (MZ PE) no permitido.`);
    }

    if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
      throw new BadRequestException(`Inyección de archivo bloqueada en "${fieldName}": binario ELF no permitido.`);
    }

    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      throw new BadRequestException(`Inyección de archivo bloqueada en "${fieldName}": formato PDF no admitido en este campo (solo imágenes).`);
    }

    // 5. Validar Magic Bytes de Imagen Real
    let detectedMime: 'image/jpeg' | 'image/png' | 'image/webp' | null = null;

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      detectedMime = 'image/jpeg';
    }
    // PNG: 89 50 4E 47
    else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      detectedMime = 'image/png';
    }
    // WebP: RIFF (52 49 46 46) + WEBP (57 45 42 50 en bytes 8..11)
    else if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      detectedMime = 'image/webp';
    }

    if (!detectedMime) {
      throw new BadRequestException(
        `Firma binaria inválida en "${fieldName}". El archivo no coincide con una imagen real JPEG, PNG o WebP.`,
      );
    }

    return {
      isValid: true,
      mimeType: detectedMime,
      sizeBytes: buffer.length,
    };
  }
}
