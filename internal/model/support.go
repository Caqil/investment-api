package model

import (
	"time"
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
	ID        int64        `json:"id" db:"id"`
	UserID    int64        `json:"user_id" db:"user_id"`
	Subject   string       `json:"subject" db:"subject"`
	Message   string       `json:"message" db:"message"`
	Status    TicketStatus `json:"status" db:"status"`
	CreatedAt time.Time    `json:"created_at" db:"created_at"`
	UpdatedAt time.Time    `json:"updated_at" db:"updated_at"`

	// Populated fields (not from database)
	Messages []*SupportMessage `json:"messages,omitempty" db:"-"`
}

type SupportMessage struct {
	ID         int64      `json:"id" db:"id"`
	TicketID   int64      `json:"ticket_id" db:"ticket_id"`
	SenderType SenderType `json:"sender_type" db:"sender_type"`
	SenderID   int64      `json:"sender_id" db:"sender_id"`
	Message    string     `json:"message" db:"message"`
	CreatedAt  time.Time  `json:"created_at" db:"created_at"`
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
