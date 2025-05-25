package utils

import (
	"crypto/rand"
	"encoding/base64"
	"math/big"

	"golang.org/x/crypto/bcrypt"
)

// HashPassword creates a bcrypt hash of the password
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPasswordHash compares a bcrypt hashed password with its plaintext version
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GenerateRandomString generates a random string of the specified length
func GenerateRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	result := make([]byte, length)
	for i := 0; i < length; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return ""
		}
		result[i] = charset[num.Int64()]
	}
	return string(result)
}

// GenerateReferralCode generates a unique referral code
func GenerateReferralCode(length int) (string, error) {
	b := make([]byte, (length*6)/8+1)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	code := base64.RawURLEncoding.EncodeToString(b)
	if len(code) > length {
		code = code[:length]
	}
	return code, nil
}
