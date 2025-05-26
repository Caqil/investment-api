package controller

import (
	"net/http"

	"github.com/Caqil/investment-api/internal/service"
	"github.com/gin-gonic/gin"
)

type AuthController struct {
	authService         *service.AuthService
	userService         *service.UserService
	deviceService       *service.DeviceService
	planService         *service.PlanService
	notificationService *service.NotificationService // Add this field
}

func NewAuthController(
	authService *service.AuthService,
	userService *service.UserService,
	deviceService *service.DeviceService,
	planService *service.PlanService,
	notificationService *service.NotificationService, // Add this parameter
) *AuthController {
	return &AuthController{
		authService:         authService,
		userService:         userService,
		deviceService:       deviceService,
		planService:         planService,
		notificationService: notificationService, // Assign the field
	}
}

type RegisterRequest struct {
	Name      string `json:"name" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6"`
	Phone     string `json:"phone" binding:"required"`
	DeviceID  string `json:"device_id" binding:"required"`
	ReferCode string `json:"refer_code"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
	DeviceID string `json:"device_id" binding:"required"`
}

type VerifyEmailRequest struct {
	Email string `json:"email" binding:"required,email"`
	Code  string `json:"code" binding:"required"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type ResetPasswordRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

// Register handles user registration
func (c *AuthController) Register(ctx *gin.Context) {
	var req RegisterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if device is already registered
	isRegistered, err := c.deviceService.IsDeviceRegistered(req.DeviceID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check device"})
		return
	}
	if isRegistered {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error":           "Device already registered",
			"contact_support": true,
		})
		return
	}

	// Check for virtual device or emulator
	isVirtual, err := c.deviceService.IsVirtualDevice(req.DeviceID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check device"})
		return
	}
	if isVirtual {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Virtual devices are not supported"})
		return
	}

	// Register user
	user, err := c.authService.Register(
		req.Name,
		req.Email,
		req.Password,
		req.Phone,
		req.ReferCode,
	)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register user: " + err.Error()})
		return
	}

	// Register device
	err = c.deviceService.RegisterDevice(user.ID, req.DeviceID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register device"})
		return
	}

	// Handle referral bonus if applicable
	if user.ReferredBy != nil {
		// Config values would typically come from your config package
		bonusAmount := 100.0 // 100 BDT as per requirements
		err = c.authService.ProcessReferralBonus(user.ID, *user.ReferredBy, bonusAmount)
		if err != nil {
			// Log error but continue
			// In a real application, you would use a proper logging framework
		}
	}
	if c.notificationService != nil {
		err = c.notificationService.CreateRegistrationNotification(user.ID, user.Name)
		if err != nil {
			// Log error but continue
			// TODO: Add proper logging
		}
	}
	// Create response
	userResponse := map[string]interface{}{
		"id":              user.ID,
		"name":            user.Name,
		"email":           user.Email,
		"phone":           user.Phone,
		"balance":         user.Balance,
		"referral_code":   user.ReferralCode,
		"is_kyc_verified": user.IsKYCVerified,
		"email_verified":  user.EmailVerified,
		"created_at":      user.CreatedAt,
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully. Please verify your email.",
		"user":    userResponse,
	})
}
func (c *AuthController) Login(ctx *gin.Context) {
	var req LoginRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Authenticate user
	token, user, err := c.authService.Login(req.Email, req.Password)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication failed: " + err.Error()})
		return
	}

	// If user is admin, skip device check
	if user.IsAdmin {
		// Admin users can login from any device
		// Update last login time if device ID is provided
		if req.DeviceID != "" {
			// Check if device is registered, register it if it's not
			isUserDevice, err := c.deviceService.IsDeviceRegisteredToUser(req.DeviceID, user.ID)
			if err == nil && !isUserDevice {
				// Silently register the device for the admin
				_ = c.deviceService.RegisterDevice(user.ID, req.DeviceID)
			}

			// Update device last login if provided
			_ = c.deviceService.UpdateDeviceLastLogin(req.DeviceID)
		}
	} else {
		// Regular users
		// Check if device is registered to this user
		isUserDevice, err := c.deviceService.IsDeviceRegisteredToUser(req.DeviceID, user.ID)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check device"})
			return
		}

		if !isUserDevice {
			// Auto-register the new device
			err = c.deviceService.RegisterDevice(user.ID, req.DeviceID)
			if err != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register new device"})
				return
			}

			// Log device registration (optional)
			// log.Printf("New device registered for user %d: %s", user.ID, req.DeviceID)
		}

		// Update device last login
		err = c.deviceService.UpdateDeviceLastLogin(req.DeviceID)
		if err != nil {
			// Log error but continue
		}
	}

	// Create response
	userResponse := map[string]interface{}{
		"id":                user.ID,
		"name":              user.Name,
		"email":             user.Email,
		"phone":             user.Phone,
		"balance":           user.Balance,
		"referral_code":     user.ReferralCode,
		"is_kyc_verified":   user.IsKYCVerified,
		"is_admin":          user.IsAdmin,
		"biometric_enabled": user.BiometricEnabled,
		"profile_pic_url":   user.ProfilePicURL,
	}

	ctx.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  userResponse,
	})
}

// VerifyEmail handles email verification
func (c *AuthController) VerifyEmail(ctx *gin.Context) {
	var req VerifyEmailRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := c.authService.VerifyEmail(req.Email, req.Code)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Email verification failed: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Email verified successfully",
	})
}

// ForgotPassword initiates the password reset process
func (c *AuthController) ForgotPassword(ctx *gin.Context) {
	var req ForgotPasswordRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Implement forgot password logic
	// Generate reset token and send email

	ctx.JSON(http.StatusOK, gin.H{
		"message": "If an account with that email exists, we've sent password reset instructions",
	})
}

// ResetPassword completes the password reset process
func (c *AuthController) ResetPassword(ctx *gin.Context) {
	var req ResetPasswordRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Implement reset password logic
	// Verify token and update password

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Password has been reset successfully",
	})
}
