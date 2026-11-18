/**
 * Compatibilidad con features existentes.
 * Mapea variantes legacy (outline/ghost) a tertiary.
 */
import type { ButtonHTMLAttributes, FC, ReactNode } from 'react';
import {
  Button as UiButton,
  type ButtonVariant,
} from './ui/Button/index.ts';

type LegacyVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | ButtonVariant;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: LegacyVariant;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

function mapVariant(variant: LegacyVariant = 'primary'): ButtonVariant {
  if (variant === 'outline' || variant === 'ghost') return 'tertiary';
  return variant;
}

export const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  loading = false,
  size: _ignoredSize,
  ...props
}) => {
  void _ignoredSize;
  return (
    <UiButton variant={mapVariant(variant)} fullWidth={fullWidth} loading={loading} {...props}>
      {children}
    </UiButton>
  );
};
