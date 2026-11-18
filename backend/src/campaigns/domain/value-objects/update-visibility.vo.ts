export type UpdateVisibilityScope = 'public' | 'supporters_only';

export class UpdateVisibility {
  public static readonly PUBLIC = new UpdateVisibility('public');
  public static readonly SUPPORTERS_ONLY = new UpdateVisibility('supporters_only');

  private constructor(private readonly value: UpdateVisibilityScope) {}

  public static fromString(raw: string): UpdateVisibility {
    const normalized = raw.trim().toLowerCase();
    if (normalized === 'public') {
      return UpdateVisibility.PUBLIC;
    }
    if (normalized === 'supporters_only') {
      return UpdateVisibility.SUPPORTERS_ONLY;
    }
    throw new Error(`Visibilidad no válida: "${raw}". Valores permitidos: public, supporters_only.`);
  }

  public getValue(): UpdateVisibilityScope {
    return this.value;
  }

  public isPublic(): boolean {
    return this.value === 'public';
  }

  public isSupportersOnly(): boolean {
    return this.value === 'supporters_only';
  }
}
