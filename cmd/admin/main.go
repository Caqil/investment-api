package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/Caqil/investment-api/config"
	"github.com/Caqil/investment-api/internal/admin"
	"github.com/Caqil/investment-api/internal/repository"
	"github.com/Caqil/investment-api/pkg/database"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found or cannot be loaded: %v", err)
	}

	// Load configuration
	cfg := config.NewConfig()

	// Connect to database
	db, err := database.NewMySQLConnection(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize GORM DB
	gormDB, err := admin.GORMAdapter(db, "mysql")
	if err != nil {
		log.Fatalf("Failed to initialize GORM: %v", err)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	transactionRepo := repository.NewTransactionRepository(db)
	withdrawalRepo := repository.NewWithdrawalRepository(db)
	kycRepo := repository.NewKYCRepository(db)

	// Initialize admin controller
	adminController := admin.NewAdminController(
		gormDB,
		userRepo,
		transactionRepo,
		withdrawalRepo,
		kycRepo,
	)

	// Set up admin
	adminConfig := &admin.AdminConfig{
		DB:             gormDB,
		Port:           "9000", // Use a different port than your API
		UserRepository: userRepo,
		JWTSecret:      cfg.JWT.Secret,
	}

	// Initialize admin
	adminInstance := admin.SetupAdmin(adminConfig)

	// Register custom routes
	adminController.RegisterRoutes(adminInstance)

	// Start admin server in a goroutine
	go func() {
		log.Printf("Admin interface starting on port %s", adminConfig.Port)
		admin.RunAdmin(adminInstance, adminConfig.Port)
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Admin server is shutting down...")
}
