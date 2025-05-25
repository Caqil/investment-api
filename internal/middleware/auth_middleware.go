package middleware

import (
	"net/http"
	"strings"

	"github.com/Caqil/investment-api/internal/repository"
	"github.com/Caqil/investment-api/pkg/utils"
	"github.com/gin-gonic/gin"
)

type AuthMiddleware struct {
	jwtManager *utils.JWTManager
	userRepo   *repository.UserRepository
}

func NewAuthMiddleware(jwtManager *utils.JWTManager, userRepo *repository.UserRepository) *AuthMiddleware {
	return &AuthMiddleware{
		jwtManager: jwtManager,
		userRepo:   userRepo,
	}
}

// Authenticate verifies the JWT token and adds the user ID to the context
func (m *AuthMiddleware) Authenticate() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: No Authorization header provided"})
			return
		}

		// Check if the header has the correct format
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: Invalid Authorization header format"})
			return
		}

		// Validate token
		tokenString := parts[1]
		claims, err := m.jwtManager.ValidateToken(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: " + err.Error()})
			return
		}

		// Check if user exists and is not blocked
		user, err := m.userRepo.FindByID(claims.UserID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
		if user == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: User not found"})
			return
		}
		if user.IsBlocked {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: User is blocked"})
			return
		}

		// Add user ID to context
		c.Set("userID", claims.UserID)
		c.Next()
	}
}

// GetUserID gets the user ID from the Gin context
func GetUserID(c *gin.Context) (int64, bool) {
	userID, exists := c.Get("userID")
	if !exists {
		return 0, false
	}
	id, ok := userID.(int64)
	return id, ok
}
