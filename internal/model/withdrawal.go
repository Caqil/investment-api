package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type WithdrawalStatus string

const (
	WithdrawalStatusPending  WithdrawalStatus = "pending"
	WithdrawalStatusApproved WithdrawalStatus = "approved"
	WithdrawalStatusRejected WithdrawalStatus = "rejected"
)

// PaymentDetails holds payment method specific information
type PaymentDetails map[string]interface{}

// Value implements the driver.Valuer interface for JSON
func (p PaymentDetails) Value() (driver.Value, error) {
	if p == nil {
		return nil, nil
	}
	return json.Marshal(p)
}

// Scan implements the sql.Scanner interface for JSON
func (p *PaymentDetails) Scan(value interface{}) error {
	if value == nil {
		*p = make(PaymentDetails)
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, &p)
}

type Withdrawal struct {
	ID             int64              `json:"id" bson:"id"`
	ObjectID       primitive.ObjectID `json:"-" bson:"_id,omitempty"`
	TransactionID  int64              `json:"transaction_id" bson:"transaction_id"`
	UserID         int64              `json:"user_id" bson:"user_id"`
	Amount         float64            `json:"amount" bson:"amount"`
	PaymentMethod  string             `json:"payment_method" bson:"payment_method"`
	PaymentDetails PaymentDetails     `json:"payment_details" bson:"payment_details"`
	Status         WithdrawalStatus   `json:"status" bson:"status"`
	AdminNote      string             `json:"admin_note,omitempty" bson:"admin_note,omitempty"`
	TasksCompleted bool               `json:"tasks_completed" bson:"tasks_completed"`
	CreatedAt      time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt      time.Time          `json:"updated_at" bson:"updated_at"`
}

type WithdrawalResponse struct {
	ID             int64            `json:"id"`
	Amount         float64          `json:"amount"`
	PaymentMethod  string           `json:"payment_method"`
	PaymentDetails PaymentDetails   `json:"payment_details"`
	Status         WithdrawalStatus `json:"status"`
	AdminNote      string           `json:"admin_note,omitempty"`
	TasksCompleted bool             `json:"tasks_completed"`
	CreatedAt      time.Time        `json:"created_at"`
}

func (w *Withdrawal) ToResponse() *WithdrawalResponse {
	return &WithdrawalResponse{
		ID:             w.ID,
		Amount:         w.Amount,
		PaymentMethod:  w.PaymentMethod,
		PaymentDetails: w.PaymentDetails,
		Status:         w.Status,
		AdminNote:      w.AdminNote,
		TasksCompleted: w.TasksCompleted,
		CreatedAt:      w.CreatedAt,
	}
}
