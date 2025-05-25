package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type News struct {
	ID          int64              `json:"id" bson:"id"`
	ObjectID    primitive.ObjectID `json:"-" bson:"_id,omitempty"`
	Title       string             `json:"title" bson:"title"`
	Content     string             `json:"content" bson:"content"`
	ImageURL    string             `json:"image_url,omitempty" bson:"image_url,omitempty"`
	IsPublished bool               `json:"is_published" bson:"is_published"`
	CreatedAt   time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at" bson:"updated_at"`
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
