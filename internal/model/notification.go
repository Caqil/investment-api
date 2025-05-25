package model

import (
	"time"
)

type NotificationType string

const (
	NotificationTypeWithdrawal NotificationType = "withdrawal"
	NotificationTypeDeposit    NotificationType = "deposit"
	NotificationTypeBonus      NotificationType = "bonus"
	NotificationTypeSystem     NotificationType = "system"
)

type Notification struct {
	ID        int64            `json:"id" db:"id"`
	UserID    int64            `json:"user_id" db:"user_id"`
	Title     string           `json:"title" db:"title"`
	Message   string           `json:"message" db:"message"`
	Type      NotificationType `json:"type" db:"type"`
	IsRead    bool             `json:"is_read" db:"is_read"`
	CreatedAt time.Time        `json:"created_at" db:"created_at"`
	UpdatedAt time.Time        `json:"updated_at" db:"updated_at"`
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
