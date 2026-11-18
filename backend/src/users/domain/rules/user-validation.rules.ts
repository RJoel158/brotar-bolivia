export class UserValidationRules {
  public static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  public static readonly MIN_PASSWORD_LENGTH = 8;
  public static readonly MIN_NAME_LENGTH = 3;
  public static readonly MAX_NAME_LENGTH = 100;
  /** Persons or companies: starts with a letter; allows digits and . , ' & ( ) - */
  public static readonly FULL_NAME_PATTERN = /^\p{L}[\p{L}\p{M}0-9 .,'&()-]*$/u;
  public static readonly FULL_NAME_FORMAT_MESSAGE =
    'El nombre completo debe empezar con una letra y solo puede contener letras, números, espacios y los signos . , \' & ( ) -';

  public static normalizeFullName(fullName: string): string {
    return typeof fullName === 'string' ? fullName.trim().replace(/\s+/g, ' ') : '';
  }

  public static validateEmail(email: string): void {
    if (!email || !this.EMAIL_REGEX.test(email.trim())) {
      throw new Error(`El correo electrónico "${email}" no tiene un formato válido.`);
    }
  }

  public static validateFullName(fullName: string): void {
    const value = this.normalizeFullName(fullName);
    if (value.length < this.MIN_NAME_LENGTH) {
      throw new Error(`El nombre completo debe tener al menos ${this.MIN_NAME_LENGTH} caracteres.`);
    }
    if (value.length > this.MAX_NAME_LENGTH) {
      throw new Error(`El nombre completo no puede exceder ${this.MAX_NAME_LENGTH} caracteres.`);
    }
    if (!this.FULL_NAME_PATTERN.test(value)) {
      throw new Error(`${this.FULL_NAME_FORMAT_MESSAGE}.`);
    }
    if ((value.match(/\p{L}/gu) ?? []).length < 2) {
      throw new Error('El nombre completo debe contener al menos 2 letras.');
    }
  }

  public static validateRawPassword(password: string): void {
    if (!password || password.length < this.MIN_PASSWORD_LENGTH) {
      throw new Error(`La contraseña debe tener al menos ${this.MIN_PASSWORD_LENGTH} caracteres.`);
    }
  }
}
