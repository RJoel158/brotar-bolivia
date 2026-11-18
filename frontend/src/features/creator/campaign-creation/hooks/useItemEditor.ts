import { useCallback, useState } from 'react';
import { hasErrors, type FormErrors } from '../planningValidation.ts';

export interface ItemEditor<T extends object> {
  values: T;
  errors: FormErrors<T>;
  editingId: string | null;
  setField: <K extends keyof T>(key: K, value: T[K]) => void;
  startEdit: (id: string, values: T) => void;
  reset: () => void;
  submit: (onValid: (values: T, editingId: string | null) => void) => void;
}

export function useItemEditor<T extends object>(
  emptyValues: T,
  validate: (values: T) => FormErrors<T>,
): ItemEditor<T> {
  const [values, setValues] = useState<T>(emptyValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  }, []);

  const reset = useCallback(() => {
    setValues(emptyValues);
    setErrors({});
    setEditingId(null);
  }, [emptyValues]);

  const startEdit = useCallback((id: string, nextValues: T) => {
    setValues(nextValues);
    setErrors({});
    setEditingId(id);
  }, []);

  const submit = (onValid: (values: T, editingId: string | null) => void) => {
    const nextErrors = validate(values);
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }
    onValid(values, editingId);
    reset();
  };

  return { values, errors, editingId, setField, startEdit, reset, submit };
}
