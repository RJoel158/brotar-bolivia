export interface DepartmentOption {
  code: string;
  name: string;
}

export const BOLIVIAN_DEPARTMENTS: DepartmentOption[] = [
  { code: 'LP', name: 'La Paz (LP)' },
  { code: 'CB', name: 'Cochabamba (CB)' },
  { code: 'SC', name: 'Santa Cruz (SC)' },
  { code: 'OR', name: 'Oruro (OR)' },
  { code: 'PT', name: 'Potosí (PT)' },
  { code: 'TJ', name: 'Tarija (TJ)' },
  { code: 'CH', name: 'Chuquisaca (CH)' },
  { code: 'BN', name: 'Beni (BN)' },
  { code: 'PA', name: 'Pando (PA)' },
];

export const FOREIGN_PREFIXES = [
  { code: 'EXT', label: 'Extranjero (EXT)' },
  { code: 'PAS-ARG', label: 'Pasaporte Argentina' },
  { code: 'PAS-PER', label: 'Pasaporte Perú' },
  { code: 'PAS-BRA', label: 'Pasaporte Brasil' },
  { code: 'PAS-CHI', label: 'Pasaporte Chile' },
  { code: 'PAS-ESP', label: 'Pasaporte España' },
  { code: 'PAS-USA', label: 'Pasaporte EE.UU.' },
  { code: 'EXT-OTRO', label: 'Otro Documento Extranjero' },
];

export interface ParsedDocumentFields {
  docNumber: string;
  ciExtension: string;
  foreignPrefix: string;
}

export function parseDocumentFields(
  documentId: string,
  documentType: string,
): ParsedDocumentFields {
  if (!documentId) {
    return { docNumber: '', ciExtension: 'LP', foreignPrefix: 'EXT' };
  }

  if (documentType === 'CI') {
    const parts = documentId.replace(/^CI\s*/i, '').trim().split(/\s+/);
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1].toUpperCase();
      if (BOLIVIAN_DEPARTMENTS.some((d) => d.code === lastPart)) {
        return {
          docNumber: parts.slice(0, -1).join(' '),
          ciExtension: lastPart,
          foreignPrefix: 'EXT',
        };
      }
    }
    return {
      docNumber: documentId.replace(/^CI\s*/i, '').trim(),
      ciExtension: 'LP',
      foreignPrefix: 'EXT',
    };
  }

  if (documentType === 'NIT') {
    return {
      docNumber: documentId.replace(/^NIT\s*/i, '').trim(),
      ciExtension: 'LP',
      foreignPrefix: 'EXT',
    };
  }

  if (documentType === 'PASSPORT') {
    const matched = FOREIGN_PREFIXES.find((p) => documentId.startsWith(p.code));
    if (matched) {
      return {
        docNumber: documentId.slice(matched.code.length).trim(),
        ciExtension: 'LP',
        foreignPrefix: matched.code,
      };
    }
    return {
      docNumber: documentId.trim(),
      ciExtension: 'LP',
      foreignPrefix: 'EXT',
    };
  }

  return { docNumber: documentId.trim(), ciExtension: 'LP', foreignPrefix: 'EXT' };
}
