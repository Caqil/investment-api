package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
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
	ID               int64              `json:"id" bson:"id"`
	ObjectID         primitive.ObjectID `json:"-" bson:"_id,omitempty"`
	UserID           int64              `json:"user_id" bson:"user_id"`
	DocumentType     DocumentType       `json:"document_type" bson:"document_type"`
	DocumentFrontURL string             `json:"document_front_url" bson:"document_front_url"`
	DocumentBackURL  string             `json:"document_back_url,omitempty" bson:"document_back_url,omitempty"`
	SelfieURL        string             `json:"selfie_url" bson:"selfie_url"`
	Status           KYCStatus          `json:"status" bson:"status"`
	AdminNote        string             `json:"admin_note,omitempty" bson:"admin_note,omitempty"`
	CreatedAt        time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt        time.Time          `json:"updated_at" bson:"updated_at"`
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
