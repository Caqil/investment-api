package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PaymentGateway string
type PaymentStatus string
type Currency string

const (
	PaymentGatewayCoingate   PaymentGateway = "coingate"
	PaymentGatewayUddoktaPay PaymentGateway = "uddoktapay"
	PaymentGatewayManual     PaymentGateway = "manual"

	PaymentStatusPending   PaymentStatus = "pending"
	PaymentStatusCompleted PaymentStatus = "completed"
	PaymentStatusFailed    PaymentStatus = "failed"

	CurrencyUSD Currency = "USD"
	CurrencyBDT Currency = "BDT"
)

type JSON map[string]interface{}

// Value implements the driver.Valuer interface for JSON
func (j JSON) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// Scan implements the sql.Scanner interface for JSON
func (j *JSON) Scan(value interface{}) error {
	if value == nil {
		*j = make(JSON)
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, &j)
}

type Payment struct {
	ID               int64              `json:"id" bson:"id"`
	ObjectID         primitive.ObjectID `json:"-" bson:"_id,omitempty"`
	TransactionID    int64              `json:"transaction_id" bson:"transaction_id"`
	UserID           int64              `json:"user_id" bson:"user_id"`
	Gateway          PaymentGateway     `json:"gateway" bson:"gateway"`
	GatewayReference string             `json:"gateway_reference,omitempty" bson:"gateway_reference,omitempty"`
	Currency         Currency           `json:"currency" bson:"currency"`
	Amount           float64            `json:"amount" bson:"amount"`
	Status           PaymentStatus      `json:"status" bson:"status"`
	Metadata         JSON               `json:"metadata,omitempty" bson:"metadata,omitempty"`
	CreatedAt        time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt        time.Time          `json:"updated_at" bson:"updated_at"`
}

type PaymentResponse struct {
	ID               int64          `json:"id"`
	UserID           int64          `json:"user_id"`
	Gateway          PaymentGateway `json:"gateway"`
	GatewayReference string         `json:"gateway_reference,omitempty"`
	Currency         Currency       `json:"currency"`
	Amount           float64        `json:"amount"`
	Status           PaymentStatus  `json:"status"`
	CreatedAt        time.Time      `json:"created_at"`
}

func (p *Payment) ToResponse() *PaymentResponse {
	return &PaymentResponse{
		ID:               p.ID,
		UserID:           p.UserID,
		Gateway:          p.Gateway,
		GatewayReference: p.GatewayReference,
		Currency:         p.Currency,
		Amount:           p.Amount,
		Status:           p.Status,
		CreatedAt:        p.CreatedAt,
	}
}
