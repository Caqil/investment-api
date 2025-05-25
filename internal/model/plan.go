package model

import (
	"time"
)

type Plan struct {
	ID                   int64     `json:"id" db:"id"`
	Name                 string    `json:"name" db:"name"`
	DailyDepositLimit    float64   `json:"daily_deposit_limit" db:"daily_deposit_limit"`
	DailyWithdrawalLimit float64   `json:"daily_withdrawal_limit" db:"daily_withdrawal_limit"`
	DailyProfitLimit     float64   `json:"daily_profit_limit" db:"daily_profit_limit"`
	Price                float64   `json:"price" db:"price"`
	IsDefault            bool      `json:"is_default" db:"is_default"`
	CreatedAt            time.Time `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time `json:"updated_at" db:"updated_at"`
}

type PlanResponse struct {
	ID                   int64   `json:"id"`
	Name                 string  `json:"name"`
	DailyDepositLimit    float64 `json:"daily_deposit_limit"`
	DailyWithdrawalLimit float64 `json:"daily_withdrawal_limit"`
	DailyProfitLimit     float64 `json:"daily_profit_limit"`
	Price                float64 `json:"price"`
	IsDefault            bool    `json:"is_default"`
}

func (p *Plan) ToResponse() *PlanResponse {
	return &PlanResponse{
		ID:                   p.ID,
		Name:                 p.Name,
		DailyDepositLimit:    p.DailyDepositLimit,
		DailyWithdrawalLimit: p.DailyWithdrawalLimit,
		DailyProfitLimit:     p.DailyProfitLimit,
		Price:                p.Price,
		IsDefault:            p.IsDefault,
	}
}
