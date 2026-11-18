const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
/** Must match `UserValidationRules` in the backend. */
const MIN_NAME_LENGTH = 3;
const MAX_NAME_LENGTH = 100;
const FULL_NAME_PATTERN = /^\p{L}[\p{L}\p{M}0-9 .,'&()-]*$/u;

export function normalizeFullName(fullName: string): string {
  return fullName.trim().replace(/\s+/g, ' ');
}

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) {
    return 'El correo electrónico es obligatorio';
  }
  if (!EMAIL_REGEX.test(value)) {
    return 'El correo electrónico no es válido';
  }
  return null;
}

export function validatePassword(password: string, options?: { requireMinLength?: boolean }): string | null {
  if (!password) {
    return 'La contraseña es obligatoria';
  }
  if (options?.requireMinLength !== false && password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
  }
  return null;
}

export function validateLoginPassword(password: string): string | null {
  if (!password) {
    return 'La contraseña es obligatoria';
  }
  return null;
}

export function validateFullName(fullName: string): string | null {
  const value = normalizeFullName(fullName);
  if (!value) {
    return 'El nombre completo es obligatorio';
  }
  if (value.length < MIN_NAME_LENGTH) {
    return `El nombre completo debe tener al menos ${MIN_NAME_LENGTH} caracteres`;
  }
  if (value.length > MAX_NAME_LENGTH) {
    return `El nombre completo no puede exceder ${MAX_NAME_LENGTH} caracteres`;
  }
  if (!FULL_NAME_PATTERN.test(value)) {
    return "Debe empezar con una letra y solo usar letras, números, espacios y . , ' & ( ) -";
  }
  if ((value.match(/\p{L}/gu) ?? []).length < 2) {
    return 'El nombre completo debe contener al menos 2 letras';
  }
  return null;
}

export function validateRegisterRole(role: string): string | null {
  if (role !== 'creator' && role !== 'sponsor') {
    return 'El rol debe ser creator o sponsor';
  }
  return null;
}
