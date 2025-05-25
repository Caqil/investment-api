package admin

import (
	"net/http"
	"time"

	"github.com/Caqil/investment-api/internal/interfaces"
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

// Make sure DashboardController implements the DashboardInterface
var _ interfaces.DashboardInterface = (*DashboardController)(nil)

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
func (c *DashboardController) Dashboard(ctx *gin.Context) {
	// Get dashboard data
	totalUsers, _ := c.userRepo.CountAll()

	// Get total deposits
	var totalDeposits float64 = 0
	startDate := time.Date(2000, 1, 1, 0, 0, 0, 0, time.UTC) // A date far in the past
	endDate := time.Now()

	depositTransactions, _ := c.transactionRepo.FindByTypeAndDate(
		model.TransactionTypeDeposit,
		&startDate,
		&endDate,
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

	// Make sure we're using the exact template name that's loaded
	ctx.HTML(http.StatusOK, "admin/dashboard.html", gin.H{
		"title":              "Admin Dashboard",
		"totalUsers":         totalUsers,
		"totalDeposits":      totalDeposits,
		"pendingWithdrawals": pendingWithdrawals,
		"recentTransactions": recentTransactions,
		"pendingKYC":         pendingKYC,
	})
}
