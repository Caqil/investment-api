
// src/types/kyc.ts
export type DocumentType = 
  | 'id_card'
  | 'passport'
  | 'driving_license';

export type KYCStatus = 
  | 'pending'
  | 'approved'
  | 'rejected';

export type KYCDocument = {
  id: number;
  user_id: number;
  document_type: DocumentType;
  document_front_url: string;
  document_back_url?: string;
  selfie_url: string;
  status: KYCStatus;
  admin_note?: string;
  created_at: string;
  updated_at: string;
};

export type KYCDocumentResponse = {
  id: number;
  document_type: DocumentType;
  document_front_url: string;
  document_back_url?: string;
  selfie_url: string;
  status: KYCStatus;
  admin_note?: string;
  created_at: string;
};
