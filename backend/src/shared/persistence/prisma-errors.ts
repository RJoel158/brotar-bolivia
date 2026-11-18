import { ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

const PERMISSION_DENIED = /permission denied for (?:table|relation|sequence)\s+"?(\w+)"?/i;
const MISSING_RELATION = /relation\s+"?(?:public\.)?(\w+)"?\s+does not exist/i;

function errorMeta(error: unknown): Record<string, unknown> {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return (error.meta ?? {}) as Record<string, unknown>;
  }
  return {};
}

/**
 * Turns a missing table or missing grants into a 503 that names the table, so
 * the API never answers as if the data were simply empty. Other errors are
 * returned unchanged for the caller to rethrow. Model queries report a missing
 * table as P2021; raw queries surface the PostgreSQL code in the message.
 */
export function toPersistenceUnavailable(error: unknown): unknown {
  const meta = errorMeta(error);
  const message = error instanceof Error ? error.message : '';

  const missing =
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021'
      ? String(meta.table ?? 'requerida')
      : MISSING_RELATION.exec(message)?.[1];
  if (missing) {
    return new ServiceUnavailableException(
      `La tabla ${missing} no existe en la base de datos. El DB Master debe aplicar el SQL pendiente.`,
    );
  }

  const denied = PERMISSION_DENIED.exec(message)?.[1];
  if (denied || meta.code === '42501') {
    return new ServiceUnavailableException(
      `El usuario de base de datos no tiene permisos sobre la tabla ${denied ?? 'requerida'}. Debe concederlos su propietario.`,
    );
  }

  return error;
}
