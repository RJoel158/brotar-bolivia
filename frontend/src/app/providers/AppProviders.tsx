import type { FC, ReactNode } from 'react';
import { AuthProvider } from '../../features/auth/context/AuthContext.tsx';
import { ToastProvider } from '../../shared/context/ToastContext.tsx';

export interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders: FC<AppProvidersProps> = ({ children }) => {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  );
};
