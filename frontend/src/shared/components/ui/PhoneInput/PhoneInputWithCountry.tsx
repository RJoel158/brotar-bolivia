import type { FC, ChangeEvent } from 'react';
import { useState } from 'react';
import { Phone } from 'lucide-react';
import { COUNTRIES, parsePhoneValue } from './phoneConstants.ts';
import './PhoneInputWithCountry.css';

export interface PhoneInputWithCountryProps {
  label?: string;
  value?: string;
  onChange: (fullPhoneNumber: string) => void;
  placeholder?: string;
  required?: boolean;
}

export const PhoneInputWithCountry: FC<PhoneInputWithCountryProps> = ({
  label = 'Teléfono de Contacto',
  value = '',
  onChange,
  placeholder = '71234567',
  required = false,
}) => {
  const initial = parsePhoneValue(value);
  const [syncedValue, setSyncedValue] = useState(value);
  const [selectedDialCode, setSelectedDialCode] = useState(initial.dialCode);
  const [localNumber, setLocalNumber] = useState(initial.localNumber);

  if (value !== syncedValue) {
    setSyncedValue(value);
    if (!value) {
      setLocalNumber('');
    } else {
      const matchedCountry = COUNTRIES.find((c) => value.startsWith(c.dialCode));
      if (matchedCountry) {
        setSelectedDialCode(matchedCountry.dialCode);
        setLocalNumber(value.slice(matchedCountry.dialCode.length).trim());
      } else {
        setLocalNumber(value.trim());
      }
    }
  }

  const handleCountryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const dial = e.target.value;
    setSelectedDialCode(dial);
    const combined = localNumber.trim() ? `${dial} ${localNumber.trim()}` : '';
    onChange(combined);
  };

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^0-9\s-]/g, '');
    setLocalNumber(clean);
    const combined = clean.trim() ? `${selectedDialCode} ${clean.trim()}` : '';
    onChange(combined);
  };

  return (
    <div className="brotar-phone-input-wrapper">
      {label && (
        <label className="phone-input-label">
          <Phone size={14} />
          <span>{label}</span>
          {required && <span className="req">*</span>}
        </label>
      )}

      <div className="phone-input-combo">
        <select
          className="phone-country-select"
          value={selectedDialCode}
          onChange={handleCountryChange}
          aria-label="Prefijo de país"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.dialCode}>
              {c.flagLabel} - {c.name}
            </option>
          ))}
        </select>

        <input
          type="tel"
          className="phone-local-input"
          placeholder={placeholder}
          value={localNumber}
          onChange={handleNumberChange}
          required={required}
        />
      </div>
    </div>
  );
};
