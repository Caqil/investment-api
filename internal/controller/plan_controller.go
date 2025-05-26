package controller

import (
	"net/http"
	"strconv"

	"github.com/Caqil/investment-api/internal/middleware"
	"github.com/Caqil/investment-api/internal/service"
	"github.com/gin-gonic/gin"
)

type PlanController struct {
	planService         *service.PlanService
	userService         *service.UserService
	notificationService *service.NotificationService
}

func NewPlanController(planService *service.PlanService, userService *service.UserService, notificationService *service.NotificationService) *PlanController {
	return &PlanController{
		planService:         planService,
		userService:         userService,
		notificationService: notificationService,
	}
}

// GetAllPlans returns all available plans
func (c *PlanController) GetAllPlans(ctx *gin.Context) {
	plans, err := c.planService.GetAllPlans()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get plans"})
		return
	}

	// Convert to response objects
	planResponses := make([]interface{}, 0, len(plans))
	for _, plan := range plans {
		planResponses = append(planResponses, plan.ToResponse())
	}

	ctx.JSON(http.StatusOK, gin.H{"plans": planResponses})
}

// PurchasePlan handles the purchase of a plan
func (c *PlanController) PurchasePlan(ctx *gin.Context) {
	// Get user ID from context
	userID, exists := middleware.GetUserID(ctx)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get plan ID from URL parameter
	planIDStr := ctx.Param("id")
	planID, err := strconv.ParseInt(planIDStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid plan ID"})
		return
	}

	// Get the plan
	plan, err := c.planService.GetPlanByID(planID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Plan not found"})
		return
	}

	// Get the user
	user, err := c.userService.GetUserByID(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user"})
		return
	}

	// Check if user has enough balance
	if user.Balance < plan.Price {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient balance"})
		return
	}

	// Purchase the plan
	err = c.userService.PurchasePlan(userID, planID, plan.Price)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to purchase plan: " + err.Error()})
		return
	}
	err = c.notificationService.CreatePlanPurchaseNotification(userID, plan.Name, plan.Price)
	if err != nil {
		// Log error but continue
	}
	ctx.JSON(http.StatusOK, gin.H{
		"message": "Plan purchased successfully",
		"plan":    plan.ToResponse(),
	})
}

// CreatePlan handles the creation of a new plan (admin only)
func (c *PlanController) CreatePlan(ctx *gin.Context) {
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

// UpdatePlan handles the update of an existing plan (admin only)
func (c *PlanController) UpdatePlan(ctx *gin.Context) {
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

// DeletePlan handles the deletion of a plan (admin only)
func (c *PlanController) DeletePlan(ctx *gin.Context) {
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
