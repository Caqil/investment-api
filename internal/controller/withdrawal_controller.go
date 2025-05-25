package controller

import (
	"net/http"
	"strconv"

	"github.com/Caqil/investment-api/internal/middleware"
	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/service"
	"github.com/gin-gonic/gin"
)

type WithdrawalController struct {
	withdrawalService   *service.WithdrawalService
	taskService         *service.TaskService
	notificationService *service.NotificationService
}

func NewWithdrawalController(
	withdrawalService *service.WithdrawalService,
	taskService *service.TaskService,
	notificationService *service.NotificationService,
) *WithdrawalController {
	return &WithdrawalController{
		withdrawalService:   withdrawalService,
		taskService:         taskService,
		notificationService: notificationService,
	}
}

// RequestWithdrawal handles withdrawal requests
func (c *WithdrawalController) RequestWithdrawal(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get withdrawal details from request body
	var req struct {
		Amount         float64                `json:"amount" binding:"required,min=100"`
		PaymentMethod  string                 `json:"payment_method" binding:"required"`
		PaymentDetails map[string]interface{} `json:"payment_details" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user has completed all mandatory tasks
	tasksCompleted, err := c.taskService.HasUserCompletedMandatoryTasks(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check task completion"})
		return
	}

	if !tasksCompleted {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error":          "You must complete all mandatory tasks before withdrawing",
			"tasks_required": true,
		})
		return
	}

	// Check withdrawal limits
	canWithdraw, remainingLimit, err := c.withdrawalService.CheckWithdrawalLimit(userID, req.Amount)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check withdrawal limit: " + err.Error()})
		return
	}

	if !canWithdraw {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error":           "Daily withdrawal limit exceeded",
			"remaining_limit": remainingLimit,
		})
		return
	}

	// Process withdrawal
	withdrawal, err := c.withdrawalService.RequestWithdrawal(
		userID,
		req.Amount,
		req.PaymentMethod,
		model.PaymentDetails(req.PaymentDetails),
	)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process withdrawal: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":    "Withdrawal request submitted successfully",
		"withdrawal": withdrawal.ToResponse(),
	})
}

// GetWithdrawals gets all withdrawals for a user
func (c *WithdrawalController) GetWithdrawals(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get pagination parameters
	limit, offset := getPaginationParams(ctx)

	// Get withdrawals
	withdrawals, err := c.withdrawalService.GetUserWithdrawals(userID, limit, offset)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get withdrawals"})
		return
	}

	// Convert to response objects
	withdrawalResponses := make([]interface{}, 0, len(withdrawals))
	for _, withdrawal := range withdrawals {
		withdrawalResponses = append(withdrawalResponses, withdrawal.ToResponse())
	}

	ctx.JSON(http.StatusOK, gin.H{"withdrawals": withdrawalResponses})
}

// GetAllWithdrawals gets all withdrawals (admin only)
func (c *WithdrawalController) GetAllWithdrawals(ctx *gin.Context) {
	// Get pagination parameters
	limit, offset := getPaginationParams(ctx)

	// Get status filter
	status := ctx.Query("status")
	var withdrawals []*model.Withdrawal
	var err error

	// Get withdrawals based on status
	if status != "" {
		withdrawals, err = c.withdrawalService.GetWithdrawalsByStatus(model.WithdrawalStatus(status), limit, offset)
	} else {
		withdrawals, err = c.withdrawalService.GetAllWithdrawals(limit, offset)
	}

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get withdrawals"})
		return
	}

	// Convert to response objects
	withdrawalResponses := make([]interface{}, 0, len(withdrawals))
	for _, withdrawal := range withdrawals {
		withdrawalResponses = append(withdrawalResponses, withdrawal.ToResponse())
	}

	ctx.JSON(http.StatusOK, gin.H{"withdrawals": withdrawalResponses})
}

// ApproveWithdrawal approves a withdrawal (admin only)
func (c *WithdrawalController) ApproveWithdrawal(ctx *gin.Context) {
	// Get withdrawal ID from URL parameter
	withdrawalIDStr := ctx.Param("id")
	withdrawalID, err := strconv.ParseInt(withdrawalIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid withdrawal ID"})
		return
	}

	// Get admin note from request body
	var req struct {
		AdminNote string `json:"admin_note"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get withdrawal to get user ID and amount for notification
	withdrawal, err := c.withdrawalService.GetWithdrawalByID(withdrawalID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get withdrawal"})
		return
	}
	if withdrawal == nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Withdrawal not found"})
		return
	}

	// Approve withdrawal
	err = c.withdrawalService.ApproveWithdrawal(withdrawalID, req.AdminNote)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve withdrawal: " + err.Error()})
		return
	}

	// Send notification
	err = c.notificationService.CreateWithdrawalApprovalNotification(withdrawal.UserID, withdrawalID, withdrawal.Amount)
	if err != nil {
		// Log error but continue
		// TODO: Add proper logging
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Withdrawal approved successfully"})
}

// RejectWithdrawal rejects a withdrawal (admin only)
func (c *WithdrawalController) RejectWithdrawal(ctx *gin.Context) {
	// Get withdrawal ID from URL parameter
	withdrawalIDStr := ctx.Param("id")
	withdrawalID, err := strconv.ParseInt(withdrawalIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid withdrawal ID"})
		return
	}

	// Get reason from request body
	var req struct {
		Reason string `json:"reason" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get withdrawal to get user ID and amount for notification
	withdrawal, err := c.withdrawalService.GetWithdrawalByID(withdrawalID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get withdrawal"})
		return
	}
	if withdrawal == nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Withdrawal not found"})
		return
	}

	// Reject withdrawal
	err = c.withdrawalService.RejectWithdrawal(withdrawalID, req.Reason)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject withdrawal: " + err.Error()})
		return
	}

	// Send notification
	err = c.notificationService.CreateWithdrawalRejectionNotification(withdrawal.UserID, withdrawalID, withdrawal.Amount, req.Reason)
	if err != nil {
		// Log error but continue
		// TODO: Add proper logging
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Withdrawal rejected successfully"})
}

// Helper function to get pagination parameters
func getPaginationParams(ctx *gin.Context) (int, int) {
	// Default limit and offset
	limit := 10
	offset := 0

	// Get limit from query parameter
	limitStr := ctx.Query("limit")
	if limitStr != "" {
		parsedLimit, err := strconv.Atoi(limitStr)
		if err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	// Get offset from query parameter
	offsetStr := ctx.Query("offset")
	if offsetStr != "" {
		parsedOffset, err := strconv.Atoi(offsetStr)
		if err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	return limit, offset
}

// Helper function to parse ID parameter
func parseIDParam(ctx *gin.Context, paramName string) (int64, error) {
	idStr := ctx.Param(paramName)
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return 0, err
	}
	return id, nil
}
