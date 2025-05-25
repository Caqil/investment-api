package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TicketStatus string
type SenderType string

const (
	TicketStatusOpen       TicketStatus = "open"
	TicketStatusInProgress TicketStatus = "in_progress"
	TicketStatusClosed     TicketStatus = "closed"

	SenderTypeUser  SenderType = "user"
	SenderTypeAdmin SenderType = "admin"
)

type SupportTicket struct {
	ID        int64              `json:"id" bson:"id"`
	ObjectID  primitive.ObjectID `json:"-" bson:"_id,omitempty"`
	UserID    int64              `json:"user_id" bson:"user_id"`
	Subject   string             `json:"subject" bson:"subject"`
	Message   string             `json:"message" bson:"message"`
	Status    TicketStatus       `json:"status" bson:"status"`
	CreatedAt time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`

	// Populated fields (not from database)
	Messages []*SupportMessage `json:"messages,omitempty" bson:"-"`
}

type SupportMessage struct {
	ID         int64              `json:"id" bson:"id"`
	ObjectID   primitive.ObjectID `json:"-" bson:"_id,omitempty"`
	TicketID   int64              `json:"ticket_id" bson:"ticket_id"`
	SenderType SenderType         `json:"sender_type" bson:"sender_type"`
	SenderID   int64              `json:"sender_id" bson:"sender_id"`
	Message    string             `json:"message" bson:"message"`
	CreatedAt  time.Time          `json:"created_at" bson:"created_at"`
}

type SupportTicketResponse struct {
	ID        int64                     `json:"id"`
	Subject   string                    `json:"subject"`
	Message   string                    `json:"message"`
	Status    TicketStatus              `json:"status"`
	CreatedAt time.Time                 `json:"created_at"`
	Messages  []*SupportMessageResponse `json:"messages,omitempty"`
}

type SupportMessageResponse struct {
	ID         int64      `json:"id"`
	SenderType SenderType `json:"sender_type"`
	Message    string     `json:"message"`
	CreatedAt  time.Time  `json:"created_at"`
}

func (t *SupportTicket) ToResponse() *SupportTicketResponse {
	resp := &SupportTicketResponse{
		ID:        t.ID,
		Subject:   t.Subject,
		Message:   t.Message,
		Status:    t.Status,
		CreatedAt: t.CreatedAt,
	}

	if t.Messages != nil {
		messages := make([]*SupportMessageResponse, 0, len(t.Messages))
		for _, msg := range t.Messages {
			messages = append(messages, msg.ToResponse())
		}
		resp.Messages = messages
	}

	return resp
}

func (m *SupportMessage) ToResponse() *SupportMessageResponse {
	return &SupportMessageResponse{
		ID:         m.ID,
		SenderType: m.SenderType,
		Message:    m.Message,
		CreatedAt:  m.CreatedAt,
	}
}
