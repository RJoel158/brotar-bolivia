import type { FC, ChangeEvent } from 'react';
import { useState } from 'react';
import { FileCheck2 } from 'lucide-react';
import {
  BOLIVIAN_DEPARTMENTS,
  FOREIGN_PREFIXES,
  parseDocumentFields,
} from './documentConstants.ts';
import './DocumentInput.css';

export interface DocumentInputProps {
  documentType: string;
  onDocumentTypeChange: (type: string) => void;
  documentId: string;
  onDocumentIdChange: (fullDocumentId: string) => void;
  label?: string;
  required?: boolean;
}

export const DocumentInput: FC<DocumentInputProps> = ({
  documentType,
  onDocumentTypeChange,
  documentId,
  onDocumentIdChange,
  label = 'Documento de Identificación',
  required = false,
}) => {
  const initial = parseDocumentFields(documentId, documentType);
  const [syncedDocumentId, setSyncedDocumentId] = useState(documentId);
  const [syncedDocumentType, setSyncedDocumentType] = useState(documentType);
  const [docNumber, setDocNumber] = useState(initial.docNumber);
  const [ciExtension, setCiExtension] = useState(initial.ciExtension);
  const [foreignPrefix, setForeignPrefix] = useState(initial.foreignPrefix);

  if (documentId !== syncedDocumentId || documentType !== syncedDocumentType) {
    setSyncedDocumentId(documentId);
    setSyncedDocumentType(documentType);

    if (!documentId) {
      setDocNumber('');
    } else if (documentType === 'CI') {
      const parts = documentId.replace(/^CI\s*/i, '').trim().split(/\s+/);
      if (parts.length >= 2) {
        const lastPart = parts[parts.length - 1].toUpperCase();
        if (BOLIVIAN_DEPARTMENTS.some((d) => d.code === lastPart)) {
          setCiExtension(lastPart);
          setDocNumber(parts.slice(0, -1).join(' '));
        } else {
          setDocNumber(documentId.replace(/^CI\s*/i, '').trim());
        }
      } else {
        setDocNumber(documentId.replace(/^CI\s*/i, '').trim());
      }
    } else if (documentType === 'NIT') {
      setDocNumber(documentId.replace(/^NIT\s*/i, '').trim());
    } else if (documentType === 'PASSPORT') {
      const matched = FOREIGN_PREFIXES.find((p) => documentId.startsWith(p.code));
      if (matched) {
        setForeignPrefix(matched.code);
        setDocNumber(documentId.slice(matched.code.length).trim());
      } else {
        setDocNumber(documentId.trim());
      }
    }
  }

  const updateOutput = (type: string, number: string, ext: string, fPrefix: string) => {
    const cleanNum = number.trim();
    if (!cleanNum) {
      onDocumentIdChange('');
      return;
    }

    if (type === 'CI') {
      onDocumentIdChange(`CI ${cleanNum} ${ext}`);
    } else if (type === 'NIT') {
      onDocumentIdChange(`NIT ${cleanNum}`);
    } else if (type === 'PASSPORT') {
      onDocumentIdChange(`${fPrefix} ${cleanNum}`);
    }
  };

  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    onDocumentTypeChange(newType);
    updateOutput(newType, docNumber, ciExtension, foreignPrefix);
  };

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDocNumber(val);
    updateOutput(documentType, val, ciExtension, foreignPrefix);
  };

  const handleCiExtensionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const ext = e.target.value;
    setCiExtension(ext);
    updateOutput(documentType, docNumber, ext, foreignPrefix);
  };

  const handleForeignPrefixChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const pref = e.target.value;
    setForeignPrefix(pref);
    updateOutput(documentType, docNumber, ciExtension, pref);
  };

  return (
    <div className="brotar-document-input-wrapper">
      <label className="document-input-label">
        <FileCheck2 size={14} />
        <span>{label}</span>
        {required && <span className="req">*</span>}
      </label>

      <div className="document-input-fields-grid">
        <div className="doc-type-column">
          <select
            className="doc-select-input"
            value={documentType}
            onChange={handleTypeChange}
            aria-label="Tipo de documento"
          >
            <option value="CI">Cédula de Identidad (CI)</option>
            <option value="NIT">NIT (Empresa / ONG)</option>
            <option value="PASSPORT">Extranjero / Pasaporte</option>
          </select>
        </div>

        <div className="doc-number-column">
          <div className="doc-number-combo">
            {documentType === 'PASSPORT' && (
              <select
                className="doc-prefix-select"
                value={foreignPrefix}
                onChange={handleForeignPrefixChange}
                aria-label="Prefijo de documento extranjero"
              >
                {FOREIGN_PREFIXES.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code}
                  </option>
                ))}
              </select>
            )}

            <input
              type="text"
              className="doc-text-input"
              placeholder={
                documentType === 'NIT'
                  ? 'Ej. 1029384756'
                  : documentType === 'PASSPORT'
                  ? 'Número de Pasaporte'
                  : 'Ej. 14780462'
              }
              value={docNumber}
              onChange={handleNumberChange}
              required={required}
            />

            {documentType === 'CI' && (
              <select
                className="doc-ext-select"
                value={ciExtension}
                onChange={handleCiExtensionChange}
                aria-label="Departamento de expedición CI"
                title="Departamento de expedición"
              >
                {BOLIVIAN_DEPARTMENTS.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
