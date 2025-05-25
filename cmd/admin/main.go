// File: cmd/admin/main.go - This is your entry point for the admin dashboard
package main

import (
	"log"
	"os"

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

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	transactionRepo := repository.NewTransactionRepository(db)
	withdrawalRepo := repository.NewWithdrawalRepository(db)
	kycRepo := repository.NewKYCRepository(db)
	planRepo := repository.NewPlanRepository(db)

	// Initialize admin application
	adminApp, err := admin.NewAdminApp(db, userRepo, transactionRepo, withdrawalRepo, kycRepo, planRepo, cfg)
	if err != nil {
		log.Fatalf("Failed to initialize admin app: %v", err)
	}

	// Start admin server
	port := os.Getenv("ADMIN_PORT")
	if port == "" {
		port = "9000"
	}

	log.Printf("Starting admin server on port %s", port)
	if err := adminApp.Run(port); err != nil {
		log.Fatalf("Failed to start admin server: %v", err)
	}
}
