package admin

import (
	"database/sql"

	"github.com/Caqil/investment-api/config"
	"github.com/Caqil/investment-api/internal/repository"
	"github.com/Caqil/investment-api/pkg/utils"
)

// Factory creates admin components
type Factory struct {
	DB         *sql.DB
	Config     *config.Config
	JWTManager *utils.JWTManager
}

// NewFactory creates a new admin factory
func NewFactory(db *sql.DB, cfg *config.Config, jwtManager *utils.JWTManager) *Factory {
	return &Factory{
		DB:         db,
		Config:     cfg,
		JWTManager: jwtManager,
	}
}

// CreateAdminSetup creates an admin setup
func (f *Factory) CreateAdminSetup() *AdminSetup {
	adminSetup := NewAdminSetup(f.DB, f.Config)
	adminSetup.SetupAuth()
	return adminSetup
}

// CreateAdminAuthController creates an admin auth controller
func (f *Factory) CreateAdminAuthController() *AdminAuthController {
	userRepo := repository.NewUserRepository(f.DB)
	return NewAdminAuthController(userRepo, f.JWTManager)
}

// CreateDashboardController creates a dashboard controller
func (f *Factory) CreateDashboardController() *DashboardController {
	userRepo := repository.NewUserRepository(f.DB)
	transactionRepo := repository.NewTransactionRepository(f.DB)
	withdrawalRepo := repository.NewWithdrawalRepository(f.DB)
	kycRepo := repository.NewKYCRepository(f.DB)

	return NewDashboardController(
		userRepo,
		transactionRepo,
		withdrawalRepo,
		kycRepo,
	)
}
