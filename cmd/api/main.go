package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Caqil/investment-api/config"
	"github.com/Caqil/investment-api/internal/app"
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
	mongoConn, err := database.NewMongoDBConnection(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer mongoConn.Close()

	// Run MongoDB migrations
	if err := database.RunMongoDBMigrations(mongoConn); err != nil {
		log.Fatalf("Failed to run MongoDB migrations: %v", err)
	}
	log.Println("MongoDB migrations completed successfully")

	// Initialize application
	application := app.NewApp(cfg, mongoConn)
	router := application.SetupRoutes()

	// Ensure directories exist
	ensureDirectoriesExist()

	// Configure server
	server := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Server starting on port %s", cfg.Server.Port)
		log.Printf("Admin interface available at http://localhost:%s/admin", cfg.Server.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Server is shutting down...")

	// Create a deadline to wait for
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Shutdown server
	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited properly")
}

// ensureDirectoriesExist makes sure all required directories exist
func ensureDirectoriesExist() {
	// List of directories to ensure
	dirs := []string{
		"public",
		"public/admin",
		"public/admin/css",
		"public/admin/js",
		"public/admin/images",
		"public/static",
		"templates",
		"templates/admin",
	}

	// Create directories if they don't exist
	for _, dir := range dirs {
		if _, err := os.Stat(dir); os.IsNotExist(err) {
			err = os.MkdirAll(dir, 0755)
			if err != nil {
				log.Printf("Warning: Failed to create directory %s: %v", dir, err)
			}
		}
	}
}
