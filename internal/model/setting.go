package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// SettingType defines the data type of a setting
type SettingType string

const (
	SettingTypeString  SettingType = "string"
	SettingTypeNumber  SettingType = "number"
	SettingTypeBoolean SettingType = "boolean"
)

// Setting represents a system setting
type Setting struct {
	ID          int64              `json:"id" bson:"id"`
	ObjectID    primitive.ObjectID `json:"-" bson:"_id,omitempty"`
	Key         string             `json:"key" bson:"key"`
	Value       string             `json:"value" bson:"value"`
	Type        SettingType        `json:"type" bson:"type"`
	DisplayName string             `json:"display_name" bson:"display_name"`
	Description string             `json:"description" bson:"description"`
	Group       string             `json:"group" bson:"group"`
	CreatedAt   time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at" bson:"updated_at"`
}

// SettingResponse is the response object for settings
type SettingResponse struct {
	ID          int64       `json:"id"`
	Key         string      `json:"key"`
	Value       string      `json:"value"`
	Type        SettingType `json:"type"`
	DisplayName string      `json:"display_name"`
	Description string      `json:"description"`
	Group       string      `json:"group"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

// ToResponse converts a Setting to a SettingResponse
func (s *Setting) ToResponse() *SettingResponse {
	return &SettingResponse{
		ID:          s.ID,
		Key:         s.Key,
		Value:       s.Value,
		Type:        s.Type,
		DisplayName: s.DisplayName,
		Description: s.Description,
		Group:       s.Group,
		UpdatedAt:   s.UpdatedAt,
	}
}
