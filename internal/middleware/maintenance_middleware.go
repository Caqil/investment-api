package middleware

import (
	"net/http"
	"time"

	"github.com/Caqil/investment-api/internal/repository"
	"github.com/Caqil/investment-api/internal/service"
	"github.com/gin-gonic/gin"
)

type MaintenanceMiddleware struct {
	settingService *service.SettingService
}

func NewMaintenanceMiddleware(settingService *service.SettingService) *MaintenanceMiddleware {
	return &MaintenanceMiddleware{
		settingService: settingService,
	}
}

// CheckMaintenance checks if the system is in maintenance mode
func (m *MaintenanceMiddleware) CheckMaintenance() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip check for admin routes
		if c.Request.URL.Path == "/api/auth/login" || c.FullPath() == "/api/app-settings" {
			c.Next()
			return
		}

		// Check if maintenance mode is enabled
		maintenanceMode, err := m.settingService.GetSettingValueBool("maintenance_mode")
		if err == nil && maintenanceMode {
			// If in maintenance mode, check if user is admin
			userID, exists := GetUserID(c)
			if exists {
				// Get user from repository
				userRepo := repository.NewUserRepository(nil) // Use the DB from the service
				user, err := userRepo.FindByID(userID)
				if err == nil && user != nil && user.IsAdmin {
					// Allow admin users to access the API during maintenance
					c.Next()
					return
				}
			}

			// Return maintenance mode error for non-admin users
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error":             "System is currently in maintenance mode. Please try again later.",
				"maintenance_mode":  true,
				"estimated_time":    "30 minutes",
				"maintenance_start": time.Now().Add(-10 * time.Minute).Format(time.RFC3339),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
