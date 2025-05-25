package main

import (
	"context"
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
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

	// Connect to database
	db, err := database.NewMySQLConnection(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Run database migrations
	if err := runMigrations(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}
	log.Println("Database migrations completed successfully")

	// Initialize application
	application := app.NewApp(cfg, db)
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

// runMigrations executes the SQL migrations from the migrations directory
func runMigrations(db *sql.DB) error {
	// Read migration file
	migrationContent, err := ioutil.ReadFile("migrations/schema.sql")
	if err != nil {
		return fmt.Errorf("error reading migration file: %v", err)
	}

	// Split the content by semicolon to get individual statements
	// Make sure to handle multi-line statements properly
	content := string(migrationContent)

	// First handle the CREATE DATABASE and USE statements
	if strings.Contains(content, "CREATE DATABASE") {
		dbStatements := []string{
			"CREATE DATABASE IF NOT EXISTS investment_app;",
			"USE investment_app;",
		}

		for _, stmt := range dbStatements {
			_, err = db.Exec(stmt)
			if err != nil {
				log.Printf("Warning during database setup: %v", err)
			}
		}
	}

	// Extract all CREATE TABLE and INSERT statements
	statements := extractSQLStatements(content)

	// Execute each statement in a transaction where possible
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %v", err)
	}

	for _, statement := range statements {
		// Skip empty statements
		if statement == "" {
			continue
		}

		// Execute the statement
		_, err = tx.Exec(statement)
		if err != nil {
			// Some errors might be expected (like table already exists)
			// Log them but continue with migrations
			log.Printf("Warning during migration: %v", err)
			// Don't rollback the transaction for expected errors
		}
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit migration transaction: %v", err)
	}

	return nil
}

// extractSQLStatements parses the SQL file and extracts valid SQL statements
func extractSQLStatements(content string) []string {
	// Split by semicolon but respect statement boundaries
	var statements []string
	var currentStatement strings.Builder

	lines := strings.Split(content, "\n")
	for _, line := range lines {
		// Skip comment lines
		trimmedLine := strings.TrimSpace(line)
		if strings.HasPrefix(trimmedLine, "--") || trimmedLine == "" {
			continue
		}

		// Append the line to the current statement
		currentStatement.WriteString(line)
		currentStatement.WriteString(" ")

		// If the line contains a semicolon, it's the end of a statement
		if strings.Contains(line, ";") {
			statements = append(statements, strings.TrimSpace(currentStatement.String()))
			currentStatement.Reset()
		}
	}

	// Add the last statement if there is one
	if currentStatement.Len() > 0 {
		statements = append(statements, strings.TrimSpace(currentStatement.String()))
	}

	return statements
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
