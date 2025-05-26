// internal/controller/notification_controller.go
package controller

import (
	"net/http"
	"strconv"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/service"
	"github.com/gin-gonic/gin"
)

type NotificationController struct {
	notificationService *service.NotificationService
	userService         *service.UserService
}

func NewNotificationController(
	notificationService *service.NotificationService,
	userService *service.UserService,
) *NotificationController {
	return &NotificationController{
		notificationService: notificationService,
		userService:         userService,
	}
}

// GetAllNotifications gets all notifications (admin only)
func (c *NotificationController) GetAllNotifications(ctx *gin.Context) {
	// Get pagination parameters
	limit, offset := getPaginationParams(ctx)

	// Get user ID from query parameter (optional)
	userIDStr := ctx.Query("user_id")
	var userID int64
	var err error
	if userIDStr != "" {
		userID, err = strconv.ParseInt(userIDStr, 10, 64)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}
	}

	// Get notification type filter
	typeFilter := ctx.Query("type")

	// Get read status filter
	readStatusStr := ctx.Query("is_read")
	var readStatus *bool
	if readStatusStr != "" {
		isRead := readStatusStr == "true"
		readStatus = &isRead
	}

	// Get all notifications with filters
	var notifications []*model.Notification
	var fetchErr error

	if userID > 0 {
		// Get notifications for a specific user
		if readStatus != nil {
			// With read status filter
			if *readStatus {
				// Get read notifications
				notifications, fetchErr = c.notificationService.GetReadNotificationsByUserID(userID, limit, offset)
			} else {
				// Get unread notifications
				notifications, fetchErr = c.notificationService.GetUnreadNotificationsByUserID(userID, limit, offset)
			}
		} else {
			// Get all notifications for user
			notifications, fetchErr = c.notificationService.GetNotificationsByUserID(userID, limit, offset)
		}
	} else {
		// Get all notifications (implement this method in notification service)
		notifications, fetchErr = c.notificationService.GetAllNotifications(limit, offset)
	}

	if fetchErr != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get notifications"})
		return
	}

	// Filter by type if needed
	if typeFilter != "" {
		var filtered []*model.Notification
		for _, notification := range notifications {
			if string(notification.Type) == typeFilter {
				filtered = append(filtered, notification)
			}
		}
		notifications = filtered
	}

	// Convert to response objects
	notificationResponses := make([]interface{}, 0, len(notifications))
	for _, notification := range notifications {
		notificationResponses = append(notificationResponses, notification.ToResponse())
	}

	ctx.JSON(http.StatusOK, gin.H{
		"notifications": notificationResponses,
		"total":         len(notificationResponses),
		"limit":         limit,
		"offset":        offset,
	})
}

// GetNotificationStats gets notification statistics
func (c *NotificationController) GetNotificationStats(ctx *gin.Context) {
	// Get counts for different notification types
	totalCount, err := c.notificationService.CountAllNotifications()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get total count"})
		return
	}

	unreadCount, err := c.notificationService.CountAllUnreadNotifications()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get unread count"})
		return
	}

	// Get counts by type
	withdrawalCount, err := c.notificationService.CountNotificationsByType(model.NotificationTypeWithdrawal)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get withdrawal notification count"})
		return
	}

	depositCount, err := c.notificationService.CountNotificationsByType(model.NotificationTypeDeposit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get deposit notification count"})
		return
	}

	bonusCount, err := c.notificationService.CountNotificationsByType(model.NotificationTypeBonus)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get bonus notification count"})
		return
	}

	systemCount, err := c.notificationService.CountNotificationsByType(model.NotificationTypeSystem)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get system notification count"})
		return
	}

	// Get recent notifications
	recentNotifications, err := c.notificationService.GetRecentNotifications(5)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get recent notifications"})
		return
	}

	// Convert to response objects
	recentNotificationResponses := make([]interface{}, 0, len(recentNotifications))
	for _, notification := range recentNotifications {
		recentNotificationResponses = append(recentNotificationResponses, notification.ToResponse())
	}

	ctx.JSON(http.StatusOK, gin.H{
		"total_count":          totalCount,
		"unread_count":         unreadCount,
		"withdrawal_count":     withdrawalCount,
		"deposit_count":        depositCount,
		"bonus_count":          bonusCount,
		"system_count":         systemCount,
		"recent_notifications": recentNotificationResponses,
	})
}

// SendNotification sends a notification to users
func (c *NotificationController) SendNotification(ctx *gin.Context) {
	var req struct {
		UserID  int64  `json:"user_id"`
		Title   string `json:"title" binding:"required"`
		Message string `json:"message" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var err error
	if req.UserID > 0 {
		// Send to specific user
		err = c.notificationService.CreateSystemNotification(req.UserID, req.Title, req.Message)
	} else {
		// Send to all users
		err = c.notificationService.CreateSystemNotificationForAllUsers(req.Title, req.Message)
	}

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send notification: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Notification sent successfully",
	})
}

// MarkNotificationAsRead marks a notification as read
func (c *NotificationController) MarkNotificationAsRead(ctx *gin.Context) {
	// Get notification ID from URL parameter
	notificationIDStr := ctx.Param("id")
	notificationID, err := strconv.ParseInt(notificationIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	// Mark as read (admin can mark any notification as read)
	err = c.notificationService.MarkNotificationAsReadByAdmin(notificationID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark notification as read: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}

// DeleteNotification deletes a notification
func (c *NotificationController) DeleteNotification(ctx *gin.Context) {
	// Get notification ID from URL parameter
	notificationIDStr := ctx.Param("id")
	notificationID, err := strconv.ParseInt(notificationIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	// Delete notification
	err = c.notificationService.DeleteNotificationByAdmin(notificationID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete notification: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Notification deleted"})
}
