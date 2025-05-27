package middleware

import (
	"net/http"

	"github.com/Caqil/investment-api/internal/service"
	"github.com/gin-gonic/gin"
)

type DeviceCheckMiddleware struct {
	deviceService  *service.DeviceService
	userService    *service.UserService
	settingService *service.SettingService // Add settingService
}

// Update the constructor to include settingService
func NewDeviceCheckMiddleware(
	deviceService *service.DeviceService,
	userService *service.UserService,
	settingService *service.SettingService, // Add this parameter
) *DeviceCheckMiddleware {
	return &DeviceCheckMiddleware{
		deviceService:  deviceService,
		userService:    userService,
		settingService: settingService, // Assign the field
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

		// Get user to check if they're an admin
		user, err := m.userService.GetUserByID(userID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user"})
			return
		}

		if user == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: User not found"})
			return
		}

		// Get device ID from header
		deviceID := c.GetHeader("X-Device-ID")

		// For admins, handle special case
		if user.IsAdmin {
			// Admin users can access without a device ID
			if deviceID != "" {
				// If device ID is provided, silently register it if not already registered
				isUserDevice, err := m.deviceService.IsDeviceRegisteredToUser(deviceID, userID)
				if err == nil && !isUserDevice {
					_ = m.deviceService.RegisterDevice(userID, deviceID)
				}

				// Update last login time for the device
				_ = m.deviceService.UpdateDeviceLastLogin(deviceID)

				// Add device ID to context
				c.Set("deviceID", deviceID)
			}

			// Allow admin to proceed regardless of device
			c.Next()
			return
		}

		// Check if device checking is enabled
		deviceCheckEnabled, err := m.settingService.GetSettingValueBool("enable_device_check")
		if err != nil {
			// Default to enabled if setting not found
			deviceCheckEnabled = true
		}

		// If device checking is disabled, only verify that a device ID is provided
		if !deviceCheckEnabled {
			if deviceID == "" {
				c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Device ID is required"})
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

			// Auto-register device if not already registered
			isUserDevice, _ := m.deviceService.IsDeviceRegisteredToUser(deviceID, userID)
			if !isUserDevice {
				_ = m.deviceService.RegisterDevice(userID, deviceID)
			}

			// Update last login time
			_ = m.deviceService.UpdateDeviceLastLogin(deviceID)

			// Add device ID to context
			c.Set("deviceID", deviceID)
			c.Next()
			return
		}

		// Device checking is enabled, enforce full validation
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
