package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type FAQ struct {
	ID          int64              `json:"id" bson:"id"`
	ObjectID    primitive.ObjectID `json:"-" bson:"_id,omitempty"`
	Question    string             `json:"question" bson:"question"`
	Answer      string             `json:"answer" bson:"answer"`
	OrderNumber int                `json:"order_number" bson:"order_number"`
	CreatedAt   time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at" bson:"updated_at"`
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
