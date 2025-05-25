package middleware

import (
	"net/http"

	"github.com/Caqil/investment-api/internal/repository"
	"github.com/gin-gonic/gin"
)

type AdminMiddleware struct {
	userRepo *repository.UserRepository
}

func NewAdminMiddleware(userRepo *repository.UserRepository) *AdminMiddleware {
	return &AdminMiddleware{
		userRepo: userRepo,
	}
}

// EnsureAdmin verifies that the authenticated user is an admin
func (m *AdminMiddleware) EnsureAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := GetUserID(c)
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: User ID not found in context"})
			return
		}

		// Get user from database
		user, err := m.userRepo.FindByID(userID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
		if user == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: User not found"})
			return
		}

		// Check if user is an admin
		if !user.IsAdmin {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Forbidden: Admin access required"})
			return
		}

		c.Next()
	}
}
