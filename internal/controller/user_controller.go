package controller

import (
	"net/http"
	"strconv"

	"github.com/Caqil/investment-api/internal/middleware"
	"github.com/Caqil/investment-api/internal/service"
	"github.com/gin-gonic/gin"
)

type UserController struct {
	userService  *service.UserService
	bonusService *service.BonusService
}

func NewUserController(
	userService *service.UserService,
	bonusService *service.BonusService,
) *UserController {
	return &UserController{
		userService:  userService,
		bonusService: bonusService,
	}
}

// GetProfile gets the user's profile
func (c *UserController) GetProfile(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get user
	user, err := c.userService.GetUserByID(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user profile"})
		return
	}

	// Get user devices
	devices, err := c.userService.GetUserDevices(userID)
	if err != nil {
		// Log error but continue
		// TODO: Add proper logging
	}

	// Convert devices to response objects
	deviceResponses := make([]interface{}, 0, len(devices))
	for _, device := range devices {
		deviceResponses = append(deviceResponses, device.ToResponse())
	}

	// Get referral earnings
	referralEarnings, err := c.bonusService.GetUserReferralEarnings(userID)
	if err != nil {
		// Log error but continue
		// TODO: Add proper logging
	}

	// Get referral count
	referralCount, err := c.bonusService.GetUserTotalReferrals(userID)
	if err != nil {
		// Log error but continue
		// TODO: Add proper logging
	}

	ctx.JSON(http.StatusOK, gin.H{
		"user":              user.ToResponse(),
		"devices":           deviceResponses,
		"referral_earnings": referralEarnings,
		"referral_count":    referralCount,
	})
}

// UpdateProfile updates the user's profile
func (c *UserController) UpdateProfile(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get profile details from request body
	var req struct {
		Name          string `json:"name" binding:"required"`
		Phone         string `json:"phone" binding:"required"`
		ProfilePicURL string `json:"profile_pic_url"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update profile
	user, err := c.userService.UpdateProfile(
		userID,
		req.Name,
		req.Phone,
		req.ProfilePicURL,
	)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"user":    user.ToResponse(),
	})
}

// ChangePassword changes the user's password
func (c *UserController) ChangePassword(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get password details from request body
	var req struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required,min=6"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Change password
	err := c.userService.ChangePassword(userID, req.CurrentPassword, req.NewPassword)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to change password: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}

// EnableBiometric enables biometric login for the user
func (c *UserController) EnableBiometric(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Enable biometric
	err := c.userService.EnableBiometric(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to enable biometric login: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Biometric login enabled successfully"})
}

// DisableBiometric disables biometric login for the user
func (c *UserController) DisableBiometric(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Disable biometric
	err := c.userService.DisableBiometric(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to disable biometric login: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Biometric login disabled successfully"})
}

// GetTransactions gets the user's transactions
func (c *UserController) GetTransactions(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get pagination parameters
	limit, offset := getPaginationParams(ctx)

	// Get transactions
	transactionRepo := repository.NewTransactionRepository(nil) // Use the DB from the service
	transactions, err := transactionRepo.FindByUserID(userID, limit, offset)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get transactions"})
		return
	}

	// Convert to response objects
	transactionResponses := make([]interface{}, 0, len(transactions))
	for _, transaction := range transactions {
		transactionResponses = append(transactionResponses, transaction.ToResponse())
	}

	ctx.JSON(http.StatusOK, gin.H{"transactions": transactionResponses})
}

// GetNotifications gets the user's notifications
func (c *UserController) GetNotifications(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get pagination parameters
	limit, offset := getPaginationParams(ctx)

	// Get notifications
	notificationRepo := repository.NewNotificationRepository(nil) // Use the DB from the service
	notifications, err := notificationRepo.FindByUserID(userID, limit, offset)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get notifications"})
		return
	}

	// Get unread count
	unreadCount, err := notificationRepo.CountUnreadByUserID(userID)
	if err != nil {
		// Log error but continue
		// TODO: Add proper logging
	}

	// Convert to response objects
	notificationResponses := make([]interface{}, 0, len(notifications))
	for _, notification := range notifications {
		notificationResponses = append(notificationResponses, notification.ToResponse())
	}

	ctx.JSON(http.StatusOK, gin.H{
		"notifications": notificationResponses,
		"unread_count":  unreadCount,
	})
}

// MarkNotificationAsRead marks a notification as read
func (c *UserController) MarkNotificationAsRead(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get notification ID from URL parameter
	notificationIDStr := ctx.Param("id")
	notificationID, err := strconv.ParseInt(notificationIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	// Mark notification as read
	notificationRepo := repository.NewNotificationRepository(nil) // Use the DB from the service
	notification, err := notificationRepo.FindByID(notificationID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get notification"})
		return
	}
	if notification == nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	// Check if notification belongs to user
	if notification.UserID != userID {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Notification does not belong to user"})
		return
	}

	// Mark as read
	err = notificationRepo.MarkAsRead(notificationID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark notification as read"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}
