// internal/controller/dashboard_controller.go
package controller

import (
	"net/http"

	"github.com/Caqil/investment-api/internal/service"
	"github.com/gin-gonic/gin"
)

type DashboardController struct {
	userService       *service.UserService
	withdrawalService *service.WithdrawalService
	kycService        *service.KYCService
}

func NewDashboardController(
	userService *service.UserService,
	withdrawalService *service.WithdrawalService,
	kycService *service.KYCService,
) *DashboardController {
	return &DashboardController{
		userService:       userService,
		withdrawalService: withdrawalService,
		kycService:        kycService,
	}
}

// GetDashboardStats returns statistics for the admin dashboard
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

	// Get pending withdrawals count
	pendingWithdrawals, err := c.withdrawalService.GetPendingWithdrawalsCount()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get pending withdrawals count"})
		return
	}

	// Get pending KYC verifications count
	pendingKyc, err := c.kycService.CountPendingKYCDocuments()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get pending KYC count"})
		return
	}

	// Return dashboard stats
	ctx.JSON(http.StatusOK, gin.H{
		"users_count":               len(users),
		"active_users_count":        activeUsers,
		"pending_withdrawals_count": pendingWithdrawals,
		"pending_kyc_count":         pendingKyc,
	})
}
