package admin

import (
	"net/http"

	"github.com/Caqil/investment-api/config"
	"github.com/Caqil/investment-api/internal/interfaces"
	"github.com/Caqil/investment-api/internal/repository"
	"github.com/Caqil/investment-api/pkg/database"
	"github.com/Caqil/investment-api/pkg/utils"
	"github.com/gin-gonic/gin"
)

// Factory creates admin components
type Factory struct {
	MongoConn  *database.MongoDBConnection
	Config     *config.Config
	JWTManager *utils.JWTManager
}

// NewFactory creates a new admin factory
func NewFactory(mongoConn *database.MongoDBConnection, cfg *config.Config, jwtManager *utils.JWTManager) *Factory {
	return &Factory{
		MongoConn:  mongoConn,
		Config:     cfg,
		JWTManager: jwtManager,
	}
}

// CreateAdminSetup creates an admin setup
func (f *Factory) CreateAdminSetup() interfaces.AdminInterface {
	// Return a simple admin implementation that doesn't use QOR
	return &SimpleAdminSetup{}
}

// CreateAdminAuthController creates an admin auth controller
func (f *Factory) CreateAdminAuthController() interfaces.AdminAuthInterface {
	userRepo := repository.NewUserRepository(f.MongoConn)
	return NewAdminAuthController(userRepo, f.JWTManager)
}

// CreateDashboardController creates a dashboard controller
func (f *Factory) CreateDashboardController() interfaces.DashboardInterface {
	userRepo := repository.NewUserRepository(f.MongoConn)
	transactionRepo := repository.NewTransactionRepository(f.MongoConn)
	withdrawalRepo := repository.NewWithdrawalRepository(f.MongoConn)
	kycRepo := repository.NewKYCRepository(f.MongoConn)

	return NewDashboardController(
		userRepo,
		transactionRepo,
		withdrawalRepo,
		kycRepo,
	)
}

// SimpleAdminSetup is a basic implementation that doesn't use QOR Admin
type SimpleAdminSetup struct{}

// MountTo mounts the admin interface to the given path
func (s *SimpleAdminSetup) MountTo(mountPath string, router *gin.Engine) {
	// Use a more specific path to avoid conflict with the root /admin path
	// Change from router.GET(mountPath, ...) to router.GET(mountPath + "/dashboard", ...)
	router.GET(mountPath+"/dashboard", func(c *gin.Context) {
		c.HTML(http.StatusOK, "admin/dashboard.html", gin.H{
			"title":              "Admin Dashboard",
			"totalUsers":         0,
			"totalDeposits":      0,
			"pendingWithdrawals": 0,
			"recentTransactions": []interface{}{},
			"pendingKYC":         []interface{}{},
		})
	})
}

// SetupAuth sets up authentication for the admin interface
func (s *SimpleAdminSetup) SetupAuth() {
	// No-op for simple implementation
}
