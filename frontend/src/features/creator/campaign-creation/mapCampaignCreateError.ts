import axios from 'axios';

function backendMessage(data: unknown): string | null {
  const message = (data as { message?: unknown } | undefined)?.message;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }
  if (Array.isArray(message)) {
    const parts = message.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    return parts.length > 0 ? parts.join(' ') : null;
  }
  return null;
}

/**
 * Reward save/load errors. A 409 is a state conflict (contributions, campaign
 * type, duplicate id), not a sold-out slot. A 503 is persistence unavailable.
 */
export function mapRewardPersistenceError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = backendMessage(error.response?.data);

    if (status === 503) {
      return (
        message ??
        'El servicio no está disponible en este momento. Intenta más tarde. Esto no significa que la recompensa se haya agotado.'
      );
    }
    if (status === 409) {
      return (
        message ??
        'No se pudo guardar la recompensa porque entra en conflicto con su estado actual. Si ya tiene aportes, no se puede editar ni eliminar.'
      );
    }
    if (status === 400) {
      return message ?? 'Revisa los datos de la recompensa.';
    }
    if (status === 403) {
      return message ?? 'Tu cuenta no tiene permiso para modificar estas recompensas.';
    }
    if (status === 404) {
      return message ?? 'La recompensa o la campaña ya no está disponible.';
    }
    if (message) {
      return message;
    }
  }

  return 'No se pudieron guardar las recompensas. Tus cambios siguen en el asistente.';
}

export function mapCampaignCreateError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 401) {
      return 'Tu sesión no es válida o expiró.';
    }
    if (status === 403) {
      return 'Tu cuenta no tiene permiso para realizar esta acción.';
    }
    if (status === 404) {
      return 'La campaña no se encontró.';
    }
    if (status === 409) {
      return backendMessage(error.response?.data) ?? 'Esta campaña ya no se puede editar.';
    }
    if (status === 400) {
      return 'Revisa la información ingresada.';
    }
    if (status === 503) {
      return (
        backendMessage(error.response?.data) ??
        'El servicio no está disponible en este momento. Intenta más tarde.'
      );
    }
  }

  return 'No se pudo guardar la campaña. Intenta nuevamente.';
}
