package model

import (
	"time"
)

type News struct {
	ID          int64     `json:"id" db:"id"`
	Title       string    `json:"title" db:"title"`
	Content     string    `json:"content" db:"content"`
	ImageURL    string    `json:"image_url,omitempty" db:"image_url"`
	IsPublished bool      `json:"is_published" db:"is_published"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type NewsResponse struct {
	ID        int64     `json:"id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	ImageURL  string    `json:"image_url,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

func (n *News) ToResponse() *NewsResponse {
	return &NewsResponse{
		ID:        n.ID,
		Title:     n.Title,
		Content:   n.Content,
		ImageURL:  n.ImageURL,
		CreatedAt: n.CreatedAt,
	}
}
