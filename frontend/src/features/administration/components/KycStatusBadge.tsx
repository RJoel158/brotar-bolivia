import type { FC } from 'react';
import type { KycStatusType } from '../../../shared/api/usersApi.ts';

export interface KycStatusBadgeProps {
  status: KycStatusType;
}

export const KycStatusBadge: FC<KycStatusBadgeProps> = ({ status }) => {
  const configs: Record<KycStatusType, { label: string; className: string }> = {
    pending: { label: 'Pendiente', className: 'kyc-badge-pending' },
    requires_documentation: { label: 'Requiere más documentación', className: 'kyc-badge-requires-doc' },
    rejected: { label: 'Rechazado', className: 'kyc-badge-rejected' },
    verified: { label: 'Verificado', className: 'kyc-badge-verified' },
  };

  const config = configs[status] || configs.pending;

  return <span className={`kyc-badge ${config.className}`}>{config.label}</span>;
};
