package middleware

import (
	"net/http"

	"github.com/Caqil/investment-api/internal/service"
	"github.com/gin-gonic/gin"
)

type DeviceCheckMiddleware struct {
	deviceService *service.DeviceService
}

func NewDeviceCheckMiddleware(deviceService *service.DeviceService) *DeviceCheckMiddleware {
	return &DeviceCheckMiddleware{
		deviceService: deviceService,
	}
}

// CheckDevice verifies that the request is coming from a registered device
func (m *DeviceCheckMiddleware) CheckDevice() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := GetUserID(c)
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: User ID not found in context"})
			return
		}

		// Get device ID from header
		deviceID := c.GetHeader("X-Device-ID")
		if deviceID == "" {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Device ID is required"})
			return
		}

		// Check if device is registered to the user
		isUserDevice, err := m.deviceService.IsDeviceRegisteredToUser(deviceID, userID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to check device"})
			return
		}
		if !isUserDevice {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Device not registered to this user"})
			return
		}

		// Check if device is virtual
		isVirtual, err := m.deviceService.IsVirtualDevice(deviceID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to check device"})
			return
		}
		if isVirtual {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Virtual devices are not supported"})
			return
		}

		// Add device ID to context
		c.Set("deviceID", deviceID)
		c.Next()
	}
}

// GetDeviceID gets the device ID from the Gin context
func GetDeviceID(c *gin.Context) (string, bool) {
	deviceID, exists := c.Get("deviceID")
	if !exists {
		return "", false
	}
	id, ok := deviceID.(string)
	return id, ok
}
