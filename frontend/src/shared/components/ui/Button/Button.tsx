import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  type = 'button',
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={[
        'brotar-btn',
        `brotar-btn--${variant}`,
        fullWidth ? 'brotar-btn--full' : '',
        loading ? 'brotar-btn--loading' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className="brotar-btn__spinner" aria-hidden="true" /> : null}
      <span className={`brotar-btn__content ${loading ? 'brotar-btn__label--hidden' : ''}`}>
        {children}
      </span>
    </button>
  );
}
