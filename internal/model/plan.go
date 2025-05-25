package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Plan struct {
	ID                   int64              `json:"id" bson:"id"`
	ObjectID             primitive.ObjectID `json:"-" bson:"_id,omitempty"`
	Name                 string             `json:"name" bson:"name"`
	DailyDepositLimit    float64            `json:"daily_deposit_limit" bson:"daily_deposit_limit"`
	DailyWithdrawalLimit float64            `json:"daily_withdrawal_limit" bson:"daily_withdrawal_limit"`
	DailyProfitLimit     float64            `json:"daily_profit_limit" bson:"daily_profit_limit"`
	Price                float64            `json:"price" bson:"price"`
	IsDefault            bool               `json:"is_default" bson:"is_default"`
	CreatedAt            time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt            time.Time          `json:"updated_at" bson:"updated_at"`
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
