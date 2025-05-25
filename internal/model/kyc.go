package model

import (
	"time"
)

type DocumentType string
type KYCStatus string

const (
	DocumentTypeIDCard         DocumentType = "id_card"
	DocumentTypePassport       DocumentType = "passport"
	DocumentTypeDrivingLicense DocumentType = "driving_license"

	KYCStatusPending  KYCStatus = "pending"
	KYCStatusApproved KYCStatus = "approved"
	KYCStatusRejected KYCStatus = "rejected"
)

type KYCDocument struct {
	ID               int64        `json:"id" db:"id"`
	UserID           int64        `json:"user_id" db:"user_id"`
	DocumentType     DocumentType `json:"document_type" db:"document_type"`
	DocumentFrontURL string       `json:"document_front_url" db:"document_front_url"`
	DocumentBackURL  string       `json:"document_back_url,omitempty" db:"document_back_url"`
	SelfieURL        string       `json:"selfie_url" db:"selfie_url"`
	Status           KYCStatus    `json:"status" db:"status"`
	AdminNote        string       `json:"admin_note,omitempty" db:"admin_note"`
	CreatedAt        time.Time    `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time    `json:"updated_at" db:"updated_at"`
}

type KYCDocumentResponse struct {
	ID               int64        `json:"id"`
	DocumentType     DocumentType `json:"document_type"`
	DocumentFrontURL string       `json:"document_front_url"`
	DocumentBackURL  string       `json:"document_back_url,omitempty"`
	SelfieURL        string       `json:"selfie_url"`
	Status           KYCStatus    `json:"status"`
	AdminNote        string       `json:"admin_note,omitempty"`
	CreatedAt        time.Time    `json:"created_at"`
}

func (k *KYCDocument) ToResponse() *KYCDocumentResponse {
	return &KYCDocumentResponse{
		ID:               k.ID,
		DocumentType:     k.DocumentType,
		DocumentFrontURL: k.DocumentFrontURL,
		DocumentBackURL:  k.DocumentBackURL,
		SelfieURL:        k.SelfieURL,
		Status:           k.Status,
		AdminNote:        k.AdminNote,
		CreatedAt:        k.CreatedAt,
	}
}
