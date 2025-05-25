package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TransactionType string
type TransactionStatus string

const (
	TransactionTypeDeposit        TransactionType = "deposit"
	TransactionTypeWithdrawal     TransactionType = "withdrawal"
	TransactionTypeBonus          TransactionType = "bonus"
	TransactionTypeReferralBonus  TransactionType = "referral_bonus"
	TransactionTypePlanPurchase   TransactionType = "plan_purchase"
	TransactionTypeReferralProfit TransactionType = "referral_profit"

	TransactionStatusPending   TransactionStatus = "pending"
	TransactionStatusCompleted TransactionStatus = "completed"
	TransactionStatusRejected  TransactionStatus = "rejected"
)

type Transaction struct {
	ID          int64              `json:"id" bson:"id"`
	ObjectID    primitive.ObjectID `json:"-" bson:"_id,omitempty"`
	UserID      int64              `json:"user_id" bson:"user_id"`
	Amount      float64            `json:"amount" bson:"amount"`
	Type        TransactionType    `json:"type" bson:"type"`
	Status      TransactionStatus  `json:"status" bson:"status"`
	ReferenceID string             `json:"reference_id,omitempty" bson:"reference_id,omitempty"`
	Description string             `json:"description,omitempty" bson:"description,omitempty"`
	CreatedAt   time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at" bson:"updated_at"`
}

type TransactionResponse struct {
	ID          int64             `json:"id"`
	Amount      float64           `json:"amount"`
	Type        TransactionType   `json:"type"`
	Status      TransactionStatus `json:"status"`
	Description string            `json:"description,omitempty"`
	CreatedAt   time.Time         `json:"created_at"`
}

func (t *Transaction) ToResponse() *TransactionResponse {
	return &TransactionResponse{
		ID:          t.ID,
		Amount:      t.Amount,
		Type:        t.Type,
		Status:      t.Status,
		Description: t.Description,
		CreatedAt:   t.CreatedAt,
	}
}
