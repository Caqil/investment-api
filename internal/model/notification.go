package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type NotificationType string

const (
	NotificationTypeWithdrawal NotificationType = "withdrawal"
	NotificationTypeDeposit    NotificationType = "deposit"
	NotificationTypeBonus      NotificationType = "bonus"
	NotificationTypeSystem     NotificationType = "system"
)

type Notification struct {
	ID        int64              `json:"id" bson:"id"`
	ObjectID  primitive.ObjectID `json:"-" bson:"_id,omitempty"`
	UserID    int64              `json:"user_id" bson:"user_id"`
	Title     string             `json:"title" bson:"title"`
	Message   string             `json:"message" bson:"message"`
	Type      NotificationType   `json:"type" bson:"type"`
	IsRead    bool               `json:"is_read" bson:"is_read"`
	CreatedAt time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
}

type NotificationResponse struct {
	ID        int64            `json:"id"`
	Title     string           `json:"title"`
	Message   string           `json:"message"`
	Type      NotificationType `json:"type"`
	IsRead    bool             `json:"is_read"`
	CreatedAt time.Time        `json:"created_at"`
}

func (n *Notification) ToResponse() *NotificationResponse {
	return &NotificationResponse{
		ID:        n.ID,
		Title:     n.Title,
		Message:   n.Message,
		Type:      n.Type,
		IsRead:    n.IsRead,
		CreatedAt: n.CreatedAt,
	}
}
