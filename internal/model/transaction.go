package model

import (
	"time"
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
	ID          int64             `json:"id" db:"id"`
	UserID      int64             `json:"user_id" db:"user_id"`
	Amount      float64           `json:"amount" db:"amount"`
	Type        TransactionType   `json:"type" db:"type"`
	Status      TransactionStatus `json:"status" db:"status"`
	ReferenceID string            `json:"reference_id,omitempty" db:"reference_id"`
	Description string            `json:"description,omitempty" db:"description"`
	CreatedAt   time.Time         `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at" db:"updated_at"`
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
