export interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
  flagLabel: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flagLabel: 'BO (+591)' },
  { code: 'PE', name: 'Perú', dialCode: '+51', flagLabel: 'PE (+51)' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flagLabel: 'AR (+54)' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flagLabel: 'CL (+56)' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flagLabel: 'CO (+57)' },
  { code: 'BR', name: 'Brasil', dialCode: '+55', flagLabel: 'BR (+55)' },
  { code: 'ES', name: 'España', dialCode: '+34', flagLabel: 'ES (+34)' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flagLabel: 'US (+1)' },
  { code: 'MX', name: 'México', dialCode: '+52', flagLabel: 'MX (+52)' },
];

export function parsePhoneValue(value: string): { dialCode: string; localNumber: string } {
  if (!value) {
    return { dialCode: '+591', localNumber: '' };
  }
  const matchedCountry = COUNTRIES.find((c) => value.startsWith(c.dialCode));
  if (matchedCountry) {
    return {
      dialCode: matchedCountry.dialCode,
      localNumber: value.slice(matchedCountry.dialCode.length).trim(),
    };
  }
  return { dialCode: '+591', localNumber: value.trim() };
}
