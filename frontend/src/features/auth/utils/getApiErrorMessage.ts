import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return error.code === 'ECONNABORTED'
        ? 'El servidor tardó demasiado en responder. Intenta nuevamente.'
        : 'No pudimos conectar con el servidor. Revisa tu conexión e intenta nuevamente.';
    }
    if (error.response.status === 429) {
      return 'Has realizado demasiados intentos. Espera un minuto e intenta nuevamente.';
    }
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }
    if (Array.isArray(data?.message) && data.message.length > 0) {
      return data.message.join(', ');
    }
    if (error.response?.status === 401) {
      return 'Correo o contraseña incorrectos';
    }
    if (error.response?.status === 409) {
      return 'Ya existe una cuenta con ese correo';
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
