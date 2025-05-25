package admin

import (
	"github.com/Caqil/investment-api/config"
	"github.com/Caqil/investment-api/internal/interfaces"
	"github.com/Caqil/investment-api/internal/repository"
	"github.com/Caqil/investment-api/pkg/database"
	"github.com/Caqil/investment-api/pkg/utils"
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
	adminSetup := NewAdminSetup(f.MongoConn, f.Config)
	adminSetup.SetupAuth()
	return adminSetup
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
