package main

import (
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

	// Connect to MongoDB
	mongoConn, err := database.NewMongoDBConnection(database.MongoDBConfig{
		URI:            cfg.Database.URI,
		Name:           cfg.Database.Name,
		ConnectTimeout: cfg.Database.ConnectTimeout,
		MaxPoolSize:    cfg.Database.MaxPoolSize,
	})
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer mongoConn.Close()

	// Initialize repositories
	userRepo := repository.NewUserRepository(mongoConn)
	transactionRepo := repository.NewTransactionRepository(mongoConn)
	notificationRepo := repository.NewNotificationRepository(mongoConn)
	settingRepo := repository.NewSettingRepository(mongoConn)

	// Initialize settings service
	settingService := service.NewSettingService(settingRepo)

	// Initialize bonus service with settings
	bonusService := service.NewBonusService(
		userRepo,
		transactionRepo,
		notificationRepo,
		settingService,
	)

	// Set up scheduled tasks
	cronManager := cron.InitScheduledTasks(bonusService, settingService)

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
func addDailyBonusJob(mongoConn *database.MongoDBConnection, cfg *config.Config) {
	// Initialize repositories
	userRepo := repository.NewUserRepository(mongoConn)
	transactionRepo := repository.NewTransactionRepository(mongoConn)
	notificationRepo := repository.NewNotificationRepository(mongoConn)
	settingRepo := repository.NewSettingRepository(mongoConn)

	// Initialize settings service
	settingService := service.NewSettingService(settingRepo)

	// Initialize bonus service
	bonusService := service.NewBonusService(
		userRepo,
		transactionRepo,
		notificationRepo,
		settingService,
	)

	log.Println("Starting manual daily bonus calculation...")
	err := bonusService.CalculateDailyBonusForAllUsers()
	if err != nil {
		log.Printf("Error calculating daily bonuses: %v", err)
		return
	}
	log.Println("Daily bonus calculation completed successfully")
}
