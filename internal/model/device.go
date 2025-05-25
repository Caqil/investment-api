package model

import (
	"time"
)

type Device struct {
	ID          int64      `json:"id" db:"id"`
	UserID      int64      `json:"user_id" db:"user_id"`
	DeviceID    string     `json:"device_id" db:"device_id"`
	DeviceName  string     `json:"device_name,omitempty" db:"device_name"`
	DeviceModel string     `json:"device_model,omitempty" db:"device_model"`
	LastLogin   *time.Time `json:"last_login,omitempty" db:"last_login"`
	IsActive    bool       `json:"is_active" db:"is_active"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
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
