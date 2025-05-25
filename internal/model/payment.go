package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
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
	ID               int64          `json:"id" db:"id"`
	TransactionID    int64          `json:"transaction_id" db:"transaction_id"`
	Gateway          PaymentGateway `json:"gateway" db:"gateway"`
	GatewayReference string         `json:"gateway_reference,omitempty" db:"gateway_reference"`
	Currency         Currency       `json:"currency" db:"currency"`
	Amount           float64        `json:"amount" db:"amount"`
	Status           PaymentStatus  `json:"status" db:"status"`
	Metadata         JSON           `json:"metadata,omitempty" db:"metadata"`
	CreatedAt        time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at" db:"updated_at"`
}

type PaymentResponse struct {
	ID               int64          `json:"id"`
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
		Gateway:          p.Gateway,
		GatewayReference: p.GatewayReference,
		Currency:         p.Currency,
		Amount:           p.Amount,
		Status:           p.Status,
		CreatedAt:        p.CreatedAt,
	}
}
