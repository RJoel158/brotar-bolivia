import { useContext } from 'react';
import { AuthContext } from './auth-context.ts';
import type { AuthContextValue } from './auth-context.types.ts';

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
