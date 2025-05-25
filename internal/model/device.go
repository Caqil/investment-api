package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Device struct {
	ID          int64              `json:"id" bson:"id"`
	ObjectID    primitive.ObjectID `json:"-" bson:"_id,omitempty"`
	UserID      int64              `json:"user_id" bson:"user_id"`
	DeviceID    string             `json:"device_id" bson:"device_id"`
	DeviceName  string             `json:"device_name,omitempty" bson:"device_name,omitempty"`
	DeviceModel string             `json:"device_model,omitempty" bson:"device_model,omitempty"`
	LastLogin   *time.Time         `json:"last_login,omitempty" bson:"last_login,omitempty"`
	IsActive    bool               `json:"is_active" bson:"is_active"`
	CreatedAt   time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at" bson:"updated_at"`
}

type DeviceResponse struct {
	ID          int64      `json:"id"`
	DeviceID    string     `json:"device_id"`
	DeviceName  string     `json:"device_name,omitempty"`
	DeviceModel string     `json:"device_model,omitempty"`
	LastLogin   *time.Time `json:"last_login,omitempty"`
	IsActive    bool       `json:"is_active"`
	CreatedAt   time.Time  `json:"created_at"`
}

func (d *Device) ToResponse() *DeviceResponse {
	return &DeviceResponse{
		ID:          d.ID,
		DeviceID:    d.DeviceID,
		DeviceName:  d.DeviceName,
		DeviceModel: d.DeviceModel,
		LastLogin:   d.LastLogin,
		IsActive:    d.IsActive,
		CreatedAt:   d.CreatedAt,
	}
}
