// internal/controller/dashboard_controller.go
package controller

import (
	"net/http"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/repository"
	"github.com/Caqil/investment-api/internal/service"
	"github.com/gin-gonic/gin"
)

type DashboardController struct {
	userService       *service.UserService
	withdrawalService *service.WithdrawalService
	kycService        *service.KYCService
	planService       *service.PlanService
	transactionRepo   *repository.TransactionRepository
}

func NewDashboardController(
	userService *service.UserService,
	withdrawalService *service.WithdrawalService,
	kycService *service.KYCService,
	planService *service.PlanService,
	transactionRepo *repository.TransactionRepository,
) *DashboardController {
	return &DashboardController{
		userService:       userService,
		withdrawalService: withdrawalService,
		kycService:        kycService,
		planService:       planService,
		transactionRepo:   transactionRepo,
	}
}

// GetDashboardStats returns comprehensive statistics for the admin dashboard
func (c *DashboardController) GetDashboardStats(ctx *gin.Context) {
	// Get total users count
	users, err := c.userService.GetAllUsers(0, 0) // Get all users (no pagination)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get users count"})
		return
	}

	// Count active users (not blocked)
	activeUsers := 0
	for _, user := range users {
		if !user.IsBlocked {
			activeUsers++
		}
	}

	// Get recent users (last 5)
	recentUsers := make([]interface{}, 0)
	if len(users) > 0 {
		// Sort users by creation date (newest first) and take first 5
		// Note: In a real implementation, you might want to do this sorting in the database
		count := 5
		if len(users) < 5 {
			count = len(users)
		}

		// Simple approach - take the last N users (assuming they're the most recent)
		startIndex := len(users) - count
		if startIndex < 0 {
			startIndex = 0
		}

		for i := len(users) - 1; i >= startIndex && len(recentUsers) < 5; i-- {
			recentUsers = append(recentUsers, users[i].ToResponse())
		}
	}

	// Get pending withdrawals count
	pendingWithdrawals, err := c.withdrawalService.GetPendingWithdrawalsCount()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get pending withdrawals count"})
		return
	}

	// Get recent withdrawals
	recentWithdrawalsList, err := c.withdrawalService.GetPendingWithdrawals(5, 0)
	if err != nil {
		// Log error but continue
		recentWithdrawalsList = nil
	}

	recentWithdrawals := make([]interface{}, 0)
	if recentWithdrawalsList != nil {
		for _, withdrawal := range recentWithdrawalsList {
			recentWithdrawals = append(recentWithdrawals, withdrawal.ToResponse())
		}
	}

	// Get pending KYC verifications count
	pendingKyc, err := c.kycService.CountPendingKYCDocuments()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get pending KYC count"})
		return
	}

	// Calculate plan distribution
	planDistribution := make([]map[string]interface{}, 0)

	// Get all plans
	plans, err := c.planService.GetAllPlans()
	if err == nil && len(plans) > 0 {
		// Count users per plan
		planCounts := make(map[int64]int)
		planNames := make(map[int64]string)

		// Initialize plan counts
		for _, plan := range plans {
			planCounts[plan.ID] = 0
			planNames[plan.ID] = plan.Name
		}

		// Count users per plan
		for _, user := range users {
			if _, exists := planCounts[user.PlanID]; exists {
				planCounts[user.PlanID]++
			}
		}

		// Convert to response format
		for planID, count := range planCounts {
			if count > 0 { // Only include plans with users
				planDistribution = append(planDistribution, map[string]interface{}{
					"name":  planNames[planID],
					"value": count,
				})
			}
		}
	}

	// Calculate total deposits (optional - can be expensive for large datasets)
	var totalDeposits float64 = 0
	if c.transactionRepo != nil {
		// Get completed deposit transactions
		depositTransactions, err := c.transactionRepo.GetTransactionsByTypeAndStatus(
			model.TransactionTypeDeposit,
			model.TransactionStatusCompleted,
			1000, // Limit to recent transactions for performance
			0,
		)
		if err == nil {
			for _, transaction := range depositTransactions {
				totalDeposits += transaction.Amount
			}
		}
	}

	// Return comprehensive dashboard stats
	ctx.JSON(http.StatusOK, gin.H{
		"users_count":               len(users),
		"active_users_count":        activeUsers,
		"pending_withdrawals_count": pendingWithdrawals,
		"pending_kyc_count":         pendingKyc,
		"total_deposits":            totalDeposits,
		"recent_users":              recentUsers,
		"recent_withdrawals":        recentWithdrawals,
		"plan_distribution":         planDistribution,
	})
}
