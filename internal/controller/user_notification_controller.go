// internal/controller/user_notification_controller.go
// Create a new controller for user notifications

package controller

import (
	"net/http"
	"strconv"

	"github.com/Caqil/investment-api/internal/middleware"
	"github.com/Caqil/investment-api/internal/service"
	"github.com/gin-gonic/gin"
)

type UserNotificationController struct {
	notificationService *service.NotificationService
}

func NewUserNotificationController(notificationService *service.NotificationService) *UserNotificationController {
	return &UserNotificationController{
		notificationService: notificationService,
	}
}

// GetMyNotifications gets notifications for the authenticated user
func (c *UserNotificationController) GetMyNotifications(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get pagination parameters
	limit, err := strconv.Atoi(ctx.DefaultQuery("limit", "10"))
	if err != nil || limit <= 0 {
		limit = 10
	}
	offset, err := strconv.Atoi(ctx.DefaultQuery("offset", "0"))
	if err != nil || offset < 0 {
		offset = 0
	}

	// Get notifications
	notifications, err := c.notificationService.GetUserNotifications(userID, limit, offset)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get notifications"})
		return
	}

	// Get unread count
	unreadCount, err := c.notificationService.GetUserUnreadCount(userID)
	if err != nil {
		// Log error but continue
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

// GetUnreadCount gets the count of unread notifications for the authenticated user
func (c *UserNotificationController) GetUnreadCount(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get unread count
	unreadCount, err := c.notificationService.GetUserUnreadCount(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get unread count"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"unread_count": unreadCount})
}

// MarkAsRead marks a notification as read
func (c *UserNotificationController) MarkAsRead(ctx *gin.Context) {
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
	err = c.notificationService.MarkNotificationAsRead(notificationID, userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark notification as read"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}

// MarkAllAsRead marks all notifications as read for the authenticated user
func (c *UserNotificationController) MarkAllAsRead(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Mark all notifications as read
	err := c.notificationService.MarkAllNotificationsAsRead(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark notifications as read"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "All notifications marked as read"})
}
