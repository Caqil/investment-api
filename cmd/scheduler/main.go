package main

import (
	"database/sql"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/Caqil/investment-api/config"
	"github.com/Caqil/investment-api/internal/cron"
	"github.com/Caqil/investment-api/internal/repository"
	"github.com/Caqil/investment-api/internal/service"
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
	notificationRepo := repository.NewNotificationRepository(db)

	// Initialize bonus service
	bonusService := service.NewBonusService(
		userRepo,
		transactionRepo,
		struct {
			DailyBonusPercentage     float64
			ReferralBonusAmount      float64
			ReferralProfitPercentage float64
		}{
			DailyBonusPercentage:     cfg.App.DailyBonusPercentage,
			ReferralBonusAmount:      cfg.App.ReferralBonusAmount,
			ReferralProfitPercentage: cfg.App.ReferralProfitPercentage,
		},
	)

	// Set the notification repository in the bonus service
	bonusService.SetNotificationRepo(notificationRepo)

	// Set up scheduled tasks
	cronManager := cron.NewCronManager(bonusService)
	cronManager.Start()

	// Log start message
	log.Println("Scheduler started successfully")

	// Wait for termination signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	// Shutdown gracefully
	log.Println("Shutting down scheduler...")
	cronManager.Stop()
	log.Println("Scheduler stopped")
}

// addDailyBonusJob is a manually triggered function to add daily bonuses
func addDailyBonusJob(db *sql.DB, cfg *config.Config) {
	userRepo := repository.NewUserRepository(db)
	transactionRepo := repository.NewTransactionRepository(db)
	notificationRepo := repository.NewNotificationRepository(db)

	bonusService := service.NewBonusService(
		userRepo,
		transactionRepo,
		struct {
			DailyBonusPercentage     float64
			ReferralBonusAmount      float64
			ReferralProfitPercentage float64
		}{
			DailyBonusPercentage:     cfg.App.DailyBonusPercentage,
			ReferralBonusAmount:      cfg.App.ReferralBonusAmount,
			ReferralProfitPercentage: cfg.App.ReferralProfitPercentage,
		},
	)

	// Set the notification repository in the bonus service
	bonusService.SetNotificationRepo(notificationRepo)

	log.Println("Starting manual daily bonus calculation...")
	err := bonusService.CalculateDailyBonusForAllUsers()
	if err != nil {
		log.Printf("Error calculating daily bonuses: %v", err)
		return
	}
	log.Println("Daily bonus calculation completed successfully")
}
