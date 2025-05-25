package controller

import (
	"net/http"
	"strconv"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/service"
	"github.com/gin-gonic/gin"
)

type AdminController struct {
	userService         *service.UserService
	withdrawalService   *service.WithdrawalService
	kycService          *service.KYCService
	planService         *service.PlanService
	taskService         *service.TaskService
	notificationService *service.NotificationService
}

func NewAdminController(
	userService *service.UserService,
	withdrawalService *service.WithdrawalService,
	kycService *service.KYCService,
	planService *service.PlanService,
	taskService *service.TaskService,
	notificationService *service.NotificationService,
) *AdminController {
	return &AdminController{
		userService:         userService,
		withdrawalService:   withdrawalService,
		kycService:          kycService,
		planService:         planService,
		taskService:         taskService,
		notificationService: notificationService,
	}
}

// GetAllUsers gets all users
func (c *AdminController) GetAllUsers(ctx *gin.Context) {
	// Get pagination parameters
	limit, offset := getPaginationParams(ctx)

	// Get users
	users, err := c.userService.GetAllUsers(limit, offset)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get users"})
		return
	}

	// Convert to response objects
	userResponses := make([]interface{}, 0, len(users))
	for _, user := range users {
		userResponses = append(userResponses, user.ToResponse())
	}

	ctx.JSON(http.StatusOK, gin.H{"users": userResponses})
}

// GetUserDetails gets details for a specific user
func (c *AdminController) GetUserDetails(ctx *gin.Context) {
	// Get user ID from URL parameter
	userIDStr := ctx.Param("id")
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get user
	user, err := c.userService.GetUserByID(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user"})
		return
	}
	if user == nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
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

	// Get referral count
	referralCount, err := c.bonusService.GetUserTotalReferrals(userID)
	if err != nil {
		// Log error but continue
		// TODO: Add proper logging
	}

	ctx.JSON(http.StatusOK, gin.H{
		"user":           user,
		"devices":        deviceResponses,
		"referral_count": referralCount,
	})
}

// BlockUser blocks a user
func (c *AdminController) BlockUser(ctx *gin.Context) {
	// Get user ID from URL parameter
	userIDStr := ctx.Param("id")
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Block user
	err = c.userService.BlockUser(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to block user: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "User blocked successfully"})
}

// UnblockUser unblocks a user
func (c *AdminController) UnblockUser(ctx *gin.Context) {
	// Get user ID from URL parameter
	userIDStr := ctx.Param("id")
	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Unblock user
	err = c.userService.UnblockUser(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unblock user: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "User unblocked successfully"})
}

// GetAllWithdrawals gets all withdrawals
func (c *AdminController) GetAllWithdrawals(ctx *gin.Context) {
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

// ApproveWithdrawal approves a withdrawal
func (c *AdminController) ApproveWithdrawal(ctx *gin.Context) {
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

// RejectWithdrawal rejects a withdrawal
func (c *AdminController) RejectWithdrawal(ctx *gin.Context) {
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

// GetAllKYCSubmissions gets all KYC submissions
func (c *AdminController) GetAllKYCSubmissions(ctx *gin.Context) {
	// Get pagination parameters
	limit, offset := getPaginationParams(ctx)

	// Get status filter
	status := ctx.Query("status")
	var kycs []*model.KYCDocument
	var err error

	// Get KYCs based on status
	if status != "" {
		switch model.KYCStatus(status) {
		case model.KYCStatusPending:
			kycs, err = c.kycService.GetPendingKYCDocuments(limit, offset)
		case model.KYCStatusApproved:
			kycs, err = c.kycService.GetApprovedKYCDocuments(limit, offset)
		case model.KYCStatusRejected:
			kycs, err = c.kycService.GetRejectedKYCDocuments(limit, offset)
		default:
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
			return
		}
	} else {
		kycs, err = c.kycService.GetAllKYCDocuments(limit, offset)
	}

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get KYC submissions"})
		return
	}

	// Convert to response objects
	kycResponses := make([]interface{}, 0, len(kycs))
	for _, kyc := range kycs {
		kycResponses = append(kycResponses, kyc.ToResponse())
	}

	ctx.JSON(http.StatusOK, gin.H{"kyc_documents": kycResponses})
}

// ApproveKYC approves a KYC document
func (c *AdminController) ApproveKYC(ctx *gin.Context) {
	// Get KYC ID from URL parameter
	kycIDStr := ctx.Param("id")
	kycID, err := strconv.ParseInt(kycIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid KYC ID"})
		return
	}

	// Get KYC document to get user ID for notification
	kyc, err := c.kycService.GetKYCByID(kycID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get KYC document"})
		return
	}
	if kyc == nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "KYC document not found"})
		return
	}

	// Approve KYC
	err = c.kycService.ApproveKYC(kycID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve KYC: " + err.Error()})
		return
	}

	// Send notification
	err = c.notificationService.CreateKYCApprovalNotification(kyc.UserID)
	if err != nil {
		// Log error but continue
		// TODO: Add proper logging
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "KYC document approved successfully"})
}

// RejectKYC rejects a KYC document
func (c *AdminController) RejectKYC(ctx *gin.Context) {
	// Get KYC ID from URL parameter
	kycIDStr := ctx.Param("id")
	kycID, err := strconv.ParseInt(kycIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid KYC ID"})
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

	// Get KYC document to get user ID for notification
	kyc, err := c.kycService.GetKYCByID(kycID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get KYC document"})
		return
	}
	if kyc == nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "KYC document not found"})
		return
	}

	// Reject KYC
	err = c.kycService.RejectKYC(kycID, req.Reason)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject KYC: " + err.Error()})
		return
	}

	// Send notification
	err = c.notificationService.CreateKYCRejectionNotification(kyc.UserID, req.Reason)
	if err != nil {
		// Log error but continue
		// TODO: Add proper logging
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "KYC document rejected successfully"})
}

// CreatePlan creates a new plan
func (c *AdminController) CreatePlan(ctx *gin.Context) {
	var req struct {
		Name                 string  `json:"name" binding:"required"`
		DailyDepositLimit    float64 `json:"daily_deposit_limit" binding:"required,min=0"`
		DailyWithdrawalLimit float64 `json:"daily_withdrawal_limit" binding:"required,min=0"`
		DailyProfitLimit     float64 `json:"daily_profit_limit" binding:"required,min=0"`
		Price                float64 `json:"price" binding:"required,min=0"`
		IsDefault            bool    `json:"is_default"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	plan, err := c.planService.CreatePlan(
		req.Name,
		req.DailyDepositLimit,
		req.DailyWithdrawalLimit,
		req.DailyProfitLimit,
		req.Price,
		req.IsDefault,
	)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create plan: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Plan created successfully",
		"plan":    plan.ToResponse(),
	})
}

// UpdatePlan updates an existing plan
func (c *AdminController) UpdatePlan(ctx *gin.Context) {
	// Get plan ID from URL parameter
	planIDStr := ctx.Param("id")
	planID, err := strconv.ParseInt(planIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid plan ID"})
		return
	}

	var req struct {
		Name                 string  `json:"name" binding:"required"`
		DailyDepositLimit    float64 `json:"daily_deposit_limit" binding:"required,min=0"`
		DailyWithdrawalLimit float64 `json:"daily_withdrawal_limit" binding:"required,min=0"`
		DailyProfitLimit     float64 `json:"daily_profit_limit" binding:"required,min=0"`
		Price                float64 `json:"price" binding:"required,min=0"`
		IsDefault            bool    `json:"is_default"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	plan, err := c.planService.UpdatePlan(
		planID,
		req.Name,
		req.DailyDepositLimit,
		req.DailyWithdrawalLimit,
		req.DailyProfitLimit,
		req.Price,
		req.IsDefault,
	)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update plan: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Plan updated successfully",
		"plan":    plan.ToResponse(),
	})
}

// DeletePlan deletes a plan
func (c *AdminController) DeletePlan(ctx *gin.Context) {
	// Get plan ID from URL parameter
	planIDStr := ctx.Param("id")
	planID, err := strconv.ParseInt(planIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid plan ID"})
		return
	}

	err = c.planService.DeletePlan(planID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete plan: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Plan deleted successfully",
	})
}

// CreateTask creates a new task
func (c *AdminController) CreateTask(ctx *gin.Context) {
	var req struct {
		Name        string         `json:"name" binding:"required"`
		Description string         `json:"description" binding:"required"`
		TaskType    model.TaskType `json:"task_type" binding:"required"`
		TaskURL     string         `json:"task_url"`
		IsMandatory bool           `json:"is_mandatory"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate task type
	if req.TaskType != model.TaskTypeFollow && req.TaskType != model.TaskTypeLike && req.TaskType != model.TaskTypeInstall {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task type"})
		return
	}

	task, err := c.taskService.CreateTask(
		req.Name,
		req.Description,
		req.TaskType,
		req.TaskURL,
		req.IsMandatory,
	)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Task created successfully",
		"task":    task.ToResponse(false),
	})
}

// UpdateTask updates an existing task
func (c *AdminController) UpdateTask(ctx *gin.Context) {
	// Get task ID from URL parameter
	taskIDStr := ctx.Param("id")
	taskID, err := strconv.ParseInt(taskIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var req struct {
		Name        string         `json:"name" binding:"required"`
		Description string         `json:"description" binding:"required"`
		TaskType    model.TaskType `json:"task_type" binding:"required"`
		TaskURL     string         `json:"task_url"`
		IsMandatory bool           `json:"is_mandatory"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate task type
	if req.TaskType != model.TaskTypeFollow && req.TaskType != model.TaskTypeLike && req.TaskType != model.TaskTypeInstall {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task type"})
		return
	}

	task, err := c.taskService.UpdateTask(
		taskID,
		req.Name,
		req.Description,
		req.TaskType,
		req.TaskURL,
		req.IsMandatory,
	)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Task updated successfully",
		"task":    task.ToResponse(false),
	})
}

// DeleteTask deletes a task
func (c *AdminController) DeleteTask(ctx *gin.Context) {
	// Get task ID from URL parameter
	taskIDStr := ctx.Param("id")
	taskID, err := strconv.ParseInt(taskIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	err = c.taskService.DeleteTask(taskID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Task deleted successfully",
	})
}

// SendNotification sends a notification to all users
func (c *AdminController) SendNotification(ctx *gin.Context) {
	var req struct {
		Title   string `json:"title" binding:"required"`
		Message string `json:"message" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := c.notificationService.CreateSystemNotificationForAllUsers(req.Title, req.Message)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send notification: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Notification sent successfully to all users",
	})
}
