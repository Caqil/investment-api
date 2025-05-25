package model

import (
	"time"
)

type FAQ struct {
	ID          int64     `json:"id" db:"id"`
	Question    string    `json:"question" db:"question"`
	Answer      string    `json:"answer" db:"answer"`
	OrderNumber int       `json:"order_number" db:"order_number"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type FAQResponse struct {
	ID          int64  `json:"id"`
	Question    string `json:"question"`
	Answer      string `json:"answer"`
	OrderNumber int    `json:"order_number"`
}

func (f *FAQ) ToResponse() *FAQResponse {
	return &FAQResponse{
		ID:          f.ID,
		Question:    f.Question,
		Answer:      f.Answer,
		OrderNumber: f.OrderNumber,
	}
}
