interface KycDocumentEvidence {
  documentFrontUrl?: string | null;
  hasDocumentFront?: boolean;
  kycSubmittedAt?: string | null;
}

/**
 * Submitting KYC always uploads the front image, so its presence is the only
 * reliable evidence: older accounts carry a `kycSubmittedAt` set at sign-up.
 */
export function hasSubmittedKycDocuments(user: KycDocumentEvidence | null | undefined): boolean {
  return Boolean(user?.hasDocumentFront || user?.documentFrontUrl);
}

export function kycSubmittedAtWithEvidence(
  user: KycDocumentEvidence | null | undefined,
): string | null {
  return hasSubmittedKycDocuments(user) ? (user?.kycSubmittedAt ?? null) : null;
}
