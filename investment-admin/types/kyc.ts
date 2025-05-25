export enum DocumentType {
    ID_CARD = "id_card",
    PASSPORT = "passport",
    DRIVING_LICENSE = "driving_license"
  }
  
  export enum KYCStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
  }
  
  export interface KYCDocument {
    id: number;
    user_id: number;
    document_type: DocumentType;
    document_front_url: string;
    document_back_url?: string;
    selfie_url: string;
    status: KYCStatus;
    admin_note?: string;
    created_at: string;
  }