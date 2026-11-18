import type { ChangeEvent, InputHTMLAttributes } from 'react';
import './Input.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function Input({
  label,
  error,
  helperText,
  id,
  name,
  required,
  disabled,
  className = '',
  ...props
}: InputProps) {
  const inputId = id ?? name;

  return (
    <div className={`brotar-input ${error ? 'brotar-input--error' : ''} ${className}`.trim()}>
      {label ? (
        <label className="brotar-input__label" htmlFor={inputId}>
          {label}
          {required ? <span className="brotar-input__required" aria-hidden="true"> *</span> : null}
        </label>
      ) : null}

      <input
        id={inputId}
        name={name}
        required={required}
        disabled={disabled}
        className="brotar-input__control"
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
        }
        {...props}
      />

      {error ? (
        <p id={`${inputId}-error`} className="brotar-input__error" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="brotar-input__helper">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
