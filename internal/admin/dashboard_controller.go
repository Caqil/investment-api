package admin

import (
	"net/http"

	"github.com/Caqil/investment-api/internal/model"
	"github.com/Caqil/investment-api/internal/repository"
	"github.com/gin-gonic/gin"
)

// DashboardController handles the admin dashboard
type DashboardController struct {
	userRepo        *repository.UserRepository
	transactionRepo *repository.TransactionRepository
	withdrawalRepo  *repository.WithdrawalRepository
	kycRepo         *repository.KYCRepository
}

// NewDashboardController creates a new dashboard controller
func NewDashboardController(
	userRepo *repository.UserRepository,
	transactionRepo *repository.TransactionRepository,
	withdrawalRepo *repository.WithdrawalRepository,
	kycRepo *repository.KYCRepository,
) *DashboardController {
	return &DashboardController{
		userRepo:        userRepo,
		transactionRepo: transactionRepo,
		withdrawalRepo:  withdrawalRepo,
		kycRepo:         kycRepo,
	}
}

// Dashboard renders the admin dashboard
func (c *DashboardController) Dashboard(ctx *gin.Context) {
	// Get dashboard data
	totalUsers, _ := c.userRepo.CountAll()

	// Get total deposits
	var totalDeposits float64 = 0
	depositTransactions, _ := c.transactionRepo.FindByTypeAndDate(
		model.TransactionTypeDeposit,
		// Start from a date far in the past
		// Get the current time
		// This is simplified for the example
		nil, // Replace with appropriate date range
		nil, // Replace with appropriate date range
	)
	for _, tx := range depositTransactions {
		if tx.Status == model.TransactionStatusCompleted {
			totalDeposits += tx.Amount
		}
	}

	// Get pending withdrawals count
	pendingWithdrawals, _ := c.withdrawalRepo.CountByStatus(model.WithdrawalStatusPending)

	// Get recent transactions
	recentTransactions, _ := c.transactionRepo.FindAll(10, 0) // Last 10 transactions

	// Get pending KYC verifications
	pendingKYC, _ := c.kycRepo.FindByStatus(model.KYCStatusPending, 10, 0) // Last 10 pending KYC docs

	ctx.HTML(http.StatusOK, "admin/dashboard.html", gin.H{
		"title":              "Admin Dashboard",
		"totalUsers":         totalUsers,
		"totalDeposits":      totalDeposits,
		"pendingWithdrawals": pendingWithdrawals,
		"recentTransactions": recentTransactions,
		"pendingKYC":         pendingKYC,
	})
}
