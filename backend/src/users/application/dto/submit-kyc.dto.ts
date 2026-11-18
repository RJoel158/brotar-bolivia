export interface SubmitKycDto {
  documentId: string;
  documentType: string;
  organizationName?: string;
  phone?: string;
  documentFrontUrl: string;
  documentBackUrl?: string;
}
