package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID               int64              `json:"id" bson:"id"`
	ObjectID         primitive.ObjectID `json:"-" bson:"_id,omitempty"`
	Name             string             `json:"name" bson:"name"`
	Email            string             `json:"email" bson:"email"`
	PasswordHash     string             `json:"-" bson:"password_hash"`
	Phone            string             `json:"phone" bson:"phone"`
	Balance          float64            `json:"balance" bson:"balance"`
	ReferralCode     string             `json:"referral_code" bson:"referral_code"`
	ReferredBy       *int64             `json:"referred_by,omitempty" bson:"referred_by,omitempty"`
	PlanID           int64              `json:"plan_id" bson:"plan_id"`
	IsKYCVerified    bool               `json:"is_kyc_verified" bson:"is_kyc_verified"`
	EmailVerified    bool               `json:"email_verified" bson:"email_verified"`
	IsAdmin          bool               `json:"is_admin,omitempty" bson:"is_admin"`
	IsBlocked        bool               `json:"is_blocked" bson:"is_blocked"`
	BiometricEnabled bool               `json:"biometric_enabled" bson:"biometric_enabled"`
	ProfilePicURL    string             `json:"profile_pic_url" bson:"profile_pic_url"`
	CreatedAt        time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt        time.Time          `json:"updated_at" bson:"updated_at"`
}

type UserResponse struct {
	ID               int64     `json:"id"`
	Name             string    `json:"name"`
	Email            string    `json:"email"`
	Phone            string    `json:"phone"`
	Balance          float64   `json:"balance"`
	ReferralCode     string    `json:"referral_code"`
	IsKYCVerified    bool      `json:"is_kyc_verified"`
	BiometricEnabled bool      `json:"biometric_enabled"`
	ProfilePicURL    string    `json:"profile_pic_url"`
	CreatedAt        time.Time `json:"created_at"`
}

func (u *User) ToResponse() *UserResponse {
	return &UserResponse{
		ID:               u.ID,
		Name:             u.Name,
		Email:            u.Email,
		Phone:            u.Phone,
		Balance:          u.Balance,
		ReferralCode:     u.ReferralCode,
		IsKYCVerified:    u.IsKYCVerified,
		BiometricEnabled: u.BiometricEnabled,
		ProfilePicURL:    u.ProfilePicURL,
		CreatedAt:        u.CreatedAt,
	}
}
