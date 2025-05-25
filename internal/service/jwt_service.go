package service

import (
	"github.com/Caqil/investment-api/pkg/utils"
)

// JWTService wraps the JWTManager functionality
type JWTService struct {
	jwtManager *utils.JWTManager
}

// NewJWTService creates a new JWT service
func NewJWTService(secret string, expiresIn int) *JWTService {
	return &JWTService{
		jwtManager: utils.NewJWTManager(secret, expiresIn),
	}
}

// GenerateToken generates a JWT token for a user
func (s *JWTService) GenerateToken(userID int64) (string, error) {
	return s.jwtManager.GenerateToken(userID)
}

// ValidateToken validates a JWT token
func (s *JWTService) ValidateToken(tokenString string) (*utils.Claims, error) {
	return s.jwtManager.ValidateToken(tokenString)
}

// GetJWTManager returns the underlying JWT manager
func (s *JWTService) GetJWTManager() *utils.JWTManager {
	return s.jwtManager
}
