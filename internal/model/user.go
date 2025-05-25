package model

import (
	"time"
)

type User struct {
	ID               int64     `json:"id" db:"id"`
	Name             string    `json:"name" db:"name"`
	Email            string    `json:"email" db:"email"`
	PasswordHash     string    `json:"-" db:"password_hash"`
	Phone            string    `json:"phone" db:"phone"`
	Balance          float64   `json:"balance" db:"balance"`
	ReferralCode     string    `json:"referral_code" db:"referral_code"`
	ReferredBy       *int64    `json:"referred_by,omitempty" db:"referred_by"`
	PlanID           int64     `json:"plan_id" db:"plan_id"`
	IsKYCVerified    bool      `json:"is_kyc_verified" db:"is_kyc_verified"`
	EmailVerified    bool      `json:"email_verified" db:"email_verified"`
	IsAdmin          bool      `json:"is_admin,omitempty" db:"is_admin"`
	IsBlocked        bool      `json:"is_blocked" db:"is_blocked"`
	BiometricEnabled bool      `json:"biometric_enabled" db:"biometric_enabled"`
	ProfilePicURL    string    `json:"profile_pic_url" db:"profile_pic_url"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
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
